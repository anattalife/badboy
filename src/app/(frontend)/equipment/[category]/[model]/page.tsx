import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CompareToggle } from '@/components/CompareControls'
import { EquipmentArt } from '@/components/EquipmentArt'
import { ModelCard } from '@/components/ModelCard'
import { UnitCard } from '@/components/UnitCard'
import { PartCard } from '@/components/store/PartCard'
import { Breadcrumbs } from '@/components/PageIntro'
import { categoryOf, firstImage, formatPrice, kindForCategory, telHref } from '@/lib/format'
import { toSizeMatrix } from '@/lib/specs'
import {
  getModelBySlug,
  getModelsByCategory,
  getPartsForModel,
  getSiteSettings,
  getUnitsForModel,
} from '@/lib/payload'

type Params = PageProps<'/equipment/[category]/[model]'>

async function load(props: Params) {
  const { category: categorySlug, model: modelSlug } = await props.params
  const model = await getModelBySlug(modelSlug)
  const category = model ? categoryOf(model) : null
  // The category in the URL must match the model's real category.
  if (!model || !category || category.slug !== categorySlug) return null
  return { model, category }
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const data = await load(props)
  if (!data) return {}
  return {
    title: `Bad Boy ${data.model.name}`,
    description: data.model.summary ?? data.model.tagline ?? undefined,
  }
}

export default async function ModelPage(props: Params) {
  const data = await load(props)
  if (!data) notFound()
  const { model, category } = data
  const [settings, siblings, units, parts] = await Promise.all([
    getSiteSettings(),
    getModelsByCategory(category.id),
    getUnitsForModel(model.id),
    getPartsForModel(model.id),
  ])

  const image = firstImage(model)
  const price = formatPrice(model.startingPrice)
  const specGroups = new Map<string, { label: string; value: string }[]>()
  for (const spec of model.specs ?? []) {
    const group = spec.group ?? 'General'
    specGroups.set(group, [...(specGroups.get(group) ?? []), spec])
  }
  const sizeMatrix = toSizeMatrix(
    (model.specs ?? []).filter((s) => s.group !== 'Warranty'),
    (model.configurations ?? []).map((c) => c.name),
  )
  const warranty = (model.specs ?? []).filter((s) => s.group === 'Warranty')
  if (sizeMatrix && model.configurations?.some((c) => c.modelNumber)) {
    sizeMatrix.rows.unshift({
      label: 'Model number',
      values: (model.configurations ?? []).map((c) => c.modelNumber ?? null),
    })
  }
  const related = siblings.filter((m) => m.id !== model.id).slice(0, 3)
  const quoteHref = `/contact?model=${encodeURIComponent(model.slug ?? '')}`

  return (
    <>
      <div className="border-b border-haze bg-fescue">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6">
          <Breadcrumbs
            trail={[
              { href: '/', label: 'Home' },
              { href: '/equipment', label: 'Equipment' },
              { href: `/equipment/${category.slug}`, label: category.name },
              { label: model.name },
            ]}
          />
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            {image?.url ? (
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width ?? 1200}
                height={image.height ?? 700}
                priority
                className="aspect-[12/7] w-full rounded-[var(--radius-plate)] object-cover"
              />
            ) : (
              <EquipmentArt
                kind={kindForCategory(category.slug)}
                className="aspect-[12/7] rounded-[var(--radius-plate)]"
                label={model.name}
              />
            )}
            <div>
              <p className="font-medium text-steel">Bad Boy {category.name}</p>
              <h1 className="type-decal mt-2 text-4xl text-ridge sm:text-6xl">{model.name}</h1>
              {model.tagline ? <p className="mt-4 text-xl text-ink">{model.tagline}</p> : null}
              <p className="mt-6 text-2xl font-bold text-ridge [font-variation-settings:'wdth'_110]">
                {price ? `From ${price}` : 'Call for price'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={quoteHref} className="btn btn-primary">
                  Get a quote
                </Link>
                <Link
                  href={`/financing?model=${encodeURIComponent(model.slug ?? '')}`}
                  className="btn btn-quiet text-ridge"
                >
                  Apply for financing
                </Link>
                <a href={telHref(settings.phone)} className="btn btn-quiet text-ridge">
                  Call {settings.phone}
                </a>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                {model.slug ? <CompareToggle slug={model.slug} name={model.name} /> : null}
                {units.length ? (
                  <a
                    href="#in-stock"
                    className="text-sm font-semibold text-field underline underline-offset-4"
                  >
                    {units.length} in stock now
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 pt-14 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          {model.summary ? (
            <section aria-labelledby="overview">
              <h2 id="overview" className="type-decal-md text-2xl text-ridge">
                Overview
              </h2>
              <p className="mt-4 text-lg">{model.summary}</p>
            </section>
          ) : null}
          {model.highlights?.length ? (
            <section className="mt-10" aria-labelledby="highlights">
              <h2 id="highlights" className="type-decal-md text-2xl text-ridge">
                What stands out
              </h2>
              <ul className="mt-4 space-y-3">
                {model.highlights.map((h) => (
                  <li key={h.id ?? h.text} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-field"
                    />
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {model.configurations?.length && !sizeMatrix ? (
            <section className="mt-10" aria-labelledby="configs">
              <h2 id="configs" className="type-decal-md text-2xl text-ridge">
                Configurations
              </h2>
              <ul className="mt-4 divide-y divide-haze border-y border-haze">
                {model.configurations.map((c) => (
                  <li key={c.id ?? c.name} className="py-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-steel">
                      {[
                        c.deck && `${c.deck} deck`,
                        c.engine,
                        c.horsepower,
                        c.discharge === 'rear' && 'rear discharge',
                        c.modelNumber && `Model ${c.modelNumber}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <section aria-labelledby="specs" className={sizeMatrix ? 'lg:col-span-2' : undefined}>
          <h2 id="specs" className="type-decal-md text-2xl text-ridge">
            Specifications
          </h2>
          {sizeMatrix ? (
            <div className="mt-4 space-y-6">
              <div className="overflow-x-auto rounded-[var(--radius-plate)] border border-haze bg-white">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <caption className="sr-only">Specifications by size</caption>
                  <thead>
                    <tr className="bg-fescue">
                      <td className="p-3" />
                      {sizeMatrix.sizes.map((size) => (
                        <th
                          key={size}
                          scope="col"
                          className="p-3 font-bold text-ink [font-variation-settings:'wdth'_110]"
                        >
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeMatrix.rows.map((row) => (
                      <tr key={row.label} className="border-t border-haze align-top">
                        <th scope="row" className="p-3 font-normal text-steel">
                          {row.label}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={sizeMatrix.sizes[i]} className="p-3">
                            {v ?? <span className="text-steel-light">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {warranty.map((w) => (
                <p key={w.label}>
                  <span className="font-semibold">{w.label}:</span> {w.value}
                </p>
              ))}
              <p className="text-sm text-steel">
                Specs are from Bad Boy and can change by model year. Confirm details with our sales
                team.
              </p>
            </div>
          ) : specGroups.size ? (
            <div className="mt-4 space-y-8">
              {[...specGroups.entries()].map(([group, specs]) => (
                <table key={group} className="w-full border-collapse text-left">
                  <caption className="pb-2 text-left font-bold text-ink [font-variation-settings:'wdth'_112]">
                    {group}
                  </caption>
                  <tbody>
                    {specs.map((spec) => (
                      <tr key={spec.label} className="border-t border-haze align-top">
                        <th scope="row" className="w-2/5 py-2.5 pr-4 font-normal text-steel">
                          {spec.label}
                        </th>
                        <td className="py-2.5">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
              <p className="text-sm text-steel">
                Specs are from Bad Boy and can change by model year. Confirm details with our sales
                team.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-steel">Call us for full specifications.</p>
          )}
        </section>
      </div>

      {units.length ? (
        <section
          id="in-stock"
          className="mx-auto max-w-7xl scroll-mt-6 px-4 pt-20 sm:px-6"
          aria-labelledby="stock-h"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="stock-h" className="type-decal-md text-2xl text-ridge">
              {model.name} units on our lot
            </h2>
            <Link
              href={`/inventory?model=${model.slug}`}
              className="font-semibold text-ridge hover:underline"
            >
              See all in stock
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {units.map((u) => (
              <UnitCard key={u.id} unit={u} />
            ))}
          </div>
        </section>
      ) : null}

      {parts.docs.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="parts-h">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="parts-h" className="type-decal-md text-2xl text-ridge">
              Parts and accessories for the {model.name}
            </h2>
            <Link
              href={`/parts?model=${model.slug}`}
              className="font-semibold text-ridge hover:underline"
            >
              See all {parts.totalDocs}
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {parts.docs.slice(0, 4).map((p) => (
              <PartCard key={p.id} part={p} />
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="related">
          <h2 id="related" className="type-decal-md text-2xl text-ridge">
            More {category.name.toLowerCase()}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
