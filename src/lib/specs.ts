type Spec = { label: string; value: string; group?: string | null }

export type SizeMatrix = {
  sizes: string[]
  rows: { label: string; values: (string | null)[] }[]
}

/**
 * Implement specs are stored as "4' Cutter: 48\" | 5' Cutter: 60\"" when they vary by size.
 * When every varying row follows that pattern with known size names, turn the specs into a
 * size-by-spec table. Returns null when the specs don't fit that shape.
 */
export function toSizeMatrix(specs: Spec[], sizeNames: string[]): SizeMatrix | null {
  if (sizeNames.length < 2) return null
  const known = new Set(sizeNames)
  const rows: SizeMatrix['rows'] = []
  let varying = 0

  for (const spec of specs) {
    if (!spec.value.includes(' | ')) {
      rows.push({ label: spec.label, values: sizeNames.map(() => spec.value) })
      continue
    }
    const byName = new Map<string, string>()
    for (const part of spec.value.split(' | ')) {
      const idx = part.indexOf(': ')
      if (idx === -1) return null
      const name = part.slice(0, idx)
      if (!known.has(name)) return null
      byName.set(name, part.slice(idx + 2))
    }
    varying++
    rows.push({ label: spec.label, values: sizeNames.map((n) => byName.get(n) ?? null) })
  }

  return varying ? { sizes: sizeNames, rows } : null
}
