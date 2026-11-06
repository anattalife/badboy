import Image from 'next/image'
import Link from 'next/link'

import { AcreageChooser, type AcreageOption } from '@/components/AcreageChooser'
import { EquipmentArt } from '@/components/EquipmentArt'
import { ModelCard } from '@/components/ModelCard'
import { OfferCard } from '@/components/OfferCard'
import { RidgeLine } from '@/components/RidgeLine'
import { firstImage, fullAddress, kindForCategory, modelHref, telHref } from '@/lib/format'
import { countModelsByCategory, getAllModels, getCategories, getCurrentOffers, getSiteSettings } from '@/lib/payload'
import type { Media, Model } from '@/payload-types'

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
  const [settings, categories, models, counts, offers] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getAllModels(),
    countModelsByCategory(),
    getCurrentOffers(),
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
  // Each category shows the main photo of its first model that has one.
  const categoryPhoto = new Map<number, Media>()
  for (const m of models) {
    const cat = typeof m.category === 'object' ? m.category?.id : m.category
    const img = firstImage(m)
    if (cat && img?.url && !categoryPhoto.has(cat)) categoryPhoto.set(cat, img)
  }
  const customHero = typeof settings.heroImage === 'object' && settings.heroImage?.url ? settings.heroImage : null
  const heroModel = [...featured, ...models].find((m) => firstImage(m)?.url)
  const heroImage = customHero ?? (heroModel ? firstImage(heroModel) : null)
  const heroIsProduct = !customHero
  const region =
    settings.regionName || (settings.address?.city ? `the ${settings.address.city} area` : 'your property')

  return (
    <>
      <section className="relative overflow-hidden bg-ridge text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-0 hidden h-full w-[46%] -skew-x-12 bg-white/[0.04] lg:block"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pb-24 lg:pt-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">Authorized Bad Boy dealer</p>
            <h1 className="type-decal mt-3 text-[2.5rem] leading-[1.02] sm:text-6xl xl:text-7xl">
              Bad Boy equipment for {region}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              {settings.heroText ||
                'Mowers, tractors, UTVs and tools, sold, financed and serviced by people who know them.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/equipment" className="btn btn-primary">
                Shop equipment
              </Link>
              <Link href="/financing" className="btn btn-quiet text-white">
                Apply for financing
              </Link>
            </div>
          </div>
          {heroImage?.url ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              width={heroImage.width ?? 1600}
              height={heroImage.height ?? 1000}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className={`w-full ${heroIsProduct ? 'object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]' : 'aspect-[4/3] rounded-[var(--radius-plate)] object-cover'}`}
            />
          ) : null}
        </div>
        {settings.showMountains ? <RidgeLine className="absolute inset-x-0 bottom-0 h-16 sm:h-20" /> : null}
      </section>

      {offers.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-labelledby="offers-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="offers-heading" className="type-decal-md text-3xl text-ridge">
              Current offers
            </h2>
            <Link href="/offers" className="font-semibold text-ridge underline-offset-4 hover:underline">
              See all offers
            </Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {offers.slice(0, 3).map((o) => (
              <OfferCard key={o.id} offer={o} compact />
            ))}
          </div>
        </section>
      ) : null}

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
          {categories.map((category) => {
            const photo = categoryPhoto.get(category.id)
            return (
              <li key={category.id}>
                <Link
                  href={`/equipment/${category.slug}`}
                  className="group block h-full overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white hover:border-signal"
                >
                  {photo?.url ? (
                    <Image
                      src={photo.url}
                      alt=""
                      width={480}
                      height={280}
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="aspect-[12/7] w-full object-contain p-3 transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <EquipmentArt kind={kindForCategory(category.slug)} className="aspect-[12/7]" notice={false} />
                  )}
                  <span className="block border-t border-fescue p-3 sm:p-4">
                    <span className="block font-bold text-ink [font-variation-settings:'wdth'_112] group-hover:text-signal-deep">
                      {category.name}
                    </span>
                    <span className="text-sm text-steel">
                      {counts[category.id] ?? 0} {counts[category.id] === 1 ? 'model' : 'models'}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-20 bg-ridge text-white" aria-label="Find the right mower">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <AcreageChooser options={acreageOptions} />
        </div>
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

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="finance-heading">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-plate)] bg-signal p-8 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 id="finance-heading" className="type-decal-md text-3xl">
              Financing available
            </h2>
            <p className="mt-2 max-w-xl text-lg text-white/90">
              Apply online in about ten minutes. Our finance team follows up with your options, usually the same day.
            </p>
          </div>
          <Link href="/financing" className="btn shrink-0 bg-white text-ink hover:bg-paper">
            Apply now
          </Link>
        </div>
      </section>

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
