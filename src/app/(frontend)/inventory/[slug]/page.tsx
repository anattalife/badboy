import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EquipmentArt } from '@/components/EquipmentArt'
import { Breadcrumbs } from '@/components/PageIntro'
import { PriceLine, unitCategory } from '@/components/UnitCard'
import { kindForCategory, modelHref, telHref } from '@/lib/format'
import { getSiteSettings, getUnitBySlug } from '@/lib/payload'
import type { Media, Model } from '@/payload-types'

const CONDITION: Record<string, string> = { new: 'New', used: 'Used', demo: 'Demo' }
const STATUS: Record<string, string> = {
  available: 'In stock',
  'on-order': 'On order',
  pending: 'Sale pending',
}

export async function generateMetadata(props: PageProps<'/inventory/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const unit = await getUnitBySlug(slug)
  if (!unit) return {}
  return {
    title: `${unit.title} · Stock ${unit.stockNumber}`,
    description: unit.description ?? `${CONDITION[unit.condition]} ${unit.title} for sale in Roanoke, VA.`,
  }
}

export default async function UnitPage(props: PageProps<'/inventory/[slug]'>) {
  const { slug } = await props.params
  const [unit, settings] = await Promise.all([getUnitBySlug(slug), getSiteSettings()])
  if (!unit) notFound()

  const category = unitCategory(unit)
  const model: Model | null = typeof unit.model === 'object' ? unit.model : null
  const photos = (unit.photos ?? []).filter((p): p is Media => typeof p === 'object' && Boolean(p?.url))
  const [main, ...rest] = photos
  const quoteHref = `/contact?unit=${encodeURIComponent(unit.stockNumber)}`

  const details: [string, string | number | null | undefined][] = [
    ['Condition', CONDITION[unit.condition]],
    ['Status', STATUS[unit.status]],
    ['Year', unit.year],
    ['Make', unit.make ?? 'Bad Boy'],
    ['Model', model?.name ?? unit.otherModelName],
    ['Configuration', unit.configuration],
    ['Deck', unit.deck],
    ['Engine', unit.engine],
    ['Hours', unit.hours != null ? unit.hours.toLocaleString() : null],
    ['Stock number', unit.stockNumber],
  ]
  const keySpecs = (model?.specs ?? []).slice(0, 8)

  return (
    <>
      <div className="border-b border-haze bg-fescue">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6">
          <Breadcrumbs
            trail={[
              { href: '/', label: 'Home' },
              { href: '/inventory', label: 'In stock' },
              { label: `Stock ${unit.stockNumber}` },
            ]}
          />
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              {main ? (
                <Image
                  src={main.url!}
                  alt={main.alt}
                  width={main.width ?? 1200}
                  height={main.height ?? 700}
                  priority
                  className="aspect-[12/7] w-full rounded-[var(--radius-plate)] object-cover"
                />
              ) : (
                <EquipmentArt
                  kind={kindForCategory(category?.slug)}
                  className="aspect-[12/7] rounded-[var(--radius-plate)]"
                  label={unit.title ?? ''}
                />
              )}
              {rest.length ? (
                <ul className="mt-3 grid grid-cols-4 gap-3">
                  {rest.slice(0, 8).map((p) => (
                    <li key={p.id}>
                      <a href={p.url!} target="_blank" rel="noreferrer">
                        <Image
                          src={p.url!}
                          alt={p.alt}
                          width={300}
                          height={175}
                          className="aspect-[12/7] w-full rounded object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div>
              <p className="font-medium text-steel">
                {CONDITION[unit.condition]} · {STATUS[unit.status]}
              </p>
              <h1 className="type-decal-md mt-2 text-3xl text-ridge sm:text-4xl">{unit.title}</h1>
              <div className="mt-5">
                <PriceLine unit={unit} size="lg" />
                {unit.price ? (
                  <p className="mt-1 text-sm text-steel">Taxes and fees not included.</p>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={quoteHref} className="btn btn-primary">
                  Ask about this unit
                </Link>
                <Link href="/financing" className="btn btn-quiet text-ridge">
                  Apply for financing
                </Link>
                <a href={telHref(settings.phone)} className="btn btn-quiet text-ridge">
                  Call {settings.phone}
                </a>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-haze">
                {details
                  .filter(([, v]) => v != null && v !== '')
                  .map(([label, value]) => (
                    <div key={label} className="border-b border-haze py-2.5">
                      <dt className="text-sm text-steel">{label}</dt>
                      <dd className="font-semibold">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 pt-14 sm:px-6 lg:grid-cols-2">
        {unit.description ? (
          <section aria-labelledby="notes">
            <h2 id="notes" className="type-decal-md text-2xl text-ridge">
              About this unit
            </h2>
            <p className="mt-4 whitespace-pre-line text-lg">{unit.description}</p>
          </section>
        ) : null}
        {model && keySpecs.length ? (
          <section aria-labelledby="model-specs">
            <h2 id="model-specs" className="type-decal-md text-2xl text-ridge">
              Bad Boy {model.name} specs
            </h2>
            <table className="mt-4 w-full border-collapse text-left">
              <tbody>
                {keySpecs.map((s) => (
                  <tr key={s.label} className="border-t border-haze align-top">
                    <th scope="row" className="w-2/5 py-2.5 pr-4 font-normal text-steel">
                      {s.label}
                    </th>
                    <td className="py-2.5">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link href={modelHref(model)} className="mt-4 inline-block font-semibold text-ridge underline underline-offset-4">
              All {model.name} specs and configurations
            </Link>
          </section>
        ) : null}
      </div>
    </>
  )
}
