import { existsSync } from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'

import photos from './data/photos.json'

type PhotoTarget = {
  kind: 'model' | 'part'
  target: string
  images: { file: string; alt: string }[]
}

/** Seeded photo file names all start with this, so staff uploads are easy to tell apart. */
const SEED_PREFIX = 'bb-'

/**
 * Uploads the Bad Boy product photos in src/seed/media (see scripts/prepare_photos.py) and attaches
 * them to their models and parts. Safe to re-run: photos are matched by file name and uploaded once.
 * A model or part that staff have given their own photos is left alone.
 */
export async function seedPhotos(payload: Payload): Promise<{ attached: number; skipped: string[] }> {
  const dir = path.resolve(process.cwd(), 'src', 'seed', 'media')
  const skipped: string[] = []
  let attached = 0

  for (const entry of photos.targets as PhotoTarget[]) {
    const collection = entry.kind === 'model' ? 'models' : 'parts'
    const where = entry.kind === 'model' ? { slug: { equals: entry.target } } : { name: { equals: entry.target } }
    const { docs } = await payload.find({ collection, where, limit: 1, depth: 1, draft: true })
    const doc = docs[0]
    if (!doc) {
      skipped.push(`${entry.target} (not in the catalog)`)
      continue
    }
    const current = (doc.images ?? []).map((m) => (typeof m === 'object' && m ? m.filename : null))
    if (current.some((name) => !name?.startsWith(SEED_PREFIX))) {
      skipped.push(`${entry.target} (has staff photos)`)
      continue
    }

    const ids: number[] = []
    for (const image of entry.images) {
      const filename = path.basename(image.file)
      const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
      if (existing.docs[0]) {
        ids.push(existing.docs[0].id)
        continue
      }
      const filePath = path.join(dir, image.file)
      if (!existsSync(filePath)) throw new Error(`Missing seed photo ${image.file}. Run scripts/prepare_photos.py.`)
      const created = await payload.create({ collection: 'media', data: { alt: image.alt }, filePath })
      ids.push(created.id)
    }

    await payload.update({ collection, id: doc.id, data: { images: ids } })
    attached += ids.length
  }
  return { attached, skipped }
}
