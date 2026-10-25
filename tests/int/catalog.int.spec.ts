import { describe, expect, it } from 'vitest'

import catalog from '@/seed/data/catalog.json'
import { slugify } from '@/fields/slug'
import { userHasRole } from '@/access/roles'
import { buildComparison, parseCompareParam } from '@/lib/compare'
import { parseDeckInches } from '@/collections/Inventory'

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

  it('does not set dealer prices (only Bad Boy MSRP for reference)', () => {
    expect(JSON.stringify(catalog)).not.toMatch(/"(price|startingPrice)"/i)
  })

  it('has Bad Boy model numbers and MSRP on mower configurations', () => {
    const rogue = catalog.models.find((m) => m.slug === 'rogue') as any
    expect(rogue.configurations.length).toBeGreaterThanOrEqual(10)
    for (const c of rogue.configurations) {
      expect(c.modelNumber).toMatch(/^BRG/)
      expect(c.msrp).toBeGreaterThan(1000)
    }
  })

  it('gives every implement at least one size', () => {
    for (const m of catalog.models.filter((m) => m.category === 'implements') as any[]) {
      expect(m.configurations.length, m.slug).toBeGreaterThan(0)
    }
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

describe('Comparison', () => {
  const model = (slug: string, specs: { group: string; label: string; value: string }[]) =>
    ({ id: slug.length, slug, name: slug, specs }) as any

  it('lines up specs by label and flags differences', () => {
    const groups = buildComparison([
      model('a', [
        { group: 'Engine', label: 'Engine', value: 'Kawasaki' },
        { group: 'Deck', label: 'Cutting Widths', value: '54"' },
      ]),
      model('b', [
        { group: 'Deck', label: 'Cutting Widths', value: '54"' },
        { group: 'Engine', label: 'Engine', value: 'Vanguard' },
        { group: 'Engine', label: 'Horsepower', value: '40 hp' },
      ]),
    ])
    expect(groups.map((g) => g.group)).toEqual(['Engine', 'Deck'])
    const engine = groups[0].rows
    expect(engine[0]).toEqual({ label: 'Engine', values: ['Kawasaki', 'Vanguard'], differs: true })
    expect(engine[1]).toEqual({ label: 'Horsepower', values: [null, '40 hp'], differs: true })
    expect(groups[1].rows[0].differs).toBe(false)
  })

  it('cleans the models URL parameter', () => {
    expect(parseCompareParam('rogue, Rebel,rogue,<script>,a,b,c')).toEqual(['rogue', 'rebel', 'a', 'b'])
    expect(parseCompareParam(undefined)).toEqual([])
  })

  it('reads deck sizes for filtering', () => {
    expect(parseDeckInches('61"')).toBe(61)
    expect(parseDeckInches('Up to 72 inch')).toBe(72)
    expect(parseDeckInches(null)).toBeNull()
  })
})
