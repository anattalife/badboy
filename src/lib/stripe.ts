/**
 * Stripe, through its REST API with fetch (no SDK, so it runs the same on Cloudflare Workers and
 * Node). Customers pay on Stripe Checkout, Stripe's hosted payment page: card details never reach
 * this website. API reference: https://docs.stripe.com/api
 *
 * The dealer pastes only their secret key in Store settings → Card payments. Saving it checks the
 * key and creates the webhook (payment notifications) automatically, see connections-hook.ts.
 */

const API = 'https://api.stripe.com/v1'

export class StripeError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message)
  }
}

/** Stripe wants form encoding with brackets for nesting: line_items[0][price_data][currency]=usd */
export function formEncode(params: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const name = prefix ? `${prefix}[${key}]` : key
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'object' && v !== null)
          out.push(...formEncode(v as Record<string, unknown>, `${name}[${i}]`))
        else out.push(`${encodeURIComponent(`${name}[${i}]`)}=${encodeURIComponent(String(v))}`)
      })
    } else if (typeof value === 'object') {
      out.push(...formEncode(value as Record<string, unknown>, name))
    } else {
      out.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`)
    }
  }
  return out
}

async function call<T>(
  secretKey: string,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  params?: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  const body = params ? formEncode(params).join('&') : undefined
  const url = method === 'GET' && body ? `${API}${path}?${body}` : `${API}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Stripe-Version': '2024-06-20',
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: method === 'POST' ? body : undefined,
  })
  const json = (await res.json().catch((): null => null)) as { error?: { message?: string } } | null
  if (!res.ok)
    throw new StripeError(json?.error?.message ?? `Stripe returned ${res.status}.`, res.status)
  return json as T
}

export const isLiveKey = (key: string) => /^(sk|rk)_live_/.test(key)

/** Checks a secret key and returns the account's name (for the admin's "Connected to …"). */
export async function checkKey(secretKey: string): Promise<{ name: string; live: boolean }> {
  try {
    const account = await call<{
      settings?: { dashboard?: { display_name?: string } }
      business_profile?: { name?: string }
      email?: string
    }>(secretKey, 'GET', '/account')
    const name =
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      account.email ||
      'your Stripe account'
    return { name, live: isLiveKey(secretKey) }
  } catch (e) {
    if (e instanceof StripeError && e.status === 401)
      throw new StripeError(
        'Stripe didn’t accept that key. Copy the Secret key again from Developers → API keys.',
        401,
      )
    // Restricted keys may not read the account; a balance read still proves the key works.
    await call(secretKey, 'GET', '/balance')
    return { name: 'your Stripe account', live: isLiveKey(secretKey) }
  }
}

export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
]

/** Creates the webhook that tells this site about payments; replaces the old one if given. */
export async function setUpWebhook(
  secretKey: string,
  url: string,
  previousId?: string | null,
): Promise<{ id: string; secret: string }> {
  if (previousId)
    await call(secretKey, 'DELETE', `/webhook_endpoints/${previousId}`).catch(
      (): undefined => undefined,
    )
  const created = await call<{ id: string; secret: string }>(
    secretKey,
    'POST',
    '/webhook_endpoints',
    {
      url,
      enabled_events: WEBHOOK_EVENTS,
      description: 'Parts store orders (created by the dealer website)',
    },
  )
  return { id: created.id, secret: created.secret }
}

export const removeWebhook = (secretKey: string, id: string) =>
  call(secretKey, 'DELETE', `/webhook_endpoints/${id}`).catch((): undefined => undefined)

export type CheckoutLine = { name: string; unitCents: number; qty: number }

/** Builds the Checkout Session request (exported for tests). Amounts are whole cents. */
export function buildCheckoutSession(input: {
  orderId: number
  orderNumber: string
  email: string
  lines: CheckoutLine[]
  successUrl: string
  cancelUrl: string
  storeName: string
}) {
  return {
    mode: 'payment',
    customer_email: input.email,
    client_reference_id: String(input.orderId),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    payment_method_types: ['card'],
    line_items: input.lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: 'usd',
        unit_amount: l.unitCents,
        product_data: { name: l.name.slice(0, 250) },
      },
    })),
    metadata: { order_id: String(input.orderId), order_number: input.orderNumber },
    payment_intent_data: {
      description: `${input.storeName} parts order ${input.orderNumber}`.slice(0, 1000),
      metadata: { order_id: String(input.orderId), order_number: input.orderNumber },
    },
    // An unpaid checkout page stops working after an hour; the order stays "Awaiting payment".
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  }
}

export type CheckoutSession = {
  id: string
  url: string | null
  status: 'open' | 'complete' | 'expired'
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  amount_total: number | null
  currency: string | null
  payment_intent: string | null
  client_reference_id: string | null
  metadata: Record<string, string> | null
}

export const createCheckoutSession = (
  secretKey: string,
  params: ReturnType<typeof buildCheckoutSession>,
) =>
  call<CheckoutSession>(
    secretKey,
    'POST',
    '/checkout/sessions',
    params,
    `checkout-order-${params.metadata.order_id}`,
  )

export const getCheckoutSession = (secretKey: string, id: string) =>
  call<CheckoutSession>(secretKey, 'GET', `/checkout/sessions/${encodeURIComponent(id)}`)

/**
 * Verifies the Stripe-Signature header (HMAC-SHA256 of "<timestamp>.<body>" with the webhook
 * secret) and returns the event, or null. https://docs.stripe.com/webhooks#verify-manually
 */
export async function verifyWebhook<T = unknown>(
  body: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  now = Date.now(),
): Promise<T | null> {
  if (!header || !secret) return null
  const parts = header.split(',').map((p) => p.trim().split('=') as [string, string])
  const timestamp = Number(parts.find(([k]) => k === 't')?.[1])
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!timestamp || !signatures.length) return null
  if (Math.abs(now / 1000 - timestamp) > toleranceSeconds) return null
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`)),
  )
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('')
  const same = (a: string, b: string) => {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
  }
  if (!signatures.some((s) => same(s, expected))) return null
  try {
    return JSON.parse(body) as T
  } catch {
    return null
  }
}
