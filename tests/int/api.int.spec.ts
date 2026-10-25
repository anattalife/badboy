import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

let payload: Payload
const created: { collection: 'users' | 'models' | 'categories'; id: number }[] = []

describe('Access rules', () => {
  let categoryId: number
  let salesUser: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const category = await payload.create({
      collection: 'categories',
      data: { name: 'Test Category', slug: `test-category-${Date.now()}` },
    })
    categoryId = category.id
    created.push({ collection: 'categories', id: category.id })

    // On an empty database the first account becomes admin automatically,
    // so make sure an admin exists before creating the sales user.
    const { totalDocs } = await payload.count({ collection: 'users' })
    if (totalDocs === 0) {
      const admin = await payload.create({
        collection: 'users',
        data: {
          name: 'Test Admin',
          email: `admin-${Date.now()}@roanokemowers.test`,
          password: 'test-password-123',
          roles: ['admin'],
        },
      })
      expect(admin.roles).toEqual(['admin'])
      created.push({ collection: 'users', id: admin.id })
    }

    salesUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Test Sales',
        email: `sales-${Date.now()}@roanokemowers.test`,
        password: 'test-password-123',
        roles: ['sales'],
      },
    })
    created.push({ collection: 'users', id: salesUser.id })
  })

  afterAll(async () => {
    for (const { collection, id } of created.reverse()) {
      await payload.delete({ collection, id }).catch((): void => undefined)
    }
  })

  it('hides draft models from the public but shows them to staff', async () => {
    const draft = await payload.create({
      collection: 'models',
      data: { name: 'Secret Prototype', slug: `secret-${Date.now()}`, category: categoryId, _status: 'draft' },
      draft: true,
    })
    created.push({ collection: 'models', id: draft.id })

    const publicResult = await payload.find({
      collection: 'models',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(publicResult.docs).toHaveLength(0)

    const staffResult = await payload.find({
      collection: 'models',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
      user: salesUser,
      draft: true,
    })
    expect(staffResult.docs).toHaveLength(1)
  })

  it('generates a slug from the name when none is given', async () => {
    const model = await payload.create({
      collection: 'models',
      data: { name: 'Test 60" Deck Mower', category: categoryId, _status: 'published' },
    })
    created.push({ collection: 'models', id: model.id })
    expect(model.slug).toBe('test-60-deck-mower')
  })

  it('never exposes the lead email to anonymous visitors', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
    expect(settings.leadEmail).toBeUndefined()
  })

  it('stops a sales user from giving themselves admin', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: salesUser.id,
      data: { roles: ['admin'] },
      overrideAccess: false,
      user: salesUser,
    })
    expect(updated.roles).toEqual(['sales'])
  })

  it('stops a sales user from creating staff accounts', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { name: 'Nope', email: 'nope@roanokemowers.test', password: 'x-password-123', roles: ['admin'] },
        overrideAccess: false,
        user: salesUser,
      }),
    ).rejects.toThrow()
  })

  it('stops a sales user from editing equipment categories', async () => {
    await expect(
      payload.update({
        collection: 'categories',
        id: categoryId,
        data: { name: 'Changed' },
        overrideAccess: false,
        user: salesUser,
      }),
    ).rejects.toThrow()
  })
})
