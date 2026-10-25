'use client'

import { useSyncExternalStore } from 'react'

/*
 * The cart lives in this browser (localStorage) as part IDs and quantities only.
 * Prices are always looked up on the server.
 */
export type CartItem = { id: number; qty: number }

const KEY = 'rm-cart'
const EVENT = 'rm-cart-change'
const EMPTY: CartItem[] = []
let cachedRaw: string | null = null
let cachedValue: CartItem[] = EMPTY

export function readCart(): CartItem[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    return EMPTY
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    const parsed = JSON.parse(raw ?? '[]')
    cachedValue = Array.isArray(parsed)
      ? parsed
          .filter((i) => Number.isInteger(i?.id) && Number.isInteger(i?.qty) && i.qty > 0)
          .slice(0, 50)
      : EMPTY
  } catch {
    cachedValue = EMPTY
  }
  return cachedValue
}

export function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.filter((i) => i.qty > 0)))
  } catch {
    // Storage blocked (private mode): the cart just won't persist between pages.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function addToCart(id: number, qty = 1) {
  const items = readCart()
  const existing = items.find((i) => i.id === id)
  writeCart(
    existing
      ? items.map((i) => (i.id === id ? { ...i, qty: Math.min(20, i.qty + qty) } : i))
      : [...items, { id, qty: Math.min(20, qty) }],
  )
}

export function setQty(id: number, qty: number) {
  writeCart(readCart().map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.min(20, qty)) } : i)))
}

export const clearCart = () => writeCart([])

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export const useCart = () => useSyncExternalStore(subscribe, readCart, () => EMPTY)
