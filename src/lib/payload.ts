import 'server-only'

import { carried, modelCarriedWhere } from '@/access/carried'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { draftMode } from 'next/headers'
import { cache } from 'react'

import type {
  Category,
  Inventory as InventoryUnit,
  Model,
  Offer,
  Page,
  SiteSetting,
} from '@/payload-types'

export const getPayloadClient = () => getPayload({ config })

/** Models the dealer sells (see src/access/carried.ts). Cached per request. */
const getModelCarried = cache(async () => modelCarriedWhere(await getPayloadClient()))

/*
 * Public reads go through the Local API with `overrideAccess: false`, so the same
 * access rules that protect the REST API apply here (drafts stay hidden, private
 * fields like the lead email are stripped).
 */
const publicRead = { overrideAccess: false, draft: false } as const

/** Excludes the dealer's inventory-only categories from the Bad Boy catalog pages and menus. */
const catalogOnly: Where = {
  or: [{ inventoryOnly: { equals: false } }, { inventoryOnly: { exists: false } }],
}

export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', ...publicRead })
})

/** Bad Boy catalog categories, or with `includeInventoryOnly` also the dealer's own (golf carts, trailers…). */
export const getCategories = cache(async (includeInventoryOnly = false): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: includeInventoryOnly ? carried() : { and: [carried(), catalogOnly] },
    sort: 'order',
    limit: 100,
    depth: 1,
    ...publicRead,
  })
  return docs
})

export const getCategoryBySlug = cache(
  async (slug: string, includeInventoryOnly = false): Promise<Category | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'categories',
      where: {
        and: [
          { slug: { equals: slug } },
          carried(),
          ...(includeInventoryOnly ? [] : [catalogOnly]),
        ],
      },
      limit: 1,
      depth: 1,
      ...publicRead,
    })
    return docs[0] ?? null
  },
)

export const getModelsByCategory = cache(async (categoryId: number): Promise<Model[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'models',
    where: { and: [{ category: { equals: categoryId } }, await getModelCarried()] },
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
    where: await getModelCarried(),
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
    where: { and: [{ slug: { equals: slug } }, await getModelCarried()] },
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
  brand?: 'badboy' | 'other'
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
    const category = await getCategoryBySlug(filters.category, true)
    // Unknown category: return nothing rather than everything.
    and.push({ category: { equals: category?.id ?? -1 } })
  }
  if (filters.model) {
    const model = await getModelBySlug(filters.model)
    and.push({ model: { equals: model?.id ?? -1 } })
  }
  if (filters.condition) and.push({ condition: { equals: filters.condition } })
  if (filters.brand === 'badboy') and.push({ brand: { equals: 'badboy' } })
  if (filters.brand === 'other') and.push({ brand: { equals: 'other' } })
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
    // Depth 2 reaches the model's photos, shown when a unit has none of its own.
    depth: 2,
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
    depth: 2,
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
    where: { and: [{ slug: { in: slugs } }, await getModelCarried()] },
    limit: slugs.length,
    depth: 1,
    ...publicRead,
  })
  const bySlug = new Map(docs.map((m) => [m.slug, m]))
  return slugs.map((s) => bySlug.get(s)).filter((m): m is Model => Boolean(m))
}

/** Resolves `?model=` / `?unit=` from a quote or financing link into what the customer is asking about. */
type Configuration = NonNullable<Model['configurations']>[number]

export const configurationLabel = (c: Configuration) =>
  `${c.name}${c.modelNumber ? ` (${c.modelNumber})` : ''}`

/** Finds a model's configuration by its label, Bad Boy model number or name. */
export const findConfiguration = (model: Model, key: string): Configuration | null =>
  (model.configurations ?? []).find(
    (c) =>
      configurationLabel(c) === key || (c.modelNumber && c.modelNumber === key) || c.name === key,
  ) ?? null

export async function resolveInterest(params: {
  model?: string | string[]
  unit?: string | string[]
  config?: string | string[]
  offer?: string | string[]
}) {
  const modelSlug = typeof params.model === 'string' ? params.model.slice(0, 80) : undefined
  const stockNumber = typeof params.unit === 'string' ? params.unit.slice(0, 40) : undefined
  const configKey = typeof params.config === 'string' ? params.config.slice(0, 120) : undefined
  const offer =
    typeof params.offer === 'string' ? await getOfferBySlug(params.offer.slice(0, 120)) : null
  const payload = await getPayloadClient()
  const unit = stockNumber
    ? ((
        await payload.find({
          collection: 'inventory',
          where: { stockNumber: { equals: stockNumber } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        })
      ).docs[0] ?? null)
    : null
  const model = !unit && modelSlug ? await getModelBySlug(modelSlug) : null
  const configuration = model && configKey ? findConfiguration(model, configKey) : null
  const subject = unit
    ? `${unit.title} (stock ${unit.stockNumber})`
    : model
      ? `Bad Boy ${model.name}${configuration ? ` ${configurationLabel(configuration)}` : ''}`
      : null
  return {
    modelSlug: model?.slug ?? undefined,
    stockNumber: unit?.stockNumber ?? undefined,
    configuration: configuration ? configurationLabel(configuration) : undefined,
    offerSlug: offer?.slug ?? undefined,
    subject: [offer ? `Offer: ${offer.title}` : null, subject].filter(Boolean).join(' · ') || null,
    price: unit?.price ?? model?.startingPrice ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Parts store                                                         */
/* ------------------------------------------------------------------ */

export const PARTS_PAGE_SIZE = 24

export async function getParts(filters: {
  q?: string
  category?: string
  model?: string
  page?: number
}) {
  const payload = await getPayloadClient()
  const and: Where[] = []
  const q = filters.q?.trim().slice(0, 80)
  if (q) {
    and.push({
      or: [{ name: { like: q } }, { partNumber: { like: q } }, { description: { like: q } }],
    })
  }
  if (filters.category) and.push({ category: { equals: filters.category } })
  if (filters.model) {
    const model = await getModelBySlug(filters.model)
    and.push({ models: { contains: model?.id ?? -1 } })
  }
  return payload.find({
    collection: 'parts',
    where: and.length ? { and } : undefined,
    sort: 'name',
    limit: PARTS_PAGE_SIZE,
    page: filters.page ?? 1,
    depth: 1,
    overrideAccess: false,
  })
}

export const getPartBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'parts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

export const getPartsForModel = cache(async (modelId: number) => {
  const payload = await getPayloadClient()
  const { docs, totalDocs } = await payload.find({
    collection: 'parts',
    where: { models: { contains: modelId } },
    sort: 'name',
    limit: 8,
    depth: 1,
    overrideAccess: false,
  })
  return { docs, totalDocs }
})

/* ------------------------------------------------------------------ */
/* Offers                                                              */
/* ------------------------------------------------------------------ */

/** Published offers running today, optionally only those for one model (or for everything). */
export const getCurrentOffers = cache(async (modelId?: number): Promise<Offer[]> => {
  const payload = await getPayloadClient()
  const now = new Date().toISOString()
  const and: Where[] = [
    { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
    { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than_equal: now } }] },
  ]
  const { docs } = await payload.find({
    collection: 'offers',
    where: { and },
    sort: 'endsAt',
    limit: 24,
    depth: 1,
    overrideAccess: false,
  })
  if (!modelId) return docs
  // Offers with no models listed apply to everything.
  return docs.filter((o) => {
    const ids = (o.models ?? []).map((m) => (typeof m === 'object' ? m.id : m))
    return ids.length === 0 || ids.includes(modelId)
  })
})

export const getOfferBySlug = cache(async (slug: string): Promise<Offer | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'offers',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  return docs[0] ?? null
})

/* ------------------------------------------------------------------ */
/* Pages and menus                                                     */
/* ------------------------------------------------------------------ */

/**
 * A page by address. In preview (draft mode, only switched on for signed-in staff by /preview) the
 * latest draft is shown; otherwise only the published version.
 */
export const getPage = cache(async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const { isEnabled: preview } = await draftMode()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft: preview,
    overrideAccess: preview,
  })
  return docs[0] ?? null
})

export const getNavigation = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'navigation', depth: 0, overrideAccess: false })
})
