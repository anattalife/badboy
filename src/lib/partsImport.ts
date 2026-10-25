import type { Payload, PayloadRequest } from 'payload'

import { mapColumns, parseCsv, parseMoney, parseNumber } from './csv'

type ModelRef = { id: number; name: string; slug?: string | null }

/** Turns free-text category names from a price list into store categories. */
export function categoryFromText(text: string): 'mower-accessories' | 'utv-accessories' | 'e-series' | 'maintenance' | 'other' {
  const t = text.toLowerCase()
  if (/e-?series|battery|80v|charger/.test(t)) return 'e-series'
  if (/utv|bandit|side.?by.?side/.test(t)) return 'utv-accessories'
  if (/filter|belt|blade|oil|spark|maint|bearing|spindle|grease/.test(t)) return 'maintenance'
  if (/mower|deck|accessor|zero.?turn|stand.?on/.test(t)) return 'mower-accessories'
  return 'other'
}

/**
 * Finds Bad Boy models mentioned in fitment text. Longer names win first, so
 * "Rebel X" isn't also counted as "Rebel". Tractors also match on their number (e.g. "1025").
 */
export function matchModels(text: string, models: ModelRef[]): number[] {
  let remaining = ` ${text.toLowerCase()} `
  const found = new Set<number>()
  const candidates = models
    .flatMap((m) => {
      const names = [m.name.toLowerCase()]
      const num = m.slug?.match(/^tractor-(\d{4})$/)?.[1]
      if (num) names.push(num)
      return names.map((n) => ({ id: m.id, n }))
    })
    .sort((a, b) => b.n.length - a.n.length)

  for (const { id, n } of candidates) {
    const re = new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^a-z0-9]|$)`, 'g')
    if (re.test(remaining)) {
      found.add(id)
      remaining = remaining.replace(re, '$1 ')
    }
  }
  return [...found]
}

export type ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
  columns: Record<string, string>
}

/**
 * Creates or updates parts from a CSV price list, matching on part number.
 * Only columns present in the file are changed on existing parts.
 */
export async function importPartsCsv(
  payload: Payload,
  csvText: string,
  options: { req?: PayloadRequest; maxRows?: number } = {},
): Promise<ImportResult> {
  const { req, maxRows = 3000 } = options
  const { headers, rows } = parseCsv(csvText)
  const cols = mapColumns(headers)
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [], columns: cols as Record<string, string> }

  if (!cols.partNumber) {
    result.errors.push('No part number column found. Name a column “Part Number” (or SKU).')
    return result
  }
  if (rows.length > maxRows) {
    result.errors.push(`This file has ${rows.length} rows. Split it into files of ${maxRows} rows or fewer.`)
    return result
  }

  const models = (
    await payload.find({ collection: 'models', limit: 500, depth: 0, select: { name: true, slug: true }, draft: true, req })
  ).docs as ModelRef[]

  // Look up existing parts in chunks (D1 limits parameters per query).
  const numbers = [...new Set(rows.map((r) => r[cols.partNumber!]).filter(Boolean))]
  const existing = new Map<string, number>()
  for (let i = 0; i < numbers.length; i += 50) {
    const { docs } = await payload.find({
      collection: 'parts',
      where: { partNumber: { in: numbers.slice(i, i + 50) } },
      limit: 50,
      depth: 0,
      select: { partNumber: true },
      req,
    })
    for (const d of docs) if (d.partNumber) existing.set(d.partNumber, d.id)
  }

  const get = (row: Record<string, string>, key: keyof typeof cols) => (cols[key] ? row[cols[key]!] : undefined)

  for (const [index, row] of rows.entries()) {
    const line = index + 2 // header is line 1
    const partNumber = get(row, 'partNumber')?.slice(0, 60)
    if (!partNumber) {
      result.skipped++
      continue
    }
    const name = get(row, 'name')?.slice(0, 200)
    const priceRaw = get(row, 'price')
    const price = parseMoney(priceRaw)
    if (priceRaw && price === null) {
      result.errors.push(`Line ${line} (${partNumber}): price “${priceRaw}” isn’t a number; skipped.`)
      result.skipped++
      continue
    }

    const fitsText = get(row, 'fits')
    const data: Record<string, unknown> = {}
    if (name) data.name = name
    const description = get(row, 'description')
    if (description && cols.description !== cols.name) data.description = description.slice(0, 2000)
    if (price !== null) data.price = price
    const msrp = parseMoney(get(row, 'msrp'))
    if (msrp !== null) data.msrp = msrp
    const category = get(row, 'category')
    if (category) data.category = categoryFromText(category)
    for (const key of ['weightLb', 'lengthIn', 'widthIn', 'heightIn', 'stockQty'] as const) {
      const n = parseNumber(get(row, key))
      if (n !== null) data[key] = key === 'stockQty' ? Math.floor(n) : n
    }
    if (fitsText) {
      data.fits = fitsText
        .split(/[;|]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map((text) => ({ text: text.slice(0, 200) }))
      const ids = matchModels(fitsText, models)
      if (ids.length) data.models = ids
    }

    try {
      const id = existing.get(partNumber)
      if (id) {
        await payload.update({ collection: 'parts', id, data, req })
        result.updated++
      } else {
        if (!name) {
          result.errors.push(`Line ${line} (${partNumber}): new part needs a name; skipped.`)
          result.skipped++
          continue
        }
        const doc = await payload.create({
          collection: 'parts',
          data: {
            ...data,
            name,
            partNumber,
            category: (data.category as string) ?? categoryFromText(`${name} ${description ?? ''}`),
            source: 'import',
            active: true,
          } as never,
          req,
        })
        existing.set(partNumber, doc.id)
        result.created++
      }
    } catch (error) {
      result.errors.push(`Line ${line} (${partNumber}): ${(error as Error).message}`)
      result.skipped++
    }
    if (result.errors.length > 50) {
      result.errors.push('Stopped after 50 errors. Fix the file and upload it again.')
      break
    }
  }
  return result
}
