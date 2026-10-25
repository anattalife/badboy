import Link from 'next/link'

import { AcreageChooser, type AcreageOption } from '@/components/AcreageChooser'
import { EquipmentArt } from '@/components/EquipmentArt'
import { ModelCard } from '@/components/ModelCard'
import { RidgeLine } from '@/components/RidgeLine'
import { fullAddress, kindForCategory, modelHref, telHref } from '@/lib/format'
import { countModelsByCategory, getAllModels, getCategories, getSiteSettings } from '@/lib/payload'
import type { Model } from '@/payload-types'

/** Starting suggestions by property size. Model slugs come from the catalog. */
const ACREAGE: { id: string; label: string; advice: string; slugs: string[] }[] = [
  {
    id: 'small',
    label: 'Under 1 acre',
    advice: 'In-town lots and smaller yards: a compact zero-turn or a walk mower is usually plenty.',
    slugs: ['mz-rambler', 'push-mower', 'e-series-self-propelled-mower'],
  },
  {
    id: 'mid',
    label: '1–3 acres',
    advice: 'Most suburban and rural home lots land here. Residential zero-turns are the usual fit.',
    slugs: ['zt-elite', 'maverick', 'mz-magnum'],
  },
  {
    id: 'large',
    label: '3–10 acres',
    advice: 'Bigger properties and rough ground call for heavier decks, suspension or a small tractor.',
    slugs: ['rebel', 'maverick-hd', 'tractor-1025'],
  },
  {
    id: 'farm',
    label: '10+ acres or a farm',
    advice: 'For pasture, fence lines and chores beyond mowing, look at commercial mowers, tractors and UTVs.',
    slugs: ['rogue', 'tractor-4035', 'bandit-750-crew-cab'],
  },
  {
    id: 'pro',
    label: 'Commercial crew',
    advice: 'Built for daily hours: stand-ons for tight properties, big riders and walk-behinds for slopes.',
    slugs: ['revolt', 'renegade-diesel', 'raider'],
  },
]

const pickNote = (model: Model) =>
  model.specs?.find((s) => s.label === 'Cutting Widths')?.value ??
  model.specs?.find((s) => s.label === 'Horsepower')?.value ??
  model.tagline ??
  ''

export default async function HomePage() {
  const [settings, categories, models, counts] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getAllModels(),
    countModelsByCategory(),
  ])

  const bySlug = new Map(models.map((m) => [m.slug, m]))
  const acreageOptions: AcreageOption[] = ACREAGE.map((option) => ({
    id: option.id,
    label: option.label,
    advice: option.advice,
    picks: option.slugs
      .map((slug) => bySlug.get(slug))
      .filter((m): m is Model => Boolean(m))
      .map((m) => ({ name: m.name, href: modelHref(m), note: pickNote(m) })),
  }))
  const featured = models.filter((m) => m.featured).slice(0, 6)

  return (
    <>
      <section className="relative bg-ridge text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-36 lg:pt-20">
          <div>
            <h1 className="type-decal text-[2.6rem] sm:text-6xl xl:text-7xl">
              Bad Boy equipment for the Roanoke Valley
            </h1>
            <p className="mt-6 max-w-xl text-lg text-haze">
              Mowers, tractors, UTVs and tools, sold, financed and serviced at our shop on Melrose
              Avenue.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/equipment" className="btn btn-primary">
                Browse equipment
              </Link>
              <a href={telHref(settings.phone)} className="btn btn-quiet text-white">
                Call {settings.phone}
              </a>
            </div>
          </div>
          <AcreageChooser options={acreageOptions} />
        </div>
        <RidgeLine className="absolute inset-x-0 bottom-0 h-20 sm:h-28" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="categories-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="categories-heading" className="type-decal-md text-3xl text-ridge">
            The full Bad Boy line
          </h2>
          <Link href="/equipment" className="font-semibold text-ridge underline-offset-4 hover:underline">
            See all equipment
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/equipment/${category.slug}`}
                className="group block h-full overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white hover:border-ridge"
              >
                <EquipmentArt kind={kindForCategory(category.slug)} className="aspect-[12/7]" notice={false} />
                <span className="block p-3 sm:p-4">
                  <span className="block font-bold text-ink [font-variation-settings:'wdth'_112] group-hover:text-ridge">
                    {category.name}
                  </span>
                  <span className="text-sm text-steel">
                    {counts[category.id] ?? 0} {counts[category.id] === 1 ? 'model' : 'models'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="type-decal-md text-3xl text-ridge">
            Popular with our customers
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((model) => (
              <ModelCard key={model.id} model={model} showCategory />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="dealer-heading">
        <div className="grid gap-10 rounded-[var(--radius-plate)] bg-fescue p-8 sm:p-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="dealer-heading" className="type-decal-md text-3xl text-ridge">
              After the sale, we’re right here
            </h2>
            <p className="mt-4 text-steel">
              Buy from a local dealer and you get set-up, warranty work and parts from people who know
              the machine.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Financing',
                text: 'Apply online and our finance team will follow up with your options.',
                href: '/financing',
                cta: 'Apply for financing',
              },
              {
                title: 'Service',
                text: 'Maintenance, repairs and warranty work on Bad Boy equipment at our shop.',
                href: '/service',
                cta: 'Request service',
              },
              {
                title: 'Parts',
                text: 'Blades, belts, filters and other Bad Boy parts, shipped or ready for pickup.',
                href: '/parts',
                cta: 'Shop parts',
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-bold text-ink [font-variation-settings:'wdth'_112]">{item.title}</h3>
                <p className="mt-2 text-steel">{item.text}</p>
                <Link href={item.href} className="mt-3 inline-block font-semibold text-ridge underline underline-offset-4">
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="visit-heading">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 id="visit-heading" className="type-decal-md text-3xl text-ridge">
              Come see it in person
            </h2>
            <p className="mt-4 text-lg">{fullAddress(settings)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {settings.address?.mapUrl ? (
                <a href={settings.address.mapUrl} className="btn btn-quiet text-ridge">
                  Get directions
                </a>
              ) : null}
              <a href={telHref(settings.phone)} className="btn btn-quiet text-ridge">
                Call {settings.phone}
              </a>
            </div>
          </div>
          <dl className="grid content-start gap-2 text-lg">
            {settings.hours?.map((row) => (
              <div key={row.id ?? row.days} className="flex justify-between border-b border-haze py-2">
                <dt>{row.days}</dt>
                <dd className="font-semibold">{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
