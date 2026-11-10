import { readConnections } from '@/lib/connections'
import { applyCheckoutSession, applyStripeRefund } from '@/lib/orders'
import { getPayloadClient } from '@/lib/payload'
import type { CheckoutSession } from '@/lib/stripe'
import { verifyWebhook } from '@/lib/stripe'

/**
 * Stripe payment notifications. Created automatically when the dealer saves their Stripe key
 * (Store settings → Card payments). Every request is checked against the webhook's signing secret.
 */
export async function POST(request: Request) {
  const body = await request.text()
  const payload = await getPayloadClient()
  const { stripe } = await readConnections(payload)
  if (!stripe?.webhookSecret) return new Response('Not configured', { status: 404 })

  const event = await verifyWebhook<{ type: string; data: { object: unknown } }>(
    body,
    request.headers.get('stripe-signature'),
    stripe.webhookSecret,
  )
  if (!event) return new Response('Bad signature', { status: 400 })

  const siteUrl = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.expired':
        await applyCheckoutSession(event.data.object as CheckoutSession, siteUrl)
        break
      case 'charge.refunded':
        await applyStripeRefund(event.data.object as Parameters<typeof applyStripeRefund>[0])
        break
      default:
        break
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: `Stripe webhook ${event.type} failed` })
    // Stripe retries failed deliveries for up to three days.
    return new Response('Error', { status: 500 })
  }
  return Response.json({ received: true })
}
