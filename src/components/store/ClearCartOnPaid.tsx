'use client'

import { useEffect } from 'react'

import { clearCart } from './cart'

/** Empties the cart once the order page shows the order as paid (after Stripe's payment page). */
export function ClearCartOnPaid(): null {
  useEffect(() => {
    clearCart()
  }, [])
  return null
}
