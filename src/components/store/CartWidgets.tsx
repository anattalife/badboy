'use client'

import Link from 'next/link'
import { useState } from 'react'

import { addToCart, useCart } from './cart'

export function CartLink() {
  const items = useCart()
  const count = items.reduce((n, i) => n + i.qty, 0)
  return (
    <Link href="/cart" className="relative rounded-md px-3 py-2 font-medium text-ink hover:bg-fescue">
      Cart
      {count ? (
        <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-signal px-1.5 text-xs font-bold text-white">
          {count}
          <span className="sr-only"> items</span>
        </span>
      ) : null}
    </Link>
  )
}

export function AddToCart({ id, name, compact = false }: { id: number; name: string; compact?: boolean }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const add = () => {
    addToCart(id, qty)
    setAdded(true)
  }

  if (compact) {
    return (
      <button type="button" onClick={add} className="btn btn-primary relative z-10 min-h-10 px-4 text-sm">
        {added ? 'Added ✓' : 'Add to cart'}
        <span className="sr-only"> {name}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm font-medium">
        Quantity
        <input
          type="number"
          min={1}
          max={20}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="mt-1 block w-20 rounded-[var(--radius-plate)] border border-steel-light px-3 py-2.5"
        />
      </label>
      <button type="button" onClick={add} className="btn btn-primary">
        Add to cart
      </button>
      {added ? (
        <p role="status" className="w-full text-sm font-semibold text-field">
          Added to your cart.{' '}
          <Link href="/cart" className="underline">
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  )
}
