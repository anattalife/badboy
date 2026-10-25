import 'server-only'

import { alertEmail } from './email'
import { getPayloadClient } from './payload'

/*
 * Order helpers that must never be callable from the browser. Keep them out of 'use server'
 * files: every export there becomes a public endpoint.
 */

export async function storeSettings() {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'store-settings', overrideAccess: true })
}

/** Marks an order paid, updates stock counts and alerts the shop. Also used by payment webhooks. */
export async function markOrderPaid(orderId: number, provider: string, reference: string, siteUrl: string) {
  const payload = await getPayloadClient()
  const order = await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: { status: 'paid', payment: { provider, reference, paidAt: new Date().toISOString() } },
  })

  for (const item of order.items ?? []) {
    const partId = typeof item.part === 'object' ? item.part?.id : item.part
    if (!partId) continue
    const part = await payload.findByID({ collection: 'parts', id: partId, depth: 0, overrideAccess: true }).catch((): null => null)
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
            ['Items', (order.items ?? []).map((i) => `${i.qty} × ${i.name}${i.partNumber ? ` (${i.partNumber})` : ''}`).join('\n')],
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
}
