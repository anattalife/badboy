import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EquipmentArt } from '@/components/EquipmentArt'
import { ModelCard } from '@/components/ModelCard'
import { Breadcrumbs } from '@/components/PageIntro'
import { categoryOf, firstImage, formatPrice, kindForCategory, telHref } from '@/lib/format'
import { getModelBySlug, getModelsByCategory, getSiteSettings } from '@/lib/payload'

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
  const [settings, siblings] = await Promise.all([getSiteSettings(), getModelsByCategory(category.id)])

  const image = firstImage(model)
  const price = formatPrice(model.startingPrice)
  const specGroups = new Map<string, { label: string; value: string }[]>()
  for (const spec of model.specs ?? []) {
    const group = spec.group ?? 'General'
    specGroups.set(group, [...(specGroups.get(group) ?? []), spec])
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
                <Link href="/financing" className="btn btn-quiet text-ridge">
                  Apply for financing
                </Link>
                <a href={telHref(settings.phone)} className="btn btn-quiet text-ridge">
                  Call {settings.phone}
                </a>
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
                    <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-field" />
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {model.configurations?.length ? (
            <section className="mt-10" aria-labelledby="configs">
              <h2 id="configs" className="type-decal-md text-2xl text-ridge">
                Configurations
              </h2>
              <ul className="mt-4 divide-y divide-haze border-y border-haze">
                {model.configurations.map((c) => (
                  <li key={c.id ?? c.name} className="py-3">
                    <p className="font-semibold">{c.name}</p>
                    {[c.deck, c.engine, c.horsepower].filter(Boolean).length ? (
                      <p className="text-sm text-steel">
                        {[c.deck && `${c.deck} deck`, c.engine, c.horsepower].filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <section aria-labelledby="specs">
          <h2 id="specs" className="type-decal-md text-2xl text-ridge">
            Specifications
          </h2>
          {specGroups.size ? (
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
                Specs are from Bad Boy and can change by model year. Confirm details with our sales team.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-steel">Call us for full specifications.</p>
          )}
        </section>
      </div>

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
