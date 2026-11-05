import { readdirSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { cityState, inPlace, themeStyle } from '@/lib/format'
import { loadDealerProfile } from '@/seed/dealer'

describe('dealer profiles', () => {
  it('loads every profile in dealers/', () => {
    const names = readdirSync('dealers').filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    expect(names).toContain('roanoke-golf-cars')
    for (const name of names.filter((n) => !n.startsWith('_'))) {
      const p = loadDealerProfile(name)
      expect(p.siteName).toBeTruthy()
      expect(p.brandColor ?? '#000000').toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('refuses profile names that could leave the dealers folder', () => {
    expect(() => loadDealerProfile('../package')).toThrow(/DEALER_PROFILE/)
  })
})

describe('dealer theming', () => {
  it('sets colors only for valid hex values', () => {
    expect(themeStyle({ brandColor: '#123456', accentColor: 'red;}' })).toEqual({
      '--color-ridge': '#123456',
      '--color-ridge-deep': 'color-mix(in srgb, #123456 68%, black)',
    })
  })

  it('formats the place for page text', () => {
    expect(cityState({ address: { city: 'Roanoke', state: 'VA' } })).toBe('Roanoke, VA')
    expect(inPlace({ address: null })).toBe('')
  })
})
