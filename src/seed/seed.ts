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
  configurations?: { name: string; deck?: string; engine?: string; horsepower?: string }[]
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
      configurations: model.configurations ?? [],
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
