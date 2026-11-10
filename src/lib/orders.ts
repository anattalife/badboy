import 'server-only'

import { sql } from '@payloadcms/db-d1-sqlite'

import { readConnections } from './connections'
import { alertEmail } from './email'
import { getPayloadClient } from './payload'
import { type CheckoutSession, getCheckoutSession } from './stripe'

/*
 * Order helpers that must never be callable from the browser. Keep them out of 'use server'
 * files: every export there becomes a public endpoint.
 */

export async function storeSettings() {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'store-settings', overrideAccess: true })
}

/**
 * Marks an order paid, updates stock counts, alerts the shop and emails the customer. Runs once per
 * order even if the payment webhook and the customer's return to the site arrive together: the
 * status change is claimed with a single conditional UPDATE. Returns false if already handled.
 */
export async function markOrderPaid(
  orderId: number,
  provider: string,
  reference: string,
  siteUrl: string,
) {
  const payload = await getPayloadClient()
  const claimed = await claimOrder(orderId)
  if (!claimed) return false
  const order = await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: { status: 'paid', payment: { provider, reference, paidAt: new Date().toISOString() } },
  })

  for (const item of order.items ?? []) {
    const partId = typeof item.part === 'object' ? item.part?.id : item.part
    if (!partId) continue
    const part = await payload
      .findByID({ collection: 'parts', id: partId, depth: 0, overrideAccess: true })
      .catch((): null => null)
    if (part?.stockQty != null) {
      await payload.update({
        collection: 'parts',
        id: partId,
        overrideAccess: true,
        data: { stockQty: Math.max(0, part.stockQty - item.qty) },
      })
    }
  }

  try {
    const [store, site] = await Promise.all([
      storeSettings(),
      payload.findGlobal({ slug: 'site-settings', overrideAccess: true }),
    ])
    const to = store.orderEmail || site.leadEmail
    if (to) {
      await payload.sendEmail({
        to,
        replyTo: order.email,
        subject: `New parts order ${order.orderNumber} — $${order.total.toFixed(2)}`,
        ...alertEmail(
          `New parts order ${order.orderNumber}`,
          [
            ['Customer', order.customerName],
            ['Email', order.email],
            ['Phone', order.phone],
            [
              'Ship to',
              `${order.shipTo.street}${order.shipTo.street2 ? `, ${order.shipTo.street2}` : ''}\n${order.shipTo.city}, ${order.shipTo.state} ${order.shipTo.zip}`,
            ],
            [
              'Items',
              (order.items ?? [])
                .map((i) => `${i.qty} × ${i.name}${i.partNumber ? ` (${i.partNumber})` : ''}`)
                .join('\n'),
            ],
            ['Shipping', `${order.shippingService} — $${order.shippingAmount.toFixed(2)}`],
            ['Total', `$${order.total.toFixed(2)}`],
            ['Payment', `${provider} ${reference}`],
            ['Notes', order.customerNotes],
          ],
          `${siteUrl}/admin/collections/orders/${order.id}`,
        ),
      })
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: `Order alert email failed for ${order.orderNumber}` })
  }

  // The customer's own confirmation.
  try {
    const site = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true, depth: 0 })
    const storeName = site.siteName ?? 'Parts store'
    await payload.sendEmail({
      to: order.email,
      replyTo: (await storeSettings()).orderEmail || site.leadEmail || undefined,
      subject: `${storeName}: order ${order.orderNumber} confirmed`,
      ...alertEmail(
        `Thanks for your order, ${order.customerName.split(' ')[0]}`,
        [
          ['Order', order.orderNumber],
          ['Items', (order.items ?? []).map((i) => `${i.qty} × ${i.name}`).join('\n')],
          ['Shipping', `${order.shippingService} — $${order.shippingAmount.toFixed(2)}`],
          ['Tax', order.taxAmount ? `$${order.taxAmount.toFixed(2)}` : undefined],
          ['Total paid', `$${order.total.toFixed(2)}`],
          [
            'Ship to',
            `${order.shipTo.street}${order.shipTo.street2 ? `, ${order.shipTo.street2}` : ''}\n${order.shipTo.city}, ${order.shipTo.state} ${order.shipTo.zip}`,
          ],
          ['Questions', site.phone ? `Call ${site.phone}` : undefined],
        ],
        `${siteUrl}/order/${order.orderNumber}?t=${order.accessToken}`,
        'View your order',
        `We’ve received your payment and will email again when it ships. — ${storeName}`,
      ),
    })
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: `Customer confirmation email failed for ${order.orderNumber}`,
    })
  }
  return true
}

/** Flips an order to paid exactly once (pending or expired/cancelled orders only). */
async function claimOrder(orderId: number): Promise<boolean> {
  const payload = await getPayloadClient()
  const db = (payload.db as unknown as { drizzle?: { run: (q: unknown) => Promise<unknown> } })
    .drizzle
  if (db) {
    const result = (await db.run(
      sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId} AND status IN ('pending-payment', 'cancelled')`,
    )) as { meta?: { changes?: number }; rowsAffected?: number; changes?: number }
    const changes = result?.meta?.changes ?? result?.rowsAffected ?? result?.changes
    if (typeof changes === 'number') return changes > 0
  }
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
  })
  return order.status === 'pending-payment' || order.status === 'cancelled'
}

/**
 * Checks a Stripe order with Stripe and marks it paid if the customer has paid. Used when the
 * customer lands back on the order page (so it doesn't depend on the webhook) and by the webhook.
 */
export async function confirmStripeOrder(orderId: number, siteUrl: string) {
  const payload = await getPayloadClient()
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
  })
  if (order.status !== 'pending-payment' || order.payment?.provider !== 'stripe')
    return order.status
  const sessionId = order.payment?.reference
  if (!sessionId?.startsWith('cs_')) return order.status
  const { stripe } = await readConnections(payload)
  if (!stripe) return order.status
  const session = await getCheckoutSession(stripe.secretKey, sessionId)
  return applyCheckoutSession(session, siteUrl)
}

/** Applies a Checkout Session from Stripe to its order (paid, or expired → cancelled). */
export async function applyCheckoutSession(session: CheckoutSession, siteUrl: string) {
  const payload = await getPayloadClient()
  const orderId = Number(session.metadata?.order_id ?? session.client_reference_id)
  if (!Number.isInteger(orderId)) return null
  const order = await payload
    .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
    .catch((): null => null)
  if (!order) return null
  if (session.payment_status === 'paid') {
    // Never trust an amount we didn't ask for.
    if (
      session.amount_total !== Math.round(order.total * 100) ||
      (session.currency ?? 'usd') !== 'usd'
    ) {
      payload.logger.error({
        msg: `Stripe amount ${session.amount_total} doesn’t match order ${order.orderNumber} (${order.total}); left for staff to check.`,
      })
      return order.status
    }
    await markOrderPaid(order.id, 'stripe', session.payment_intent ?? session.id, siteUrl)
    return 'paid'
  }
  if (session.status === 'expired' && order.status === 'pending-payment') {
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { status: 'cancelled' },
    })
    return 'cancelled'
  }
  return order.status
}

/** Marks an order refunded when its whole Stripe charge was refunded (partial refunds: staff note). */
export async function applyStripeRefund(charge: {
  payment_intent?: string | null
  amount: number
  amount_refunded: number
  refunded?: boolean
}) {
  if (!charge.payment_intent) return
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { 'payment.provider': { equals: 'stripe' } },
        { 'payment.reference': { equals: charge.payment_intent } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const order = docs[0]
  if (!order) return
  const full = charge.refunded || charge.amount_refunded >= charge.amount
  await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: full
      ? { status: 'refunded' }
      : {
          staffNotes: [
            ...(order.staffNotes ?? []),
            {
              note: `Partly refunded in Stripe: $${(charge.amount_refunded / 100).toFixed(2)} so far.`,
            },
          ],
        },
  })
}
