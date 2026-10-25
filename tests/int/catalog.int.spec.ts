import { describe, expect, it } from 'vitest'

import catalog from '@/seed/data/catalog.json'
import { slugify } from '@/fields/slug'
import { userHasRole } from '@/access/roles'

describe('Seed catalog', () => {
  const categorySlugs = new Set(catalog.categories.map((c) => c.slug))

  it('puts every model in a known category', () => {
    const orphans = catalog.models.filter((m) => !categorySlugs.has(m.category)).map((m) => m.slug)
    expect(orphans).toEqual([])
  })

  it('has unique, URL-safe model slugs', () => {
    const slugs = catalog.models.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slugify(slug)).toBe(slug)
  })

  it('does not include prices (pricing is set by the dealer in the admin)', () => {
    expect(JSON.stringify(catalog)).not.toMatch(/"(price|msrp|startingPrice)"/i)
  })

  it('records where every model’s specs came from', () => {
    for (const m of catalog.models) expect(m.sourceUrl).toMatch(/^https:\/\/badboycountry\.com\//)
  })
})

describe('Helpers', () => {
  it('slugifies names with inch marks and punctuation', () => {
    expect(slugify('Rogue 61" Kawasaki FX1000V')).toBe('rogue-61-kawasaki-fx1000v')
    expect(slugify('  E-Series: Chainsaw ')).toBe('e-series-chainsaw')
  })

  it('treats admin as having every role', () => {
    expect(userHasRole({ roles: ['admin'] }, 'finance')).toBe(true)
    expect(userHasRole({ roles: ['sales'] }, 'finance')).toBe(false)
    expect(userHasRole({ roles: ['finance'] }, 'finance')).toBe(true)
    expect(userHasRole(null, 'sales')).toBe(false)
  })
})
