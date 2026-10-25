import type { Model } from '@/payload-types'

export const MAX_COMPARE = 4

const GROUP_ORDER = [
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
]

export type ComparisonRow = {
  label: string
  values: (string | null)[]
  /** True when the models don't all share the same value. */
  differs: boolean
}

export type ComparisonGroup = { group: string; rows: ComparisonRow[] }

/** Parses `?models=a,b,c` into a clean, de-duplicated, capped slug list. */
export const parseCompareParam = (value: string | string[] | undefined): string[] => {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '')
  const slugs = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]{1,80}$/.test(s))
  return [...new Set(slugs)].slice(0, MAX_COMPARE)
}

export const compareHref = (slugs: string[]) =>
  slugs.length ? `/compare?models=${slugs.map(encodeURIComponent).join(',')}` : '/compare'

/**
 * Lines up specs across models by group and label. Rows keep the order they first
 * appear in; a model missing a spec gets `null` for that row.
 */
export function buildComparison(models: Model[]): ComparisonGroup[] {
  const groups = new Map<string, Map<string, (string | null)[]>>()

  models.forEach((model, index) => {
    for (const spec of model.specs ?? []) {
      const group = spec.group ?? 'General'
      if (!groups.has(group)) groups.set(group, new Map())
      const rows = groups.get(group)!
      if (!rows.has(spec.label)) rows.set(spec.label, Array(models.length).fill(null))
      rows.get(spec.label)![index] = spec.value
    }
  })

  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g)
    return i === -1 ? GROUP_ORDER.length : i
  }

  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([group, rows]) => ({
      group,
      rows: [...rows.entries()].map(([label, values]) => {
        const normalized = values.map((v) => v?.replace(/\s+/g, ' ').trim().toLowerCase() ?? null)
        return { label, values, differs: new Set(normalized).size > 1 }
      }),
    }))
}
