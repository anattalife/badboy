import 'server-only'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Category, Inventory as InventoryUnit, Model, SiteSetting } from '@/payload-types'

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

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

export type InventoryFilters = {
  category?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  minDeck?: number
  maxDeck?: number
  model?: string
  sort?: 'newest' | 'price-asc' | 'price-desc'
  page?: number
}

export const INVENTORY_PAGE_SIZE = 24

const SORTS: Record<NonNullable<InventoryFilters['sort']>, string[]> = {
  newest: ['-featured', '-createdAt'],
  'price-asc': ['price', '-createdAt'],
  'price-desc': ['-price', '-createdAt'],
}

export async function getInventory(filters: InventoryFilters) {
  const payload = await getPayloadClient()
  const and: Where[] = []

  if (filters.category) {
    const category = await getCategoryBySlug(filters.category)
    // Unknown category: return nothing rather than everything.
    and.push({ category: { equals: category?.id ?? -1 } })
  }
  if (filters.model) {
    const model = await getModelBySlug(filters.model)
    and.push({ model: { equals: model?.id ?? -1 } })
  }
  if (filters.condition) and.push({ condition: { equals: filters.condition } })
  if (filters.minPrice != null) and.push({ price: { greater_than_equal: filters.minPrice } })
  if (filters.maxPrice != null) and.push({ price: { less_than_equal: filters.maxPrice } })
  if (filters.minDeck != null) and.push({ deckInches: { greater_than_equal: filters.minDeck } })
  if (filters.maxDeck != null) and.push({ deckInches: { less_than_equal: filters.maxDeck } })

  return payload.find({
    collection: 'inventory',
    where: and.length ? { and } : undefined,
    sort: SORTS[filters.sort ?? 'newest'],
    limit: INVENTORY_PAGE_SIZE,
    page: filters.page ?? 1,
    depth: 1,
    overrideAccess: false,
  })
}

export const getUnitBySlug = cache(async (slug: string): Promise<InventoryUnit | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'inventory',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

export const getUnitsForModel = cache(async (modelId: number): Promise<InventoryUnit[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'inventory',
    where: { model: { equals: modelId } },
    sort: ['price', '-createdAt'],
    limit: 12,
    depth: 1,
    overrideAccess: false,
  })
  return docs
})

/** Models in the order the slugs were given; unknown slugs are dropped. */
export async function getModelsBySlugs(slugs: string[]): Promise<Model[]> {
  if (!slugs.length) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    where: { slug: { in: slugs } },
    limit: slugs.length,
    depth: 1,
    ...publicRead,
  })
  const bySlug = new Map(docs.map((m) => [m.slug, m]))
  return slugs.map((s) => bySlug.get(s)).filter((m): m is Model => Boolean(m))
}
