type FinanceSettings = {
  financeApplication?: 'builtin' | 'links' | 'both' | null
  financeLinks?: { label: string; url: string; note?: string | null; id?: string | null }[] | null
}

/**
 * What the Financing page offers. Lender links must be https. With "links only" and no valid link,
 * the built-in application stays on so customers always have a way to apply.
 */
export function financeOptions(settings: FinanceSettings) {
  const links = (settings.financeLinks ?? []).filter(
    (l) => /^https:\/\//i.test(l.url ?? '') && URL.canParse(l.url),
  )
  const mode = settings.financeApplication ?? 'builtin'
  return {
    links: mode === 'builtin' ? [] : links,
    showForm: mode !== 'links' || links.length === 0,
  }
}
