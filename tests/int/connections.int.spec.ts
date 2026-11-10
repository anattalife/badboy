import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { readConnections } from '@/lib/connections'
import { applyCheckoutSession, markOrderPaid } from '@/lib/orders'
import { buildCheckoutSession, formEncode, verifyWebhook } from '@/lib/stripe'
import { getPaymentProvider } from '@/lib/payments'

const sign = async (body: string, secret: string, t = Math.floor(Date.now() / 1000)) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)),
  )
  return `t=${t},v1=${[...mac].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

describe('Stripe helpers', () => {
  it('form-encodes nested Checkout parameters the way Stripe expects', () => {
    const body = formEncode({
      line_items: [{ quantity: 2, price_data: { unit_amount: 1999 } }],
      metadata: { order_id: '7' },
    }).join('&')
    expect(decodeURIComponent(body)).toBe(
      'line_items[0][quantity]=2&line_items[0][price_data][unit_amount]=1999&metadata[order_id]=7',
    )
  })

  it('builds a card Checkout Session tied to the order', () => {
    const s = buildCheckoutSession({
      orderId: 7,
      orderNumber: 'RM-1',
      email: 'pat@example.com',
      lines: [{ name: 'Blade', unitCents: 4599, qty: 3 }],
      successUrl: 'https://x.test/order/RM-1?t=abc',
      cancelUrl: 'https://x.test/cart',
      storeName: 'Test Mowers',
    })
    expect(s.mode).toBe('payment')
    expect(s.metadata).toEqual({ order_id: '7', order_number: 'RM-1' })
    expect(s.line_items[0]).toEqual({
      quantity: 3,
      price_data: { currency: 'usd', unit_amount: 4599, product_data: { name: 'Blade' } },
    })
  })

  it('accepts only correctly signed, recent webhooks', async () => {
    const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } })
    const good = await sign(body, 'whsec_test')
    expect(await verifyWebhook(body, good, 'whsec_test')).toMatchObject({
      type: 'checkout.session.completed',
    })
    expect(await verifyWebhook(body, good, 'whsec_other')).toBeNull()
    expect(await verifyWebhook(body.replace('completed', 'expired'), good, 'whsec_test')).toBeNull()
    const old = await sign(body, 'whsec_test', Math.floor(Date.now() / 1000) - 3600)
    expect(await verifyWebhook(body, old, 'whsec_test')).toBeNull()
    expect(await verifyWebhook(body, null, 'whsec_test')).toBeNull()
  })

  it('refuses to start a payment whose lines don’t add up', async () => {
    const provider = getPaymentProvider({
      secretKey: 'sk_test_x',
      webhookSecret: null,
      live: false,
    })!
    await expect(
      provider.start({
        orderId: 1,
        orderNumber: 'RM-1',
        totalCents: 1000,
        email: 'a@b.c',
        lines: [{ name: 'x', unitCents: 999, qty: 1 }],
        returnUrl: '',
        cancelUrl: '',
        storeName: 'S',
      }),
    ).rejects.toThrow(/don’t add up/)
  })
})

describe('Connections in Store settings', () => {
  let payload: Payload
  let admin: { id: number; roles: string[]; collection: 'users' }
  let manager: { id: number; roles: string[]; collection: 'users' }
  const site = process.env.SITE_URL

  beforeAll(async () => {
    payload = await getPayload({ config })
    const make = async (email: string, roles: string[]) => {
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
      })
      const u =
        existing.docs[0] ??
        (await payload.create({
          collection: 'users',
          data: { email, password: 'connections-test-pw', name: email, roles } as never,
        }))
      return { ...u, roles, collection: 'users' as const }
    }
    admin = (await make('connections-admin@example.com', ['admin'])) as typeof admin
    manager = (await make('connections-manager@example.com', ['manager'])) as typeof manager
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    ;(process.env as Record<string, string | undefined>).SITE_URL = site
  })

  afterAll(async () => {
    vi.stubGlobal('fetch', async () => Response.json({}))
    await payload.updateGlobal({
      slug: 'store-settings',
      data: {
        stripe: { secretKey: '' },
        ups: { clientId: '', clientSecret: '', accountNumber: '' },
      } as never,
      overrideAccess: true,
    })
    vi.unstubAllGlobals()
    await payload.delete({ collection: 'users', where: { email: { like: 'connections-' } } })
  })

  it('checks a Stripe key, sets up the webhook, encrypts both and never shows them', async () => {
    ;(process.env as Record<string, string | undefined>).SITE_URL = 'https://dealer.example.com'
    const calls: string[] = []
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`)
      if (url.endsWith('/account'))
        return Response.json({ settings: { dashboard: { display_name: 'Test Mowers' } } })
      if (url.endsWith('/webhook_endpoints')) {
        expect(String(init?.body)).toContain(
          encodeURIComponent('https://dealer.example.com/webhooks/stripe'),
        )
        return Response.json({ id: 'we_1', secret: 'whsec_abc123' })
      }
      return Response.json({}, { status: 404 })
    })
    const saved = await payload.updateGlobal({
      slug: 'store-settings',
      data: { stripe: { secretKey: 'sk_test_51abcdefghijklmnop1234' } } as never,
      user: admin as never,
      overrideAccess: false,
    })
    expect(saved.stripe?.secretKey).toBe('Saved ••••1234')
    expect(saved.stripe?.status).toMatch(/Connected to Test Mowers · TEST MODE/)
    expect(calls).toContain('POST https://api.stripe.com/v1/webhook_endpoints')

    const raw = (await payload.findGlobal({
      slug: 'store-settings',
      context: { rawSecrets: true },
    })) as unknown as {
      stripe: { secretKey: string; webhookSecret: string }
    }
    expect(raw.stripe.secretKey).toMatch(/^enc:v1:/)
    expect(raw.stripe.webhookSecret).toMatch(/^enc:v1:/)

    const conns = await readConnections(payload)
    expect(conns.stripe).toEqual({
      secretKey: 'sk_test_51abcdefghijklmnop1234',
      webhookSecret: 'whsec_abc123',
      live: false,
    })

    // A manager can open Store settings but never sees the keys.
    const asManager = await payload.findGlobal({
      slug: 'store-settings',
      user: manager as never,
      overrideAccess: false,
    })
    expect(asManager.stripe?.secretKey).toBeUndefined()

    // Saving the form with the placeholder (any other change) keeps the real key.
    vi.stubGlobal('fetch', async () => Response.json({}))
    await payload.updateGlobal({
      slug: 'store-settings',
      data: { handlingFee: 2, stripe: { ...saved.stripe } } as never,
      user: admin as never,
      overrideAccess: false,
    })
    expect((await readConnections(payload)).stripe?.secretKey).toBe(
      'sk_test_51abcdefghijklmnop1234',
    )
  })

  it('refuses a publishable key and a key Stripe rejects', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'store-settings',
        data: { stripe: { secretKey: 'pk_test_abcdefghijklmnop' } } as never,
        user: admin as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    vi.stubGlobal('fetch', async () =>
      Response.json({ error: { message: 'Invalid API Key provided' } }, { status: 401 }),
    )
    await expect(
      payload.updateGlobal({
        slug: 'store-settings',
        data: { stripe: { secretKey: 'sk_live_zzzzzzzzzzzzzzzz9999' } } as never,
        user: admin as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/didn’t accept/)
    expect((await readConnections(payload)).stripe?.secretKey).toBe(
      'sk_test_51abcdefghijklmnop1234',
    )
  })

  it('checks UPS keys with UPS before saving them', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }))
    await expect(
      payload.updateGlobal({
        slug: 'store-settings',
        data: {
          ups: { clientId: 'cid', clientSecret: 'bad-secret', accountNumber: 'a1b2c3' },
        } as never,
        user: admin as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/didn’t accept/)

    vi.stubGlobal('fetch', async () => Response.json({ access_token: 'tok', expires_in: 3600 }))
    const saved = await payload.updateGlobal({
      slug: 'store-settings',
      data: {
        ups: { clientId: 'cid', clientSecret: 'good-secret-9876', accountNumber: 'a1b2c3' },
      } as never,
      user: admin as never,
      overrideAccess: false,
    })
    expect(saved.ups?.status).toMatch(/^Connected/)
    expect(saved.ups?.accountNumber).toBe('A1B2C3')
    expect((await readConnections(payload)).ups).toEqual({
      clientId: 'cid',
      clientSecret: 'good-secret-9876',
      accountNumber: 'A1B2C3',
      live: true,
    })
  })
})

describe('Paying for orders', () => {
  let payload: Payload
  let orderId: number
  beforeAll(async () => {
    payload = await getPayload({ config })
    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber: `TEST-${Date.now()}`,
        accessToken: 'x'.repeat(48),
        status: 'pending-payment',
        customerName: 'Pat Test',
        email: 'pat@example.com',
        shipTo: { street: '1 Main St', city: 'Roanoke', state: 'VA', zip: '24017' },
        items: [{ name: 'Blade', unitPrice: 10, qty: 2, lineTotal: 20 }],
        subtotal: 20,
        shippingAmount: 5,
        shippingService: 'UPS Ground',
        taxRatePercent: 0,
        taxAmount: 0,
        total: 25,
        payment: { provider: 'stripe', reference: 'cs_test_1' },
      },
    })
    orderId = order.id
  })
  afterAll(async () => {
    await payload.delete({ collection: 'orders', id: orderId, overrideAccess: true })
  })

  const session = (over: Record<string, unknown> = {}) =>
    ({
      id: 'cs_test_1',
      url: null,
      status: 'complete',
      payment_status: 'paid',
      amount_total: 2500,
      currency: 'usd',
      payment_intent: 'pi_1',
      client_reference_id: String(orderId),
      metadata: { order_id: String(orderId) },
      ...over,
    }) as never

  it('ignores a paid session whose amount doesn’t match the order', async () => {
    await applyCheckoutSession(session({ amount_total: 100 }), 'https://x.test')
    expect(
      (await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })).status,
    ).toBe('pending-payment')
  })

  it('marks the order paid once, even if Stripe and the customer both report it', async () => {
    expect(await applyCheckoutSession(session(), 'https://x.test')).toBe('paid')
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })
    expect(order.status).toBe('paid')
    expect(order.payment?.reference).toBe('pi_1')
    expect(await markOrderPaid(orderId, 'stripe', 'pi_1', 'https://x.test')).toBe(false)
  })
})
