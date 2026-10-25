/**
 * Payment step for parts orders.
 *
 * The shop's card processor hasn't been chosen yet, so only a demo-only "test" provider exists.
 * It never runs in production: there, checkout stays closed until a real provider is added here.
 *
 * To add the shop's processor, implement `PaymentProvider` (usually: create a hosted checkout
 * session and return its URL, then confirm payment in a webhook route that marks the order paid).
 */

export type PaymentRequest = {
  orderNumber: string
  totalCents: number
  email: string
  returnUrl: string
}

export type PaymentResult =
  | { kind: 'paid'; reference: string }
  | { kind: 'redirect'; url: string }

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

/** The active provider, or null when online payment isn't available. */
export function getPaymentProvider(): PaymentProvider | null {
  const configured = process.env.PAYMENT_PROVIDER
  if (process.env.NODE_ENV === 'production') {
    // No real provider is implemented yet; never fall back to the test provider in production.
    return null
  }
  if (!configured || configured === 'test') return testProvider
  return null
}
