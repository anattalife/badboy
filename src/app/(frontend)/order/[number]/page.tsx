import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageIntro } from '@/components/PageIntro'
import { telHref } from '@/lib/format'
import { getPayloadClient, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** Constant-time comparison so the link token can't be guessed by timing. */
function sameToken(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const STATUS: Record<string, string> = {
  'pending-payment': 'Awaiting payment',
  paid: 'Paid — we’re packing it',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export default async function OrderPage(props: PageProps<'/order/[number]'>) {
  const { number } = await props.params
  const { t } = await props.searchParams
  if (typeof t !== 'string' || t.length < 20) notFound()

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: number.slice(0, 40) } },
    limit: 1,
    depth: 0,
    overrideAccess: true, // the secret link token below is the access check
  })
  const order = docs[0]
  if (!order || !sameToken(order.accessToken, t)) notFound()
  const settings = await getSiteSettings()

  return (
    <>
      <PageIntro
        title={order.status === 'paid' || order.status === 'shipped' ? 'Thank you for your order' : `Order ${order.orderNumber}`}
        lede={`Order ${order.orderNumber} · ${STATUS[order.status] ?? order.status}. Save this page; its address is your link to this order.`}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section>
            <h2 className="type-decal-md text-xl text-ridge">Items</h2>
            <ul className="mt-3 divide-y divide-haze border-y border-haze">
              {(order.items ?? []).map((i) => (
                <li key={i.id ?? i.name} className="flex justify-between gap-4 py-3">
                  <span>
                    {i.qty} × {i.name}
                    {i.partNumber ? <span className="block text-sm text-steel">Part {i.partNumber}</span> : null}
                  </span>
                  <span className="font-semibold">{usd(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="type-decal-md text-xl text-ridge">Shipping to</h2>
            <p className="mt-2">
              {order.customerName}
              <br />
              {order.shipTo.street}
              {order.shipTo.street2 ? `, ${order.shipTo.street2}` : ''}
              <br />
              {order.shipTo.city}, {order.shipTo.state} {order.shipTo.zip}
            </p>
            <p className="mt-2 text-steel">{order.shippingService}</p>
            {order.trackingNumber ? (
              <p className="mt-2">
                UPS tracking:{' '}
                <a
                  href={`https://www.ups.com/track?tracknum=${encodeURIComponent(order.trackingNumber)}`}
                  className="font-semibold text-ridge underline"
                >
                  {order.trackingNumber}
                </a>
              </p>
            ) : null}
          </section>
        </div>
        <aside className="h-fit space-y-3 rounded-[var(--radius-plate)] border border-haze bg-white p-6">
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{usd(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{order.shippingAmount === 0 ? 'Free' : usd(order.shippingAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Sales tax</dt>
              <dd>{usd(order.taxAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-haze pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd>{usd(order.total)}</dd>
            </div>
          </dl>
          <p className="text-sm text-steel">
            Questions? Call{' '}
            <a href={telHref(settings.phone)} className="font-semibold text-ink underline">
              {settings.phone}
            </a>{' '}
            and mention order {order.orderNumber}.
          </p>
          <Link href="/parts" className="btn btn-quiet w-full text-ridge">
            Keep shopping
          </Link>
        </aside>
      </div>
    </>
  )
}
