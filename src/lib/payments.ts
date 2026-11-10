/**
 * Payment step for parts orders.
 *
 * - Stripe: when the dealer has connected it in Store settings → Card payments. The customer is
 *   sent to Stripe Checkout; the order is marked paid by the webhook (src/app/(frontend)/webhooks/
 *   stripe) or when the customer comes back to the order page, whichever happens first.
 * - "test": demo only, never in production. Marks the order paid without a card.
 * Without Stripe in production there's no provider and checkout stays closed ("Call to order").
 */
import type { StripeConnection } from './connections'
import { buildCheckoutSession, type CheckoutLine, createCheckoutSession } from './stripe'

export type PaymentRequest = {
  orderId: number
  orderNumber: string
  totalCents: number
  email: string
  lines: CheckoutLine[]
  returnUrl: string
  cancelUrl: string
  storeName: string
}

export type PaymentResult =
  { kind: 'paid'; reference: string } | { kind: 'redirect'; url: string; reference: string }

export type PaymentProvider = {
  id: string
  label: string
  start: (req: PaymentRequest) => Promise<PaymentResult>
}

const testProvider: PaymentProvider = {
  id: 'test',
  label: 'Test payment (demo only, no card charged)',
  async start(req) {
    return { kind: 'paid', reference: `TEST-${req.orderNumber}` }
  },
}

export const stripeProvider = (conn: StripeConnection): PaymentProvider => ({
  id: 'stripe',
  label: conn.live
    ? 'Pay by card (secure checkout by Stripe)'
    : 'Pay by card: Stripe TEST MODE, use card 4242 4242 4242 4242',
  async start(req) {
    const sum = req.lines.reduce((s, l) => s + l.unitCents * l.qty, 0)
    if (sum !== req.totalCents)
      throw new Error(
        `Order ${req.orderNumber}: line items (${sum}) don’t add up to the total (${req.totalCents}).`,
      )
    const session = await createCheckoutSession(
      conn.secretKey,
      buildCheckoutSession({
        orderId: req.orderId,
        orderNumber: req.orderNumber,
        email: req.email,
        lines: req.lines,
        successUrl: req.returnUrl,
        cancelUrl: req.cancelUrl,
        storeName: req.storeName,
      }),
    )
    if (!session.url) throw new Error('Stripe didn’t return a checkout page.')
    return { kind: 'redirect', url: session.url, reference: session.id }
  },
})

/** The active provider, or null when online payment isn't available. */
export function getPaymentProvider(stripe: StripeConnection | null): PaymentProvider | null {
  if (stripe) return stripeProvider(stripe)
  if (process.env.NODE_ENV === 'production') return null
  const configured = process.env.PAYMENT_PROVIDER
  return !configured || configured === 'test' ? testProvider : null
}
