import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
const ids: number[] = []

describe('Inventory', () => {
  let modelId: number
  let categoryId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const category = await payload.create({
      collection: 'categories',
      data: { name: 'Inv Test', slug: `inv-test-${Date.now()}` },
    })
    categoryId = category.id
    const model = await payload.create({
      collection: 'models',
      data: { name: 'Test Ranger', slug: `test-ranger-${Date.now()}`, category: categoryId, _status: 'published' },
    })
    modelId = model.id
  })

  afterAll(async () => {
    for (const id of ids) await payload.delete({ collection: 'inventory', id }).catch((): void => undefined)
    await payload.delete({ collection: 'models', id: modelId }).catch((): void => undefined)
    await payload.delete({ collection: 'categories', id: categoryId }).catch((): void => undefined)
  })

  const createUnit = async (stock: string, status: 'available' | 'sold' | 'hidden' | 'on-order') => {
    const unit = await payload.create({
      collection: 'inventory',
      data: {
        stockNumber: `${stock}-${Date.now()}`,
        model: modelId,
        condition: 'new',
        status,
        year: 2026,
        deck: '61" fabricated',
        configuration: '61" Test Engine',
        serialNumber: 'SECRET-SERIAL-123',
        price: 9999,
      } as any,
    })
    ids.push(unit.id)
    return unit
  }

  it('fills in category, title, slug and deck size from the model', async () => {
    const unit = await createUnit('T1', 'available')
    const category = typeof unit.category === 'object' ? unit.category.id : unit.category
    expect(category).toBe(categoryId)
    expect(unit.title).toBe('2026 Bad Boy Test Ranger 61" Test Engine')
    expect(unit.slug).toMatch(/^2026-bad-boy-test-ranger-t1-\d+$/)
    expect(unit.deckInches).toBe(61)
  })

  it('shows available and on-order units to the public, but never sold or hidden ones', async () => {
    const available = await createUnit('PUB', 'available')
    const onOrder = await createUnit('ORD', 'on-order')
    const sold = await createUnit('SOLD', 'sold')
    const hidden = await createUnit('HID', 'hidden')

    const { docs } = await payload.find({
      collection: 'inventory',
      where: { id: { in: [available.id, onOrder.id, sold.id, hidden.id] } },
      overrideAccess: false,
    })
    expect(docs.map((d) => d.id).sort()).toEqual([available.id, onOrder.id].sort())
  })

  it('records the sale date when a unit is marked sold', async () => {
    const unit = await createUnit('SALE', 'available')
    const updated = await payload.update({ collection: 'inventory', id: unit.id, data: { status: 'sold' } })
    expect(updated.soldAt).toBeTruthy()
  })

  it('never exposes serial numbers to the public', async () => {
    const unit = await createUnit('SER', 'available')
    const publicView = await payload.findByID({ collection: 'inventory', id: unit.id, overrideAccess: false })
    expect(publicView.serialNumber).toBeUndefined()
    const staffView = await payload.findByID({ collection: 'inventory', id: unit.id })
    expect(staffView.serialNumber).toBe('SECRET-SERIAL-123')
  })

  it('rejects duplicate stock numbers', async () => {
    const unit = await createUnit('DUP', 'available')
    await expect(
      payload.create({
        collection: 'inventory',
        data: { stockNumber: unit.stockNumber, model: modelId, condition: 'new', status: 'available', year: 2026 } as any,
      }),
    ).rejects.toThrow()
  })
})
