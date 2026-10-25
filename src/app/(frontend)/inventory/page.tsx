import type { Metadata } from 'next'
import Link from 'next/link'

import { PageIntro } from '@/components/PageIntro'
import { UnitCard } from '@/components/UnitCard'
import { telHref } from '@/lib/format'
import { getCategories, getInventory, getSiteSettings, type InventoryFilters } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'In stock',
  description: 'New and used Bad Boy equipment on our lot in Roanoke, VA, with prices and stock numbers.',
}

const DECK_RANGES = [
  { value: '', label: 'Any deck' },
  { value: '0-44', label: 'Up to 44"' },
  { value: '45-54', label: '45"–54"' },
  { value: '55-61', label: '55"–61"' },
  { value: '62-200', label: '62" and up' },
]

const PRICE_RANGES = [
  { value: '', label: 'Any price' },
  { value: '0-5000', label: 'Under $5,000' },
  { value: '5000-10000', label: '$5,000–$10,000' },
  { value: '10000-20000', label: '$10,000–$20,000' },
  { value: '20000-1000000', label: '$20,000 and up' },
]

const SORTS = [
  { value: 'newest', label: 'Newest listings' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

const range = (v: string): [number | undefined, number | undefined] => {
  const m = v.match(/^(\d+)-(\d+)$/)
  return m ? [Number(m[1]), Number(m[2])] : [undefined, undefined]
}

export default async function InventoryPage(props: PageProps<'/inventory'>) {
  const sp = await props.searchParams
  const params = {
    category: one(sp.category),
    condition: one(sp.condition),
    price: one(sp.price),
    deck: one(sp.deck),
    sort: one(sp.sort) || 'newest',
    model: one(sp.model),
    page: Math.max(1, Number(one(sp.page)) || 1),
  }
  const [minPrice, maxPrice] = range(params.price)
  const [minDeck, maxDeck] = range(params.deck)

  const filters: InventoryFilters = {
    category: params.category || undefined,
    condition: ['new', 'used', 'demo'].includes(params.condition) ? params.condition : undefined,
    model: params.model || undefined,
    minPrice,
    maxPrice,
    minDeck,
    maxDeck,
    sort: SORTS.some((s) => s.value === params.sort) ? (params.sort as InventoryFilters['sort']) : 'newest',
    page: params.page,
  }

  const [categories, settings, result] = await Promise.all([
    getCategories(),
    getSiteSettings(),
    getInventory(filters),
  ])

  const hrefForPage = (page: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') q.set(k, String(v))
    if (page > 1) q.set('page', String(page))
    const s = q.toString()
    return s ? `/inventory?${s}` : '/inventory'
  }
  const hasFilters = Boolean(params.category || params.condition || params.price || params.deck || params.model)

  const selectClass =
    'mt-1 block w-full rounded-[var(--radius-plate)] border border-steel-light bg-white px-3 py-2.5 text-ink'

  return (
    <>
      <PageIntro
        title="In stock"
        lede="New and used equipment on our lot or on its way. Don’t see what you want? We can order any Bad Boy configuration."
        trail={[{ href: '/', label: 'Home' }, { label: 'In stock' }]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <form method="get" action="/inventory" className="grid gap-4 rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:grid-cols-2 lg:grid-cols-[repeat(5,1fr)_auto]" aria-label="Filter inventory">
          {params.model ? <input type="hidden" name="model" value={params.model} /> : null}
          <label className="text-sm font-medium">
            Equipment
            <select name="category" defaultValue={params.category} className={selectClass}>
              <option value="">All equipment</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug ?? ''}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Condition
            <select name="condition" defaultValue={params.condition} className={selectClass}>
              <option value="">New and used</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="demo">Demo</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Price
            <select name="price" defaultValue={params.price} className={selectClass}>
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Deck size
            <select name="deck" defaultValue={params.deck} className={selectClass}>
              {DECK_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Sort by
            <select name="sort" defaultValue={params.sort} className={selectClass}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button type="submit" className="btn btn-primary w-full lg:w-auto">
              Show results
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-steel">
            {result.totalDocs === 1 ? '1 unit' : `${result.totalDocs} units`}
            {hasFilters ? ' match your filters' : ' listed'}
          </p>
          {hasFilters ? (
            <Link href="/inventory" className="font-semibold text-ridge underline underline-offset-4">
              Clear filters
            </Link>
          ) : null}
        </div>

        {result.docs.length ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.docs.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--radius-plate)] bg-fescue p-8">
            <p className="text-lg">Nothing matches right now, but inventory changes every week.</p>
            <p className="mt-2 text-steel">
              Call us at{' '}
              <a href={telHref(settings.phone)} className="font-semibold text-ink underline">
                {settings.phone}
              </a>{' '}
              and we’ll find or order the machine you want, or{' '}
              <Link href="/equipment" className="font-semibold text-ink underline">
                browse the full Bad Boy lineup
              </Link>
              .
            </p>
          </div>
        )}

        {result.totalPages > 1 ? (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-4">
            {result.hasPrevPage ? (
              <Link href={hrefForPage(result.page! - 1)} className="btn btn-quiet text-ridge">
                Previous
              </Link>
            ) : null}
            <span className="text-steel">
              Page {result.page} of {result.totalPages}
            </span>
            {result.hasNextPage ? (
              <Link href={hrefForPage(result.page! + 1)} className="btn btn-quiet text-ridge">
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </>
  )
}
