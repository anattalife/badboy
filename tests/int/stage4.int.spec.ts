import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { mapColumns, parseCsv } from '@/lib/csv'
import { importPartsCsv, matchModels } from '@/lib/partsImport'
import { computeTax, packLines, type PricedLine, signQuote, verifyQuote } from '@/lib/store'
import { buildRateRequest, parseRateResponse, sampleRates } from '@/lib/ups'
import { canBuyOnline } from '@/collections/Parts'

describe('CSV price lists', () => {
  it('parses quotes, commas, BOMs and Windows line endings', () => {
    const { headers, rows } = parseCsv('﻿Part #,Description,Price\r\n"088-1","Bagger, 3-bin ""HD""",$2,399.99\r\n')
    expect(headers).toEqual(['Part #', 'Description', 'Price'])
    expect(rows[0]['Description']).toBe('Bagger, 3-bin "HD"')
  })

  it('recognizes common column names from dealer exports', () => {
    const cols = mapColumns(['SKU', 'Item Description', 'Your Price', 'List Price', 'Shipping Weight', 'Qty On Hand'])
    expect(cols).toMatchObject({
      partNumber: 'SKU',
      description: 'Item Description',
      name: 'Item Description',
      price: 'Your Price',
      msrp: 'List Price',
      weightLb: 'Shipping Weight',
      stockQty: 'Qty On Hand',
    })
  })
})

describe('Model matching', () => {
  const models = [
    { id: 1, name: 'Rebel', slug: 'rebel' },
    { id: 2, name: 'Rebel X', slug: 'rebel-x' },
    { id: 3, name: 'Revolt', slug: 'revolt' },
    { id: 4, name: '1025 Sub-Compact Tractor', slug: 'tractor-1025' },
  ]
  it('prefers the longest name and matches tractor numbers', () => {
    expect(matchModels('Fits Rebel X 61"', models)).toEqual([2])
    expect(matchModels('Rebel; Revolt 48" deck', models).sort()).toEqual([1, 3])
    expect(matchModels('1025H mid-mount', models)).toEqual([])
    expect(matchModels('For the 1025 tractor', models)).toEqual([4])
  })
})

describe('Packing and tax', () => {
  const line = (over: Partial<PricedLine>): PricedLine => ({
    id: 1, partNumber: 'X', name: 'X', unitPrice: 10, qty: 1, lineTotal: 10, weightLb: 2, ...over,
  })

  it('ships boxed parts alone and combines small parts up to 50 lb', () => {
    const packages = packLines(
      [
        line({ id: 1, qty: 2, weightLb: 30, lengthIn: 40, widthIn: 30, heightIn: 20 }),
        line({ id: 2, qty: 30, weightLb: 2 }),
      ],
      { length: 12, width: 10, height: 8 },
    )
    expect(packages.filter((p) => p.lengthIn === 40)).toHaveLength(2)
    const small = packages.filter((p) => p.lengthIn === 12)
    expect(small.map((p) => p.weightLb)).toEqual([50, 10])
  })

  it('charges tax only for the configured state', () => {
    const s = { taxEnabled: true, taxState: 'VA', taxRatePercent: 5.3, taxShipping: false }
    expect(computeTax(100, 20, 'VA', s)).toEqual({ rate: 5.3, amount: 5.3 })
    expect(computeTax(100, 20, 'nc', s)).toEqual({ rate: 0, amount: 0 })
    expect(computeTax(100, 20, 'VA', { ...s, taxShipping: true }).amount).toBe(6.36)
    expect(computeTax(100, 20, 'VA', { ...s, taxEnabled: false }).amount).toBe(0)
  })
})

describe('Signed shipping quotes', () => {
  const quote = { code: '03', amount: 18.4, cart: 'c', address: 'a', exp: Date.now() + 60_000, sample: false }

  it('round-trips a valid quote', async () => {
    expect(await verifyQuote(await signQuote(quote))).toMatchObject({ code: '03', amount: 18.4 })
  })

  it('rejects an edited price', async () => {
    const token = await signQuote(quote)
    const [, sig] = token.split('.')
    const forged = btoa(JSON.stringify({ ...quote, amount: 0.01 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(await verifyQuote(`${forged}.${sig}`)).toBeNull()
  })

  it('rejects an expired quote', async () => {
    expect(await verifyQuote(await signQuote({ ...quote, exp: Date.now() - 1 }))).toBeNull()
  })
})

describe('UPS', () => {
  const from = { name: 'Shop', street: '4802 Melrose Ave NW', city: 'Roanoke', state: 'VA', zip: '24017' }
  const to = { name: 'Pat', street: '1 Main St', city: 'Raleigh', state: 'NC', zip: '27601' }

  it('builds a residential multi-package rate request', () => {
    const body = buildRateRequest(from, to, [{ weightLb: 0.4 }, { weightLb: 12.04, lengthIn: 20, widthIn: 10, heightIn: 8 }])
    const shipment = body.RateRequest.Shipment
    expect(shipment.NumOfPieces).toBe('2')
    expect(shipment.ShipTo.Address).toHaveProperty('ResidentialAddressIndicator', '')
    expect(shipment.Package[0].PackageWeight.Weight).toBe('1.0') // UPS minimum 1 lb
    expect(shipment.Package[1].PackageWeight.Weight).toBe('12.1')
    expect(shipment.Package[1]).toHaveProperty('Dimensions')
  })

  it('prefers negotiated account rates when UPS returns them', () => {
    const rates = parseRateResponse({
      RateResponse: {
        RatedShipment: [
          { Service: { Code: '03' }, TotalCharges: { MonetaryValue: '21.50' }, NegotiatedRateCharges: { TotalCharge: { MonetaryValue: '15.10' } } },
          { Service: { Code: '02' }, TotalCharges: { MonetaryValue: '48.00' } },
        ],
      },
    })
    expect(rates).toEqual([
      { code: '03', amount: 15.1 },
      { code: '02', amount: 48 },
    ])
  })

  it('handles a single rated shipment object', () => {
    expect(parseRateResponse({ RateResponse: { RatedShipment: { Service: { Code: '03' }, TotalCharges: { MonetaryValue: '9.99' } } } })).toEqual([
      { code: '03', amount: 9.99 },
    ])
  })

  it('returns sample rates in increasing price order by service speed', () => {
    const r = sampleRates([{ weightLb: 5 }], to)
    expect(r[0].code).toBe('03')
    expect(r[0].amount).toBeLessThan(r[r.length - 1].amount)
  })
})

let payload: Payload
const partIds: number[] = []

describe('Parts and orders', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })
  afterAll(async () => {
    for (const id of partIds) await payload.delete({ collection: 'parts', id }).catch((): void => undefined)
  })

  it('imports a price list, then updates it by part number without touching missing columns', async () => {
    const pn = `TEST-${Date.now()}`
    const cat = await payload.create({ collection: 'categories', data: { name: 'Import Test', slug: `import-test-${Date.now()}` } })
    const model = await payload.create({
      collection: 'models',
      data: { name: 'Zetamower Pro', slug: `zetamower-pro-${Date.now()}`, category: cat.id, _status: 'published' },
    })
    const first = await importPartsCsv(payload, `Part Number,Name,Price,Weight,Fits\n${pn},Test Blade,19.99,2,Zetamower Pro 54"\n`)
    expect(first).toMatchObject({ created: 1, updated: 0, errors: [] })

    const second = await importPartsCsv(payload, `SKU,Your Price\n${pn},$24.50\n`)
    expect(second).toMatchObject({ created: 0, updated: 1 })

    const { docs } = await payload.find({ collection: 'parts', where: { partNumber: { equals: pn } }, depth: 1 })
    partIds.push(docs[0].id)
    expect(docs[0]).toMatchObject({ name: 'Test Blade', price: 24.5, weightLb: 2, source: 'import' })
    expect(canBuyOnline(docs[0])).toBe(true)
    const linked = (docs[0].models ?? []).map((m) => (typeof m === 'object' ? m.name : m))
    expect(linked).toContain('Zetamower Pro')
    await payload.delete({ collection: 'parts', id: docs[0].id })
    partIds.pop()
    await payload.delete({ collection: 'models', id: model.id })
    await payload.delete({ collection: 'categories', id: cat.id })
  })

  it('reports problems instead of guessing', async () => {
    expect((await importPartsCsv(payload, 'Name,Price\nBlade,10\n')).errors[0]).toMatch(/part number column/i)
    const bad = await importPartsCsv(payload, `Part Number,Name,Price\nBAD-${Date.now()},X,ten dollars\n`)
    expect(bad.skipped).toBe(1)
    expect(bad.errors[0]).toMatch(/isn’t a number/)
  })

  it('cannot create orders through the public API, and never shows the link token', async () => {
    await expect(
      payload.create({ collection: 'orders', data: { orderNumber: 'X' } as never, overrideAccess: false }),
    ).rejects.toThrow()

    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber: `RM-TEST-${Date.now()}`,
        accessToken: 'secret-token-value-123456',
        status: 'paid',
        customerName: 'Pat',
        email: 'pat@example.com',
        shipTo: { street: '1 Main', city: 'Roanoke', state: 'VA', zip: '24017' },
        items: [{ name: 'Blade', unitPrice: 10, qty: 1, lineTotal: 10 }],
        subtotal: 10,
        shippingAmount: 5,
        taxAmount: 0.53,
        total: 15.53,
      },
    })
    let admin = (await payload.find({ collection: 'users', where: { roles: { contains: 'admin' } }, limit: 1 })).docs[0]
    const createdAdmin = !admin
    if (!admin) {
      admin = await payload.create({
        collection: 'users',
        data: { name: 'Orders Admin', email: `orders-admin-${Date.now()}@roanokemowers.test`, password: 'test-password-123', roles: ['admin'] },
      })
    }
    const staffView = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: false, user: admin })
    expect(staffView.accessToken).toBeUndefined()
    await payload.delete({ collection: 'orders', id: order.id })
    if (createdAdmin) await payload.delete({ collection: 'users', id: admin.id })
  })
})

describe('Price list upload in the admin', () => {
  it('runs the import when a CSV is uploaded and records the result', async () => {
    const p = await getPayload({ config: await config })
    const pn = `UPL-${Date.now()}`
    const csv = `Part Number,Name,Price,Weight\n${pn},Uploaded Filter,12.00,1\n,Missing number,5,1\n`
    const record = await p.create({
      collection: 'part-imports',
      data: {},
      file: { data: Buffer.from(csv), mimetype: 'text/csv', name: `prices-${Date.now()}.csv`, size: csv.length },
    })
    expect(record).toMatchObject({ created: 1, updated: 0, skipped: 1 })
    const { docs } = await p.find({ collection: 'parts', where: { partNumber: { equals: pn } } })
    expect(docs[0].price).toBe(12)
    await p.delete({ collection: 'parts', id: docs[0].id })
    await p.delete({ collection: 'part-imports', id: record.id })
  })
})
