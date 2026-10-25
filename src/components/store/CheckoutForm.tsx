'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'

import {
  getShippingRates,
  placeOrder,
  type PlaceOrderState,
  type RatesState,
} from '@/app/(frontend)/store-actions'
import type { FormState } from '@/lib/forms'

import { FormMessage, SpamGuard, TextAreaField, TextField } from '../forms/Fields'
import { clearCart } from './cart'
import { usePricedCart } from './CartView'

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function CheckoutForm({ siteKey, renderedAt }: { siteKey: string | null; renderedAt: number }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const { items, priced } = usePricedCart()
  const [rates, setRates] = useState<RatesState>({ status: 'idle' })
  const [selected, setSelected] = useState<string | null>(null)
  const [order, setOrder] = useState<PlaceOrderState>({ status: 'idle' })
  const [loadingRates, startRates] = useTransition()
  const [placing, startPlacing] = useTransition()

  const fieldErrors =
    (order.status === 'error' && order.fieldErrors) || (rates.status === 'error' && rates.fieldErrors) || {}
  const message: FormState =
    order.status === 'error'
      ? { status: 'error', message: order.message }
      : rates.status === 'error'
        ? { status: 'error', message: rates.message }
        : { status: 'idle' }

  // Any change to the address invalidates the quoted rates.
  const resetRates = () => {
    if (rates.status !== 'idle') setRates({ status: 'idle' })
    setSelected(null)
  }

  const requestRates = () => {
    if (!formRef.current) return
    const data = new FormData(formRef.current)
    setOrder({ status: 'idle' })
    startRates(async () => {
      const result = await getShippingRates(items, data)
      setRates(result)
      setSelected(result.status === 'ok' ? result.options[0].code : null)
    })
  }

  const chosen = rates.status === 'ok' ? rates.options.find((o) => o.code === selected) : undefined

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
  if (!priced) return <p className="text-steel">Loading…</p>
  if (!priced.checkoutOpen || priced.unavailable.length || !priced.lines.length) {
    return (
      <div className="rounded-[var(--radius-plate)] bg-fescue p-8">
        <p className="text-lg">{priced.closedReason ?? 'Some items in your cart need attention before checkout.'}</p>
        <Link href="/cart" className="btn btn-quiet mt-4 text-ridge">
          Back to cart
        </Link>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        if (!chosen) return requestRates()
        const data = new FormData(e.currentTarget)
        data.set('quote', chosen.token)
        startPlacing(async () => {
          const result = await placeOrder(items, data)
          setOrder(result)
          if (result.status === 'done') {
            clearCart()
            router.push(result.redirectTo)
          }
        })
      }}
      className="relative grid gap-10 lg:grid-cols-[1fr_24rem]"
      noValidate
    >
      <div className="space-y-8">
        <FormMessage state={message} />

        <fieldset className="space-y-5 rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-7" onChange={resetRates}>
          <legend className="type-decal-md px-1 text-xl text-ridge">Ship to</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Full name" required autoComplete="name" error={fieldErrors.name} className="sm:col-span-2" />
            <TextField name="email" label="Email" type="email" required autoComplete="email" hint="For your order confirmation." error={fieldErrors.email} />
            <TextField name="phone" label="Phone" type="tel" autoComplete="tel" hint="UPS may call about delivery." error={fieldErrors.phone} />
          </div>
          <TextField name="street" label="Street address" required autoComplete="address-line1" error={fieldErrors.street} />
          <TextField name="street2" label="Apt, suite, etc." autoComplete="address-line2" />
          <div className="grid gap-5 sm:grid-cols-[1fr_6rem_8rem]">
            <TextField name="city" label="City" required autoComplete="address-level2" error={fieldErrors.city} />
            <TextField name="state" label="State" required maxLength={2} autoComplete="address-level1" error={fieldErrors.state} />
            <TextField name="zip" label="ZIP" required inputMode="numeric" maxLength={10} autoComplete="postal-code" error={fieldErrors.zip} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="business" className="h-5 w-5 accent-[var(--color-ridge)]" />
            This is a business address
          </label>
          <p className="text-sm text-steel">We ship by UPS to the lower 48 states. No P.O. boxes.</p>
        </fieldset>

        <fieldset className="space-y-4 rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-7">
          <legend className="type-decal-md px-1 text-xl text-ridge">Shipping method</legend>
          {rates.status === 'ok' ? (
            <>
              {rates.sample ? (
                <p className="rounded-[var(--radius-plate)] bg-[#fff6ef] p-3 text-sm">
                  Sample rates for the demo. UPS isn’t connected yet, so these aren’t real prices.
                </p>
              ) : null}
              <div className="space-y-2" role="radiogroup" aria-label="Shipping method">
                {rates.options.map((o) => (
                  <label
                    key={o.code}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-plate)] border p-4 ${
                      selected === o.code ? 'border-ridge bg-fescue' : 'border-haze'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="service"
                        value={o.code}
                        checked={selected === o.code}
                        onChange={() => setSelected(o.code)}
                        className="h-5 w-5 accent-[var(--color-ridge)]"
                      />
                      <span className="font-semibold">{o.name}</span>
                    </span>
                    <span className="font-semibold">{o.shipping === 0 ? 'Free' : usd(o.shipping)}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-steel">Enter your address, then get live UPS rates.</p>
              <button type="button" onClick={requestRates} disabled={loadingRates} className="btn btn-quiet text-ridge disabled:opacity-60">
                {loadingRates ? 'Getting rates…' : 'See shipping options'}
              </button>
            </>
          )}
        </fieldset>

        <TextAreaField name="notes" label="Order notes" rows={2} placeholder="Anything we should know?" />
        <SpamGuard siteKey={siteKey} renderedAt={renderedAt} state={message} />
      </div>

      <aside className="h-fit space-y-4 rounded-[var(--radius-plate)] border border-haze bg-white p-6 lg:sticky lg:top-6">
        <h2 className="type-decal-md text-xl text-ridge">Order summary</h2>
        <ul className="divide-y divide-haze text-sm">
          {priced.lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 py-2">
              <span>
                {l.qty} × {l.name}
              </span>
              <span className="shrink-0 font-medium">{usd(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-haze pt-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{usd(priced.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{chosen ? (chosen.shipping === 0 ? 'Free' : usd(chosen.shipping)) : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Sales tax{rates.status === 'ok' && rates.taxRate ? ` (${rates.taxRate}%)` : ''}</dt>
            <dd>{chosen ? usd(chosen.tax) : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-haze pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd>{chosen ? usd(chosen.total) : '—'}</dd>
          </div>
        </dl>
        <button type="submit" disabled={placing || loadingRates} className="btn btn-primary w-full disabled:opacity-60">
          {placing ? 'Placing order…' : chosen ? `Place order · ${usd(chosen.total)}` : 'See shipping options'}
        </button>
        {priced.paymentLabel ? <p className="text-xs font-medium text-steel">Payment: {priced.paymentLabel}</p> : null}
        <p className="text-xs text-steel">Prices, shipping and tax are confirmed when you place the order.</p>
      </aside>
    </form>
  )
}
