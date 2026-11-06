import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import catalog from '@/seed/data/catalog.json'
import photos from '@/seed/data/photos.json'

describe('seed photos', () => {
  const slugs = new Set(catalog.models.map((m) => m.slug))

  it('only targets models that are in the catalog', () => {
    for (const t of photos.targets.filter((t) => t.kind === 'model')) expect(slugs, t.target).toContain(t.target)
  })

  it('has every file, web-sized, with a description and a unique name', () => {
    const names = new Set<string>()
    for (const t of photos.targets) {
      for (const img of t.images) {
        const file = path.resolve('src/seed/media', img.file)
        expect(existsSync(file), img.file).toBe(true)
        expect(statSync(file).size, img.file).toBeLessThan(600_000)
        expect(img.alt).toMatch(/^Bad Boy /)
        expect(names.has(path.basename(img.file)), img.file).toBe(false)
        names.add(path.basename(img.file))
      }
    }
    expect(names.size).toBeGreaterThan(100)
  })
})
