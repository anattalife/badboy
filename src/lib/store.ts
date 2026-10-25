/**
 * Store math: packing, tax and signed shipping quotes. Pure functions, easy to test.
 */
import type { Package } from './ups'

export const MAX_QTY_PER_LINE = 20
export const UPS_MAX_PACKAGE_LB = 150
const COMBINED_BOX_MAX_LB = 50

export type PricedLine = {
  id: number
  partNumber: string | null
  name: string
  unitPrice: number
  qty: number
  lineTotal: number
  weightLb: number
  lengthIn?: number | null
  widthIn?: number | null
  heightIn?: number | null
}

export const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Parts with their own dimensions ship in their own box; small parts without dimensions are
 * combined into the store's default box, up to 50 lb per box.
 */
export function packLines(lines: PricedLine[], defaultBox: { length?: number | null; width?: number | null; height?: number | null }): Package[] {
  const packages: Package[] = []
  let combined: Package | null = null
  for (const line of lines) {
    for (let i = 0; i < line.qty; i++) {
      if (line.lengthIn && line.widthIn && line.heightIn) {
        packages.push({ weightLb: line.weightLb, lengthIn: line.lengthIn, widthIn: line.widthIn, heightIn: line.heightIn })
        continue
      }
      if (!combined || combined.weightLb + line.weightLb > COMBINED_BOX_MAX_LB) {
        combined = {
          weightLb: 0,
          lengthIn: defaultBox.length ?? 12,
          widthIn: defaultBox.width ?? 10,
          heightIn: defaultBox.height ?? 8,
        }
        packages.push(combined)
      }
      combined.weightLb = round2(combined.weightLb + line.weightLb)
    }
  }
  return packages
}

export type TaxSettings = {
  taxEnabled?: boolean | null
  taxState?: string | null
  taxRatePercent?: number | null
  taxShipping?: boolean | null
}

export function computeTax(subtotal: number, shipping: number, shipToState: string, s: TaxSettings) {
  const applies = Boolean(s.taxEnabled && s.taxRatePercent && s.taxState && shipToState.toUpperCase() === s.taxState.toUpperCase())
  const rate = applies ? (s.taxRatePercent ?? 0) : 0
  const base = subtotal + (s.taxShipping ? shipping : 0)
  return { rate, amount: round2((base * rate) / 100) }
}

/* -------------------------- Signed shipping quotes -------------------------- */
/*
 * Rates are shown to the customer, then the chosen one is sent back when they place the order.
 * The quote is signed with the site secret so it can't be edited in the browser, and it's tied to
 * the exact cart and address it was calculated for.
 */

const enc = new TextEncoder()
const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

async function hmac(data: string): Promise<string> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set.')
  const key = await crypto.subtle.importKey('raw', enc.encode(`shipping-quote:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export async function fingerprint(value: unknown): Promise<string> {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(JSON.stringify(value))))
}

export type QuotePayload = { code: string; amount: number; cart: string; address: string; exp: number; sample: boolean }

export async function signQuote(q: QuotePayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(q)))
  return `${body}.${await hmac(body)}`
}

export async function verifyQuote(token: string): Promise<QuotePayload | null> {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = await hmac(body)
  if (expected.length !== sig.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (diff !== 0) return null
  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'))
    const q = JSON.parse(json) as QuotePayload
    return q.exp > Date.now() ? q : null
  } catch {
    return null
  }
}
