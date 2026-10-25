import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Category, Model, SiteSetting } from '@/payload-types'

export const getPayloadClient = () => getPayload({ config })

/*
 * Public reads go through the Local API with `overrideAccess: false`, so the same
 * access rules that protect the REST API apply here (drafts stay hidden, private
 * fields like the lead email are stripped).
 */
const publicRead = { overrideAccess: false, draft: false } as const

export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', ...publicRead })
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    sort: 'order',
    limit: 100,
    depth: 1,
    ...publicRead,
  })
  return docs
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    ...publicRead,
  })
  return docs[0] ?? null
})

export const getModelsByCategory = cache(async (categoryId: number): Promise<Model[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    where: { category: { equals: categoryId } },
    sort: 'order',
    limit: 200,
    depth: 1,
    ...publicRead,
  })
  return docs
})

export const getAllModels = cache(async (): Promise<Model[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    sort: 'order',
    limit: 500,
    depth: 1,
    ...publicRead,
  })
  return docs
})

export const getModelBySlug = cache(async (slug: string): Promise<Model | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    ...publicRead,
  })
  return docs[0] ?? null
})

export const countModelsByCategory = cache(async (): Promise<Record<number, number>> => {
  const models = await getAllModels()
  const counts: Record<number, number> = {}
  for (const model of models) {
    const id = typeof model.category === 'object' ? model.category?.id : model.category
    if (id != null) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
})
