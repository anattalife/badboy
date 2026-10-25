'use server'

import { headers } from 'next/headers'

import { canBuyOnline } from '@/collections/Parts'
import type { Part } from '@/payload-types'
import { upsServiceName } from '@/globals/StoreSettings'
import { type FieldErrors, isEmail, isPhone, isZip, str } from '@/lib/forms'
import { markOrderPaid, storeSettings } from '@/lib/orders'
import { getPayloadClient } from '@/lib/payload'
import { getPaymentProvider } from '@/lib/payments'
import { checkSpam } from '@/lib/spam'
import {
  computeTax,
  fingerprint,
  MAX_QTY_PER_LINE,
  packLines,
  type PricedLine,
  round2,
  signQuote,
  UPS_MAX_PACKAGE_LB,
  verifyQuote,
} from '@/lib/store'
import { type Address, getUpsRates, ShippingUnavailableError } from '@/lib/ups'

export type CartItem = { id: number; qty: number }

export type PricedCart = {
  lines: PricedLine[]
  unavailable: { id: number; name: string; reason: string }[]
  subtotal: number
  checkoutOpen: boolean
  closedReason?: string
  paymentLabel?: string
}

const cleanItems = (items: unknown): CartItem[] => {
  if (!Array.isArray(items)) return []
  const merged = new Map<number, number>()
  for (const i of items.slice(0, 50)) {
    const id = Number((i as CartItem)?.id)
    const qty = Math.floor(Number((i as CartItem)?.qty))
    if (Number.isInteger(id) && id > 0 && qty > 0) merged.set(id, Math.min(MAX_QTY_PER_LINE, (merged.get(id) ?? 0) + qty))
  }
  return [...merged.entries()].map(([id, qty]) => ({ id, qty }))
}

/** Prices a cart from the database. The browser only ever sends part IDs and quantities. */
export async function priceCart(rawItems: unknown): Promise<PricedCart> {
  const items = cleanItems(rawItems)
  const payload = await getPayloadClient()
  const settings = await storeSettings()
  const { docs } = items.length
    ? await payload.find({
        collection: 'parts',
        where: { id: { in: items.map((i) => i.id) } },
        limit: items.length,
        depth: 0,
        overrideAccess: false,
      })
    : { docs: [] as Part[] }
  const byId = new Map(docs.map((d) => [d.id, d]))

  const lines: PricedLine[] = []
  const unavailable: PricedCart['unavailable'] = []
  for (const item of items) {
    const part = byId.get(item.id)
    if (!part) {
      unavailable.push({ id: item.id, name: 'Removed item', reason: 'This part is no longer available.' })
      continue
    }
    if (!canBuyOnline(part)) {
      unavailable.push({ id: part.id, name: part.name, reason: 'Call us to order this part.' })
      continue
    }
    if ((part.weightLb ?? 0) > UPS_MAX_PACKAGE_LB) {
      unavailable.push({ id: part.id, name: part.name, reason: 'Too heavy to ship by UPS. Call us for freight.' })
      continue
    }
    lines.push({
      id: part.id,
      partNumber: part.partNumber ?? null,
      name: part.name,
      unitPrice: part.price!,
      qty: item.qty,
      lineTotal: round2(part.price! * item.qty),
      weightLb: part.weightLb!,
      lengthIn: part.lengthIn,
      widthIn: part.widthIn,
      heightIn: part.heightIn,
    })
  }

  const provider = getPaymentProvider()
  const checkoutOpen = Boolean(settings.storeOpen && provider)
  return {
    lines,
    unavailable,
    subtotal: round2(lines.reduce((s, l) => s + l.lineTotal, 0)),
    checkoutOpen,
    paymentLabel: provider?.label,
    closedReason: checkoutOpen
      ? undefined
      : 'Online checkout isn’t open yet. Call us and we’ll take your order by phone.',
  }
}

function readAddress(form: FormData, errors: FieldErrors) {
  const a = {
    name: str(form, 'name', 120),
    email: str(form, 'email', 200),
    phone: str(form, 'phone', 30),
    street: str(form, 'street', 150),
    street2: str(form, 'street2', 150),
    city: str(form, 'city', 80),
    state: str(form, 'state', 2).toUpperCase(),
    zip: str(form, 'zip', 10),
    residential: form.get('business') !== 'on',
  }
  if (!a.name) errors.name = 'Enter your name.'
  if (!isEmail(a.email)) errors.email = 'Enter a valid email address for your receipt.'
  if (a.phone && !isPhone(a.phone)) errors.phone = 'Enter a 10-digit phone number.'
  if (!a.street) errors.street = 'Enter a street address.'
  if (/\b(p\.?\s*o\.?\s*box)\b/i.test(a.street)) errors.street = 'UPS can’t deliver to P.O. boxes.'
  if (!a.city) errors.city = 'Enter a city.'
  if (!/^[A-Z]{2}$/.test(a.state)) errors.state = 'Use the 2-letter state code.'
  if (['AK', 'HI', 'PR', 'GU', 'VI', 'AS', 'MP'].includes(a.state)) errors.state = 'We ship to the lower 48 states only.'
  if (!isZip(a.zip)) errors.zip = 'Enter a 5-digit ZIP code.'
  return a
}

const addressKey = (a: { street: string; city: string; state: string; zip: string; residential: boolean }) =>
  fingerprint([a.street.toLowerCase(), a.city.toLowerCase(), a.state, a.zip.slice(0, 5), a.residential])
const cartKey = (lines: PricedLine[]) => fingerprint(lines.map((l) => [l.id, l.qty, l.unitPrice]))

export type RateOption = {
  code: string
  name: string
  shipping: number
  tax: number
  total: number
  token: string
}

export type RatesState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors }
  | { status: 'ok'; options: RateOption[]; sample: boolean; subtotal: number; taxRate: number }

/** Gets live UPS rates for the cart and address, with tax and a signed quote for each option. */
export async function getShippingRates(items: CartItem[], form: FormData): Promise<RatesState> {
  const errors: FieldErrors = {}
  const address = readAddress(form, errors)
  if (Object.keys(errors).length) return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: errors }

  const cart = await priceCart(items)
  if (!cart.lines.length) return { status: 'error', message: 'Your cart has no parts that can ship.' }

  const settings = await storeSettings()
  const packages = packLines(cart.lines, settings.defaultBox ?? {})
  const from = settings.shipFrom as Address & { phone?: string }

  let rates
  try {
    rates = await getUpsRates(from, address, packages)
  } catch (error) {
    const message =
      error instanceof ShippingUnavailableError
        ? `${error.message} Check the address, or call us for a shipping quote.`
        : 'We couldn’t get shipping rates right now. Please try again, or call us.'
    return { status: 'error', message }
  }

  const enabled = new Set(settings.upsServices?.length ? settings.upsServices : ['03'])
  const handling = settings.handlingFee ?? 0
  const freeOver = settings.freeShippingOver
  const [cartFp, addressFp] = await Promise.all([cartKey(cart.lines), addressKey(address)])
  const exp = Date.now() + 30 * 60 * 1000

  const options: RateOption[] = []
  for (const rate of rates.filter((r) => enabled.has(r.code)).sort((a, b) => a.amount - b.amount)) {
    const free = rate.code === '03' && freeOver != null && freeOver > 0 && cart.subtotal >= freeOver
    const shipping = free ? 0 : round2(rate.amount + handling)
    const tax = computeTax(cart.subtotal, shipping, address.state, settings)
    options.push({
      code: rate.code,
      name: upsServiceName(rate.code),
      shipping,
      tax: tax.amount,
      total: round2(cart.subtotal + shipping + tax.amount),
      token: await signQuote({ code: rate.code, amount: shipping, cart: cartFp, address: addressFp, exp, sample: rate.sample }),
    })
  }
  if (!options.length) return { status: 'error', message: 'No UPS services are available to that address. Please call us.' }

  return {
    status: 'ok',
    options,
    sample: rates.some((r) => r.sample),
    subtotal: cart.subtotal,
    taxRate: computeTax(cart.subtotal, 0, address.state, settings).rate,
  }
}

export type PlaceOrderState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors }
  | { status: 'done'; redirectTo: string }

const randomToken = (bytes = 24) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('')

function orderNumber() {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => alphabet[b % alphabet.length]).join('')
  return `RM-${ymd}-${rand}`
}

/** Re-prices the cart, checks the signed shipping quote, creates the order and takes payment. */
export async function placeOrder(items: CartItem[], form: FormData): Promise<PlaceOrderState> {
  const h = await headers()
  const ip = h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`

  const spam = await checkSpam(form, ip)
  if (!spam.ok) return { status: 'error', message: 'We couldn’t place your order. Please wait a few seconds and try again.' }

  const errors: FieldErrors = {}
  const address = readAddress(form, errors)
  if (Object.keys(errors).length) return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: errors }

  const cart = await priceCart(items)
  if (!cart.checkoutOpen) return { status: 'error', message: cart.closedReason ?? 'Checkout is closed.' }
  if (!cart.lines.length) return { status: 'error', message: 'Your cart has no parts that can ship.' }
  if (cart.unavailable.length)
    return { status: 'error', message: 'Some parts in your cart can’t be ordered online. Remove them to continue.' }

  const quote = await verifyQuote(str(form, 'quote', 2000))
  const [cartFp, addressFp] = await Promise.all([cartKey(cart.lines), addressKey(address)])
  if (!quote || quote.cart !== cartFp || quote.address !== addressFp) {
    return { status: 'error', message: 'Your cart, address or shipping quote changed. Get shipping options again.' }
  }
  if (quote.sample && process.env.NODE_ENV === 'production') {
    return { status: 'error', message: 'Shipping rates are unavailable. Please call us.' }
  }

  const settings = await storeSettings()
  const tax = computeTax(cart.subtotal, quote.amount, address.state, settings)
  const total = round2(cart.subtotal + quote.amount + tax.amount)
  const provider = getPaymentProvider()
  if (!provider) return { status: 'error', message: 'Online checkout isn’t open yet. Please call us to order.' }

  const payload = await getPayloadClient()
  const accessToken = randomToken()
  let number = orderNumber()
  for (let tries = 0; tries < 3; tries++) {
    const { totalDocs } = await payload.count({ collection: 'orders', where: { orderNumber: { equals: number } } })
    if (!totalDocs) break
    number = orderNumber()
  }

  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      orderNumber: number,
      accessToken,
      status: 'pending-payment',
      customerName: address.name,
      email: address.email,
      phone: address.phone || undefined,
      shipTo: {
        street: address.street,
        street2: address.street2 || undefined,
        city: address.city,
        state: address.state,
        zip: address.zip,
        residential: address.residential,
      },
      items: cart.lines.map((l) => ({
        part: l.id,
        partNumber: l.partNumber ?? undefined,
        name: l.name,
        unitPrice: l.unitPrice,
        qty: l.qty,
        lineTotal: l.lineTotal,
      })),
      subtotal: cart.subtotal,
      shippingAmount: quote.amount,
      shippingService: upsServiceName(quote.code),
      shippingServiceCode: quote.code,
      taxRatePercent: tax.rate,
      taxAmount: tax.amount,
      total,
      customerNotes: str(form, 'notes', 1000) || undefined,
      ip: ip ?? undefined,
    },
  })

  const confirmationUrl = `/order/${order.orderNumber}?t=${accessToken}`
  const result = await provider.start({
    orderNumber: order.orderNumber,
    totalCents: Math.round(total * 100),
    email: address.email,
    returnUrl: `${siteUrl}${confirmationUrl}`,
  })

  if (result.kind === 'redirect') return { status: 'done', redirectTo: result.url }

  await markOrderPaid(order.id, provider.id, result.reference, siteUrl)
  return { status: 'done', redirectTo: confirmationUrl }
}
