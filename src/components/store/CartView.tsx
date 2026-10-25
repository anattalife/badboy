'use client'

import Link from 'next/link'
import { startTransition, useEffect, useState } from 'react'

import { priceCart, type PricedCart } from '@/app/(frontend)/store-actions'

import { setQty, useCart } from './cart'

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** Fetches server prices whenever the cart changes. */
export function usePricedCart() {
  const items = useCart()
  const [priced, setPriced] = useState<PricedCart | null>(null)
  const key = JSON.stringify(items)
  useEffect(() => {
    let live = true
    startTransition(async () => {
      const result = await priceCart(JSON.parse(key))
      if (live) setPriced(result)
    })
    return () => {
      live = false
    }
  }, [key])
  return { items, priced }
}

export function CartView({ phone }: { phone: string }) {
  const { items, priced } = usePricedCart()

  if (!items.length) {
    return (
      <div className="rounded-[var(--radius-plate)] bg-fescue p-8">
        <p className="text-lg">Your cart is empty.</p>
        <Link href="/parts" className="btn btn-primary mt-4">
          Shop parts
        </Link>
      </div>
    )
  }
  if (!priced) return <p className="text-steel">Loading your cart…</p>

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <ul className="divide-y divide-haze border-y border-haze">
          {priced.lines.map((line) => (
            <li key={line.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-48 flex-1">
                <p className="font-semibold">{line.name}</p>
                {line.partNumber ? <p className="text-sm text-steel">Part {line.partNumber}</p> : null}
                <p className="text-sm text-steel">{usd(line.unitPrice)} each</p>
              </div>
              <label className="text-sm">
                <span className="sr-only">Quantity for {line.name}</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={line.qty}
                  onChange={(e) => setQty(line.id, Number(e.target.value) || 0)}
                  className="w-20 rounded-[var(--radius-plate)] border border-steel-light px-3 py-2"
                />
              </label>
              <p className="w-24 text-right font-semibold">{usd(line.lineTotal)}</p>
              <button type="button" onClick={() => setQty(line.id, 0)} className="text-sm text-steel underline">
                Remove<span className="sr-only"> {line.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {priced.unavailable.length ? (
          <div className="mt-6 rounded-[var(--radius-plate)] border-l-4 border-signal bg-[#fff1e8] p-4">
            <p className="font-semibold">These can’t be ordered online:</p>
            <ul className="mt-2 space-y-2">
              {priced.unavailable.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {u.name}: <span className="text-steel">{u.reason}</span>
                  </span>
                  <button type="button" onClick={() => setQty(u.id, 0)} className="text-sm underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="h-fit rounded-[var(--radius-plate)] border border-haze bg-white p-6">
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-bold">{usd(priced.subtotal)}</span>
        </div>
        <p className="mt-1 text-sm text-steel">UPS shipping and any sales tax are calculated at checkout.</p>
        {priced.checkoutOpen ? (
          priced.lines.length && !priced.unavailable.length ? (
            <Link href="/checkout" className="btn btn-primary mt-5 w-full">
              Check out
            </Link>
          ) : (
            <p className="mt-5 text-sm font-medium text-signal-deep">
              Remove the parts that can’t be ordered online to check out.
            </p>
          )
        ) : (
          <p className="mt-5 text-sm">
            {priced.closedReason}{' '}
            <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-semibold underline">
              {phone}
            </a>
          </p>
        )}
        <Link href="/parts" className="mt-4 block text-center text-sm font-semibold text-ridge underline">
          Keep shopping
        </Link>
      </aside>
    </div>
  )
}
