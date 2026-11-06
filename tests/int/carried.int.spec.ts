import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { carried, modelCarriedWhere } from '@/access/carried'
import config from '@/payload.config'

describe('equipment a dealer does not sell', () => {
  let payload: Payload
  let categoryId: number
  let keptId: number
  let hiddenId: number

  beforeAll(async () => {
    payload = await getPayload({ config })
    const cat = await payload.create({ collection: 'categories', data: { name: 'Test UTVs', slug: 'test-utvs' } })
    categoryId = cat.id
    const base = { category: cat.id, _status: 'published' as const }
    keptId = (await payload.create({ collection: 'models', data: { ...base, name: 'Test Kept', slug: 'test-kept' } })).id
    hiddenId = (
      await payload.create({ collection: 'models', data: { ...base, name: 'Test Hidden', slug: 'test-hidden', notCarried: true } })
    ).id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'models', where: { slug: { in: ['test-kept', 'test-hidden'] } } })
    await payload.delete({ collection: 'categories', id: categoryId })
  })

  const publicModels = () =>
    payload
      .find({ collection: 'models', where: { category: { equals: categoryId } }, overrideAccess: false, depth: 0 })
      .then((r) => r.docs.map((d) => d.id))

  it('hides a single model from the public but not from staff', async () => {
    expect(await publicModels()).toEqual([keptId])
    const staff = await payload.find({ collection: 'models', where: { category: { equals: categoryId } }, depth: 0 })
    expect(staff.docs.map((d) => d.id).sort()).toEqual([keptId, hiddenId].sort())
  })

  it('hides a whole category and every model in it', async () => {
    await payload.update({ collection: 'categories', id: categoryId, data: { notCarried: true } })
    expect(await publicModels()).toEqual([])
    const cats = await payload.find({ collection: 'categories', where: { id: { equals: categoryId } }, overrideAccess: false })
    expect(cats.totalDocs).toBe(0)
    // The public page queries apply the same rules for signed-in staff too.
    const viaWhere = await payload.find({ collection: 'models', where: { and: [{ category: { equals: categoryId } }, await modelCarriedWhere(payload)] } })
    expect(viaWhere.totalDocs).toBe(0)
    const catsWhere = await payload.find({ collection: 'categories', where: { and: [{ id: { equals: categoryId } }, carried()] } })
    expect(catsWhere.totalDocs).toBe(0)
    await payload.update({ collection: 'categories', id: categoryId, data: { notCarried: false } })
    expect(await publicModels()).toEqual([keptId])
  })
})
