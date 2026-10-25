/**
 * Small RFC 4180 CSV parser (quoted fields, escaped quotes, commas and newlines inside quotes).
 * Returns rows as objects keyed by the header row. Handles a UTF-8 BOM and CRLF line endings.
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const input = text.replace(/^﻿/, '')
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') {
      record.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else field += c
  }
  if (field !== '' || record.length) {
    record.push(field)
    records.push(record)
  }

  const nonEmpty = records.filter((r) => r.some((v) => v.trim() !== ''))
  if (!nonEmpty.length) return { headers: [], rows: [] }
  const headers = nonEmpty[0].map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((r) => {
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => (row[h] = (r[idx] ?? '').trim()))
    return row
  })
  return { headers, rows }
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Column names we accept for each part field, so a dealer's existing price list export can be
 * uploaded as-is in most cases. Matching ignores case, spaces and punctuation.
 */
export const PART_COLUMNS = {
  partNumber: ['partnumber', 'part', 'partno', 'part#', 'sku', 'item', 'itemnumber', 'itemno', 'number'],
  name: ['name', 'partname', 'title', 'itemname', 'productname'],
  description: ['description', 'desc', 'itemdescription', 'details', 'longdescription'],
  price: ['price', 'yourprice', 'sellprice', 'saleprice', 'unitprice', 'retail', 'retailprice', 'sell'],
  msrp: ['msrp', 'list', 'listprice', 'suggestedretail', 'suggestedretailprice'],
  category: ['category', 'type', 'department', 'productline', 'line'],
  weightLb: ['weight', 'weightlb', 'weightlbs', 'shippingweight', 'lbs', 'wt'],
  lengthIn: ['length', 'lengthin', 'len', 'l'],
  widthIn: ['width', 'widthin', 'w'],
  heightIn: ['height', 'heightin', 'h'],
  stockQty: ['qty', 'quantity', 'onhand', 'qtyonhand', 'stock', 'instock'],
  fits: ['fits', 'fitment', 'models', 'compatiblemodels', 'application'],
} as const

export type PartColumn = keyof typeof PART_COLUMNS

/** Maps each part field to the matching header in this file (if any). */
export function mapColumns(headers: string[]): Partial<Record<PartColumn, string>> {
  const out: Partial<Record<PartColumn, string>> = {}
  const normalized = headers.map((h) => [h, norm(h)] as const)
  for (const [field, aliases] of Object.entries(PART_COLUMNS) as [PartColumn, readonly string[]][]) {
    const aliasSet = new Set(aliases.map(norm))
    const hit = normalized.find(([, n]) => aliasSet.has(n))
    if (hit) out[field] = hit[0]
  }
  // A file with only "Description" uses it as the name too.
  if (!out.name && out.description) out.name = out.description
  return out
}

export const parseMoney = (v?: string): number | null => {
  if (!v) return null
  const n = Number(v.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

export const parseNumber = (v?: string): number | null => {
  if (!v) return null
  const n = Number(v.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : null
}
