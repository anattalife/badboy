import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CompareSync } from '@/components/CompareControls'
import { EquipmentArt } from '@/components/EquipmentArt'
import { PageIntro } from '@/components/PageIntro'
import { buildComparison, compareHref, MAX_COMPARE, parseCompareParam } from '@/lib/compare'
import { categoryOf, firstImage, formatPrice, kindForCategory, modelHref } from '@/lib/format'
import { getAllModels, getCategories, getModelsBySlugs } from '@/lib/payload'

export async function generateMetadata(props: PageProps<'/compare'>): Promise<Metadata> {
  const { models } = await props.searchParams
  const slugs = parseCompareParam(models)
  const picked = await getModelsBySlugs(slugs)
  return {
    title: picked.length >= 2 ? `Compare ${picked.map((m) => m.name).join(' vs ')}` : 'Compare equipment',
    description: 'Compare Bad Boy models side by side: engine, deck, speed, capacities and more.',
  }
}

export default async function ComparePage(props: PageProps<'/compare'>) {
  const { models: param, current, add } = await props.searchParams
  // The "add a model" form submits ?current=a,b&add=c; turn that into a clean, shareable URL.
  if (add) {
    redirect(compareHref(parseCompareParam([current, add].flat().filter(Boolean).join(','))))
  }
  const slugs = parseCompareParam(param)
  const [picked, allModels, categories] = await Promise.all([
    getModelsBySlugs(slugs),
    getAllModels(),
    getCategories(),
  ])
  const pickedSlugs = picked.map((m) => m.slug!)
  const groups = buildComparison(picked)
  const canAdd = picked.length < MAX_COMPARE
  const sameCategory = new Set(picked.map((m) => categoryOf(m)?.id)).size <= 1

  return (
    <>
      <CompareSync slugs={pickedSlugs} />
      <PageIntro
        title="Compare equipment"
        lede={`Line up to ${MAX_COMPARE} Bad Boy models side by side. Rows where the models differ are highlighted.`}
        trail={[{ href: '/', label: 'Home' }, { label: 'Compare' }]}
      >
        {canAdd ? (
          <form method="get" action="/compare" className="mt-8 flex max-w-2xl flex-wrap items-end gap-3">
            {pickedSlugs.length ? <input type="hidden" name="current" value={pickedSlugs.join(',')} /> : null}
            <label className="min-w-64 flex-1 text-sm font-medium">
              {picked.length ? 'Add another model' : 'Pick a model to start'}
              <select
                name="add"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-[var(--radius-plate)] border border-steel-light bg-white px-3 py-2.5 text-ink"
              >
                <option value="" disabled>
                  Choose a model
                </option>
                {categories.map((c) => {
                  const options = allModels.filter(
                    (m) => categoryOf(m)?.id === c.id && !pickedSlugs.includes(m.slug!),
                  )
                  if (!options.length) return null
                  return (
                    <optgroup key={c.id} label={c.name}>
                      {options.map((m) => (
                        <option key={m.id} value={m.slug!}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </label>
            <button type="submit" className="btn btn-primary">
              Add to comparison
            </button>
          </form>
        ) : null}
      </PageIntro>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        {picked.length < 2 ? (
          <div className="max-w-2xl rounded-[var(--radius-plate)] bg-fescue p-8">
            <p className="text-lg">
              {picked.length === 1
                ? `Add at least one more model to compare with the ${picked[0].name}.`
                : 'Choose two or more models above, or tick “Compare” on any model in the equipment pages.'}
            </p>
            <Link href="/equipment" className="mt-4 inline-block font-semibold text-ridge underline underline-offset-4">
              Browse equipment
            </Link>
          </div>
        ) : null}

        {picked.length ? (
          <>
            {!sameCategory ? (
              <p className="mb-4 text-steel">
                These models are from different categories, so many specs won’t line up.
              </p>
            ) : null}
            <div className="overflow-x-auto rounded-[var(--radius-plate)] border border-haze bg-white">
              <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
                <caption className="sr-only">Specification comparison</caption>
                <colgroup>
                  <col className="w-36 sm:w-48" />
                  {picked.map((m) => (
                    <col key={m.id} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="align-top">
                    <td className="w-48 p-4" />
                    {picked.map((m) => {
                      const image = firstImage(m)
                      const without = pickedSlugs.filter((s) => s !== m.slug)
                      const price = formatPrice(m.startingPrice)
                      return (
                        <th key={m.id} scope="col" className="p-4 font-normal">
                          {image?.url ? (
                            <Image src={image.url} alt="" width={320} height={187} className="aspect-[12/7] w-full rounded object-cover" />
                          ) : (
                            <EquipmentArt kind={kindForCategory(categoryOf(m)?.slug)} className="aspect-[12/7] rounded" notice={false} />
                          )}
                          <p className="mt-3 text-sm text-steel">{categoryOf(m)?.name}</p>
                          <Link href={modelHref(m)} className="type-decal-md block text-xl text-ridge hover:underline">
                            {m.name}
                          </Link>
                          <p className="mt-1 font-semibold">{price ? `From ${price}` : 'Call for price'}</p>
                          <Link href={compareHref(without)} className="mt-2 inline-block text-sm text-steel underline">
                            Remove<span className="sr-only"> {m.name}</span>
                          </Link>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                {groups.map((group) => (
                  <tbody key={group.group}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={picked.length + 1}
                        className="bg-fescue px-4 py-2 font-bold text-ink [font-variation-settings:'wdth'_112]"
                      >
                        {group.group}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className={`border-t border-haze align-top ${row.differs ? 'bg-[#fff6ef]' : ''}`}>
                        <th scope="row" className="px-4 py-3 font-normal text-steel">
                          {row.label}
                          {row.differs ? <span className="sr-only"> (differs)</span> : null}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={pickedSlugs[i]} className="px-4 py-3">
                            {v ?? <span className="text-steel-light">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            <p className="mt-4 text-sm text-steel">
              Specs are from Bad Boy and can change by model year. Share this comparison by copying the page
              address.
            </p>
          </>
        ) : null}
      </div>
    </>
  )
}
