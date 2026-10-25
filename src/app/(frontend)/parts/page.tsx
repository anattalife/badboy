import type { Metadata } from 'next'
import Link from 'next/link'

import { PageIntro } from '@/components/PageIntro'
import { PartCard } from '@/components/store/PartCard'
import { PART_CATEGORIES } from '@/collections/Parts'
import { categoryOf, telHref } from '@/lib/format'
import { getAllModels, getParts, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Parts and accessories',
  description: 'Bad Boy parts and accessories shipped by UPS from Roanoke Mowers in Roanoke, VA.',
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

export default async function PartsPage(props: PageProps<'/parts'>) {
  const sp = await props.searchParams
  const params = {
    q: one(sp.q).slice(0, 80),
    category: PART_CATEGORIES.some((c) => c.value === one(sp.category)) ? one(sp.category) : '',
    model: one(sp.model).slice(0, 80),
    page: Math.max(1, Number(one(sp.page)) || 1),
  }
  const [result, models, settings] = await Promise.all([
    getParts({ q: params.q, category: params.category || undefined, model: params.model || undefined, page: params.page }),
    getAllModels(),
    getSiteSettings(),
  ])
  const machines = models.filter((m) => ['zero-turn-mowers', 'stand-on-mowers', 'walk-behind-mowers', 'utvs', 'tractors'].includes(categoryOf(m)?.slug ?? ''))
  const hasFilters = Boolean(params.q || params.category || params.model)

  const hrefForPage = (page: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') q.set(k, String(v))
    if (page > 1) q.set('page', String(page))
    return `/parts${q.toString() ? `?${q}` : ''}`
  }
  const control =
    'mt-1 block w-full rounded-[var(--radius-plate)] border border-steel-light bg-white px-3 py-2.5 text-ink'

  return (
    <>
      <PageIntro
        title="Parts and accessories"
        lede="Bad Boy accessories and parts, shipped by UPS. Can’t find a part number? Call our parts counter."
        trail={[{ href: '/', label: 'Home' }, { label: 'Parts' }]}
      />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <form method="get" action="/parts" role="search" className="grid gap-4 rounded-[var(--radius-plate)] border border-haze bg-white p-5 md:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="text-sm font-medium">
            Search by name or part number
            <input type="search" name="q" defaultValue={params.q} placeholder="e.g. bagger, 088-4020-00" className={control} />
          </label>
          <label className="text-sm font-medium">
            Type
            <select name="category" defaultValue={params.category} className={control}>
              <option value="">All parts</option>
              {PART_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Fits my machine
            <select name="model" defaultValue={params.model} className={control}>
              <option value="">Any machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.slug ?? ''}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              Find parts
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-steel">
            {result.totalDocs === 1 ? '1 part' : `${result.totalDocs} parts`}
            {hasFilters ? ' found' : ''}
          </p>
          {hasFilters ? (
            <Link href="/parts" className="font-semibold text-ridge underline underline-offset-4">
              Clear search
            </Link>
          ) : null}
        </div>

        {result.docs.length ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.docs.map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[var(--radius-plate)] bg-fescue p-8">
            <p className="text-lg">No parts match that search.</p>
            <p className="mt-2 text-steel">
              Call our parts counter at{' '}
              <a href={telHref(settings.phone)} className="font-semibold text-ink underline">
                {settings.phone}
              </a>{' '}
              with your model and serial number and we’ll find it.
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
