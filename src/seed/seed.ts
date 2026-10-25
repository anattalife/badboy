import type { Payload } from 'payload'

import catalog from './data/catalog.json'

type CatalogModel = {
  slug: string
  name: string
  category: string
  tagline?: string
  summary?: string
  highlights?: string[]
  specs?: { group?: string; label: string; value: string }[]
  configurations?: {
    name: string
    deck?: string | null
    engine?: string | null
    horsepower?: string | null
    discharge?: string | null
    modelNumber?: string | null
    msrp?: number | null
  }[]
  msrp?: number | null
  sourceUrl?: string
}

const FEATURED = new Set(['rogue', 'zt-elite', 'maverick', 'revolt', 'tractor-1025', 'bandit-750-crew-cab'])

const SPEC_GROUPS = new Set([
  'General',
  'Engine',
  'Battery',
  'Deck',
  'Drive',
  'Hydraulics',
  'Capacities',
  'Dimensions',
  'Comfort',
  'Warranty',
])

export const DEMO_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@roanokemowers.com'
const DEMO_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'demo-admin-password'

/**
 * Loads dealership info and the Bad Boy catalog. Safe to run repeatedly: records are
 * matched by slug and updated in place. Never runs against production unless forced.
 */
export async function seed(payload: Payload): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Refusing to seed in production. Set ALLOW_PRODUCTION_SEED=true to override.')
  }

  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'Roanoke Mowers',
      legalName: 'Roanoke Golf Cars, LLC',
      phone: '540.986.0098',
      fax: '540.904.6500',
      leadEmail: process.env.LEAD_EMAIL || 'anattalife@icloud.com',
      address: {
        street: '4802 Melrose Ave NW',
        city: 'Roanoke',
        state: 'VA',
        zip: '24017',
        mapUrl: 'https://maps.google.com/?q=4802+Melrose+Ave+NW,+Roanoke,+VA+24017',
      },
      hours: [
        { days: 'Mon–Fri', hours: '9am–5pm' },
        { days: 'Saturday', hours: '9am–2pm' },
        { days: 'Sunday', hours: 'Closed' },
      ],
      serviceArea:
        'Roanoke, Salem, Blacksburg, Lynchburg, Moneta, Smith Mountain Lake and the surrounding Roanoke Valley.',
      facebookUrl: 'https://www.facebook.com/roanoketurfandtrail/',
    },
  })
  log('Dealership info saved')

  const categoryIds = new Map<string, number>()
  for (const [index, cat] of catalog.categories.entries()) {
    const data = { name: cat.name, slug: cat.slug, description: cat.description, order: (index + 1) * 10 }
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'categories', id: existing.docs[0].id, data })
      : await payload.create({ collection: 'categories', data })
    categoryIds.set(cat.slug, doc.id)
  }
  log(`${categoryIds.size} categories saved`)

  const orderInCategory = new Map<string, number>()
  for (const model of catalog.models as CatalogModel[]) {
    const category = categoryIds.get(model.category)
    if (!category) {
      payload.logger.warn(`[seed] Skipping ${model.slug}: unknown category ${model.category}`)
      continue
    }
    const order = (orderInCategory.get(model.category) ?? 0) + 10
    orderInCategory.set(model.category, order)

    const data = {
      name: model.name,
      slug: model.slug,
      category,
      order,
      featured: FEATURED.has(model.slug),
      tagline: model.tagline,
      summary: model.summary,
      highlights: (model.highlights ?? []).map((text) => ({ text })),
      specs: (model.specs ?? []).map((s) => ({
        group: (SPEC_GROUPS.has(s.group ?? '') ? s.group : 'General') as 'General',
        label: s.label,
        value: s.value,
      })),
      configurations: (model.configurations ?? []).map((c) => ({
        name: c.name,
        deck: c.deck ?? undefined,
        engine: c.engine ?? undefined,
        horsepower: c.horsepower ?? undefined,
        discharge: c.discharge === 'rear' ? ('rear' as const) : c.discharge === 'side' ? ('side' as const) : undefined,
        modelNumber: c.modelNumber ?? undefined,
        msrp: c.msrp ?? undefined,
      })),
      msrp: model.msrp ?? undefined,
      sourceUrl: model.sourceUrl,
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'models',
      where: { slug: { equals: model.slug } },
      limit: 1,
      draft: true,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'models', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'models', data })
    }
  }
  log(`${catalog.models.length} models saved`)

  await seedAccessories(payload)

  if (process.env.NODE_ENV !== 'production') {
    await seedSampleInventory(payload)
  }

  const { totalDocs: userCount } = await payload.count({ collection: 'users' })
  if (userCount === 0) {
    await payload.create({
      collection: 'users',
      data: {
        name: 'Demo Admin',
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASSWORD,
        roles: ['admin'],
      },
    })
    log(`Demo admin created: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}  (change this password)`)
  }
}

const SAMPLE_NOTE =
  'Sample listing for the demo site. Replace or delete it once real inventory is entered.'

/**
 * A handful of clearly labeled sample units so the In Stock pages have something to show.
 * Only used outside production. Stock numbers start with DEMO- so they're easy to find and delete.
 */
async function seedSampleInventory(payload: Payload) {
  const year = new Date().getFullYear()
  const samples: {
    stockNumber: string
    modelSlug: string
    modelNumber?: string
    condition: 'new' | 'used' | 'demo'
    status: 'available' | 'on-order' | 'pending'
    year: number
    hours?: number
    price?: number
    featured?: boolean
    extra?: string
  }[] = [
    { stockNumber: 'DEMO-1001', modelSlug: 'rogue', modelNumber: 'BRG61385KA', condition: 'new', status: 'available', year, featured: true },
    { stockNumber: 'DEMO-1002', modelSlug: 'maverick', modelNumber: 'BMR54ZT740', condition: 'new', status: 'available', year, featured: true },
    { stockNumber: 'DEMO-1003', modelSlug: 'zt-elite', modelNumber: 'BZS54FR730', condition: 'new', status: 'on-order', year },
    { stockNumber: 'DEMO-1004', modelSlug: 'revolt', modelNumber: 'BRV48FX730', condition: 'new', status: 'available', year },
    { stockNumber: 'DEMO-1005', modelSlug: 'mz-magnum', modelNumber: 'BMZ54PXI24', condition: 'new', status: 'available', year },
    { stockNumber: 'DEMO-1006', modelSlug: 'maverick-hd', modelNumber: 'BMH60FX730', condition: 'used', status: 'available', year: year - 3, hours: 214, price: 7450, extra: 'One owner, serviced here.' },
    { stockNumber: 'DEMO-1007', modelSlug: 'bandit-750', condition: 'used', status: 'pending', year: year - 2, hours: 85, price: 11900 },
    { stockNumber: 'DEMO-1008', modelSlug: 'tractor-1025', condition: 'new', status: 'available', year },
  ]

  for (const s of samples) {
    const { docs } = await payload.find({ collection: 'models', where: { slug: { equals: s.modelSlug } }, limit: 1, draft: true })
    const model = docs[0]
    if (!model) continue
    const config = model.configurations?.find((c) => c.modelNumber && c.modelNumber === s.modelNumber)
    const data = {
      stockNumber: s.stockNumber,
      model: model.id,
      category: typeof model.category === 'object' ? model.category.id : model.category,
      condition: s.condition,
      status: s.status,
      year: s.year,
      hours: s.hours,
      configuration: config?.name,
      deck: config?.deck ?? undefined,
      engine: config?.engine ?? undefined,
      // New units default to Bad Boy's published MSRP for that configuration.
      price: s.price ?? config?.msrp ?? undefined,
      featured: s.featured ?? false,
      description: [s.extra, SAMPLE_NOTE].filter(Boolean).join('\n\n'),
    }
    const existing = await payload.find({ collection: 'inventory', where: { stockNumber: { equals: s.stockNumber } }, limit: 1 })
    if (existing.docs[0]) {
      await payload.update({ collection: 'inventory', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'inventory', data })
    }
  }
  payload.logger.info(`[seed] ${samples.length} sample inventory units saved (stock numbers DEMO-…)`)
}

type Accessory = {
  name: string
  line: string
  group?: string | null
  description?: string | null
  msrp?: number | null
  partNumber?: string | null
  variants?: { name: string; partNumber?: string | null; msrp?: number | null; fits?: string[] }[]
  fits?: string[]
}

/**
 * Loads Bad Boy accessories as store parts: one part per part number, with the models it fits.
 * MSRP is used as the starting price. Shipping weights aren't published by Bad Boy, so in
 * production these show “Call to order” until staff enter a weight. Outside production a
 * sample weight is set so the demo checkout works.
 */
export async function seedAccessories(payload: Payload) {
  const { default: data } = await import('./data/accessories.json')
  const { matchModels } = await import('../lib/partsImport')
  const { slugify } = await import('../fields/slug')
  const models = (await payload.find({ collection: 'models', limit: 500, depth: 0, draft: true })).docs
  const demo = process.env.NODE_ENV !== 'production'
  const category = (line: string) =>
    line === 'bandit' ? 'utv-accessories' : line === 'e-series' ? 'e-series' : 'mower-accessories'

  let count = 0
  for (const acc of data.accessories as Accessory[]) {
    const variants = acc.variants?.length
      ? acc.variants
      : [{ name: '', partNumber: acc.partNumber, msrp: acc.msrp, fits: acc.fits ?? [] }]
    const groups = new Map<string, typeof variants>()
    for (const v of variants) {
      const key = v.partNumber ?? `no-number:${v.name}`
      groups.set(key, [...(groups.get(key) ?? []), v])
    }

    for (const group of groups.values()) {
      const partNumber = group[0].partNumber ?? null
      const suffix = groups.size > 1 ? group.map((v) => v.name).filter(Boolean).join(', ') : ''
      const name = suffix ? `${acc.name} — ${suffix}` : acc.name
      const price = group.find((v) => v.msrp)?.msrp ?? acc.msrp ?? null
      const fitsText = [...new Set(group.flatMap((v) => [v.name, ...(v.fits ?? [])]).filter(Boolean))]
      const modelIds = matchModels(fitsText.join(' ; '), models)
      const slug = slugify(`${name} ${partNumber ?? ''}`)

      const doc = {
        name,
        slug,
        partNumber: partNumber ?? undefined,
        category: category(acc.line) as 'mower-accessories',
        group: acc.group ?? undefined,
        description: acc.description ?? undefined,
        price: price ?? undefined,
        msrp: price ?? undefined,
        availability: 'special-order' as const,
        models: modelIds,
        fits: group.map((v) => v.name).filter(Boolean).slice(0, 10).map((text) => ({ text })),
        source: 'bad-boy' as const,
        active: true,
        ...(demo && price ? { weightLb: Math.min(40, Math.max(1, Math.round(price / 25))) } : {}),
      }
      const where = partNumber ? { partNumber: { equals: partNumber } } : { slug: { equals: slug } }
      const existing = await payload.find({ collection: 'parts', where, limit: 1, depth: 0 })
      if (existing.docs[0]) await payload.update({ collection: 'parts', id: existing.docs[0].id, data: doc })
      else await payload.create({ collection: 'parts', data: doc })
      count++
    }
  }
  payload.logger.info(`[seed] ${count} accessory parts saved${demo ? ' (with sample shipping weights for the demo)' : ''}`)
}
