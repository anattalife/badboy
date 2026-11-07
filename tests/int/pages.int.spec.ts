import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DEFAULT_PAGES, resolveDefaultLayout } from '@/blocks/defaults'
import config from '@/payload.config'
import { seedPages } from '@/seed/pages'

describe('editable pages', () => {
  let payload: Payload
  beforeAll(async () => {
    payload = await getPayload({ config })
    await seedPages(payload)
  })
  afterAll(async () => {
    await payload.delete({ collection: 'pages', where: { slug: { in: ['test-about', 'about-our-shop'] } } })
  })

  it('creates every built-in page and the menus, and never overwrites edits', async () => {
    const { docs } = await payload.find({ collection: 'pages', limit: 50, depth: 0 })
    for (const p of DEFAULT_PAGES) expect(docs.map((d) => d.slug)).toContain(p.slug)
    const financing = docs.find((d) => d.slug === 'financing')!
    await payload.update({ collection: 'pages', id: financing.id, data: { intro: 'Edited by the dealer' } })
    await seedPages(payload)
    const again = await payload.findByID({ collection: 'pages', id: financing.id, depth: 0 })
    expect(again.intro).toBe('Edited by the dealer')
    const nav = await payload.findGlobal({ slug: 'navigation' })
    expect(nav.mainMenu?.length).toBeGreaterThan(3)
  })

  it('protects built-in pages: no deleting, no changing their address', async () => {
    const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, depth: 0 })
    await expect(payload.delete({ collection: 'pages', id: docs[0].id })).rejects.toThrow(/can’t be deleted/)
    const updated = await payload.update({ collection: 'pages', id: docs[0].id, data: { slug: 'something-else' } })
    expect(updated.slug).toBe('home')
  })

  it('lets staff add pages but not take addresses the site uses', async () => {
    const page = await payload.create({ collection: 'pages', data: { title: 'About our shop', _status: 'published' } })
    expect(page.slug).toBe('about-our-shop')
    await expect(payload.create({ collection: 'pages', data: { title: 'Cart', _status: 'published' } })).rejects.toThrow(/used by the website/)
    await expect(payload.create({ collection: 'pages', data: { title: 'x', slug: 'financing', _status: 'published' } })).rejects.toThrow()
  })

  it('turns default model slugs into IDs and drops unknown ones', () => {
    const layout = resolveDefaultLayout(
      [{ blockType: 'acreage', options: [{ label: 'a', advice: 'b', models: ['rogue', 'nope'] }] }, { blockType: 'visit' }],
      new Map([['rogue', 7]]),
    )
    expect((layout[0] as unknown as { options: { models: number[] }[] }).options[0].models).toEqual([7])
    expect(layout[1]).toEqual({ blockType: 'visit' })
  })
})

describe('other-brand inventory', () => {
  let payload: Payload
  let categoryId: number
  beforeAll(async () => {
    payload = await getPayload({ config })
    categoryId = (await payload.create({ collection: 'categories', data: { name: 'Test carts', slug: 'test-carts', inventoryOnly: true } })).id
  })
  afterAll(async () => {
    await payload.delete({ collection: 'inventory', where: { stockNumber: { like: 'TEST-OB' } } })
    await payload.delete({ collection: 'categories', id: categoryId })
  })

  it('needs a make and builds the title from it', async () => {
    const base = { stockNumber: 'TEST-OB1', brand: 'other' as const, category: categoryId, condition: 'used' as const, status: 'available' as const, year: 2020 }
    await expect(payload.create({ collection: 'inventory', data: base })).rejects.toThrow(/make/)
    const unit = await payload.create({ collection: 'inventory', data: { ...base, make: 'Club Car', otherModelName: 'Onward' } })
    expect(unit.title).toBe('2020 Club Car Onward')
    expect(unit.model ?? null).toBeNull()
  })
})
