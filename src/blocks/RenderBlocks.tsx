import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import Link from 'next/link'

import { AcreageChooser, type AcreageOption } from '@/components/AcreageChooser'
import { EquipmentArt } from '@/components/EquipmentArt'
import { LeadForm } from '@/components/forms/LeadForm'
import { ModelCard } from '@/components/ModelCard'
import { OfferCard } from '@/components/OfferCard'
import { RidgeLine } from '@/components/RidgeLine'
import { UnitCard } from '@/components/UnitCard'
import { firstImage, fullAddress, kindForCategory, modelHref, telHref } from '@/lib/format'
import {
  countModelsByCategory,
  getAllModels,
  getCategories,
  getCurrentOffers,
  getInventory,
  getSiteSettings,
} from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'
import type { Media, Model, Page, SiteSetting } from '@/payload-types'

export type PageBlock = NonNullable<Page['layout']>[number]
type BlockOf<T extends PageBlock['blockType']> = Extract<PageBlock, { blockType: T }>

const media = (m: unknown): Media | null => (m && typeof m === 'object' && (m as Media).url ? (m as Media) : null)
const section = 'mx-auto max-w-7xl px-4 pt-16 sm:px-6'
const h2 = 'type-decal-md text-3xl text-ridge'

/** Internal links stay in the site; outside links open normally. */
function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return href.startsWith('/') || href.startsWith('#') ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

const fillRegion = (text: string, settings: SiteSetting) =>
  text.replaceAll(
    '{region}',
    settings.regionName || (settings.address?.city ? `the ${settings.address.city} area` : 'your property'),
  )

/* ------------------------------------------------------------------ */

async function Hero({ block, first }: { block: BlockOf<'hero'>; first: boolean }) {
  const [settings, models] = await Promise.all([getSiteSettings(), getAllModels()])
  const custom = media(block.image) ?? media(settings.heroImage)
  const featured = models.filter((m) => m.featured)
  const productModel = [...featured, ...models].find((m) => firstImage(m)?.url)
  const image = custom ?? (productModel ? firstImage(productModel) : null)
  const isProduct = !custom
  const Heading = first ? 'h1' : 'h2'
  return (
    <section className="relative overflow-hidden bg-ridge text-white">
      <div aria-hidden="true" className="absolute -right-24 top-0 hidden h-full w-[46%] -skew-x-12 bg-white/[0.04] lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pb-24 lg:pt-16">
        <div>
          {block.eyebrow ? (
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-signal">{block.eyebrow}</p>
          ) : null}
          <Heading className="type-decal mt-3 text-[2.5rem] leading-[1.02] sm:text-6xl xl:text-7xl">
            {fillRegion(block.heading, settings)}
          </Heading>
          {block.text || settings.heroText ? (
            <p className="mt-6 max-w-xl text-lg text-white/80">{fillRegion(block.text || settings.heroText || '', settings)}</p>
          ) : null}
          {block.buttons?.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {block.buttons.map((b) => (
                <SmartLink
                  key={b.id ?? b.label}
                  href={b.url}
                  className={b.style === 'outline' ? 'btn btn-quiet text-white' : 'btn btn-primary'}
                >
                  {b.label}
                </SmartLink>
              ))}
            </div>
          ) : null}
        </div>
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width ?? 1600}
            height={image.height ?? 1000}
            priority={first}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className={`w-full ${isProduct ? 'object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]' : 'aspect-[4/3] rounded-[var(--radius-plate)] object-cover'}`}
          />
        ) : null}
      </div>
      {block.showMountains ? <RidgeLine className="absolute inset-x-0 bottom-0 h-16 sm:h-20" /> : null}
    </section>
  )
}

function Content({ block }: { block: BlockOf<'content'> }) {
  const panel = block.background === 'panel'
  return (
    <section className={section}>
      <div
        className={`${block.width === 'wide' ? '' : 'max-w-3xl'} ${panel ? 'rounded-[var(--radius-plate)] bg-fescue p-8 sm:p-10' : ''}`}
      >
        <RichText data={block.body} className="rich-text" />
      </div>
    </section>
  )
}

function MediaText({ block }: { block: BlockOf<'mediaText'> }) {
  const img = media(block.image)
  return (
    <section className={section}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        {img ? (
          <Image
            src={img.url!}
            alt={img.alt}
            width={img.width ?? 1200}
            height={img.height ?? 800}
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`w-full rounded-[var(--radius-plate)] object-cover ${block.imagePosition === 'right' ? 'md:order-2' : ''}`}
          />
        ) : null}
        <div>
          {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
          {block.body ? <RichText data={block.body} className="rich-text mt-4" /> : null}
          {block.buttonLabel && block.buttonUrl ? (
            <SmartLink href={block.buttonUrl} className="btn btn-primary mt-6">
              {block.buttonLabel}
            </SmartLink>
          ) : null}
        </div>
      </div>
    </section>
  )
}

async function CategoryGrid({ block }: { block: BlockOf<'categoryGrid'> }) {
  const [categories, models, counts] = await Promise.all([getCategories(), getAllModels(), countModelsByCategory()])
  const photo = new Map<number, Media>()
  for (const m of models) {
    const cat = typeof m.category === 'object' ? m.category?.id : m.category
    const img = firstImage(m)
    if (cat && img?.url && !photo.has(cat)) photo.set(cat, img)
  }
  return (
    <section className={section}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {block.heading ? <h2 className={h2}>{block.heading}</h2> : <span />}
        <Link href="/equipment" className="font-semibold text-ridge underline-offset-4 hover:underline">
          See all equipment
        </Link>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => {
          const img = photo.get(category.id)
          return (
            <li key={category.id}>
              <Link
                href={`/equipment/${category.slug}`}
                className="group block h-full overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white hover:border-signal"
              >
                {img?.url ? (
                  <Image
                    src={img.url}
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
  )
}

async function FeaturedModels({ block }: { block: BlockOf<'featuredModels'> }) {
  const all = await getAllModels()
  const byId = new Map(all.map((m) => [m.id, m]))
  const chosen = (block.models ?? [])
    .map((m) => byId.get(typeof m === 'object' ? m.id : m))
    .filter((m): m is Model => Boolean(m))
  const models = chosen.length ? chosen : all.filter((m) => m.featured).slice(0, 6)
  if (!models.length) return null
  return (
    <section className={section}>
      {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} showCategory />
        ))}
      </div>
    </section>
  )
}

async function Offers({ block }: { block: BlockOf<'offers'> }) {
  const offers = (await getCurrentOffers()).slice(0, block.limit ?? 3)
  if (!offers.length) return null
  return (
    <section className={section}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {block.heading ? <h2 className={h2}>{block.heading}</h2> : <span />}
        <Link href="/offers" className="font-semibold text-ridge underline-offset-4 hover:underline">
          See all offers
        </Link>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {offers.map((o) => (
          <OfferCard key={o.id} offer={o} compact />
        ))}
      </div>
    </section>
  )
}

async function InStock({ block }: { block: BlockOf<'inStock'> }) {
  const { docs } = await getInventory({ sort: 'newest', page: 1 })
  const units = docs.slice(0, block.limit ?? 3)
  if (!units.length) return null
  return (
    <section className={section}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {block.heading ? <h2 className={h2}>{block.heading}</h2> : <span />}
        <Link href="/inventory" className="font-semibold text-ridge underline-offset-4 hover:underline">
          See everything in stock
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => (
          <UnitCard key={u.id} unit={u} />
        ))}
      </div>
    </section>
  )
}

const pickNote = (model: Model) =>
  model.specs?.find((s) => s.label === 'Cutting Widths')?.value ??
  model.specs?.find((s) => s.label === 'Horsepower')?.value ??
  model.tagline ??
  ''

async function Acreage({ block }: { block: BlockOf<'acreage'> }) {
  const all = await getAllModels()
  const byId = new Map(all.map((m) => [m.id, m]))
  const options: AcreageOption[] = (block.options ?? []).map((o, i) => ({
    id: o.id ?? String(i),
    label: o.label,
    advice: o.advice,
    picks: (o.models ?? [])
      .map((m) => byId.get(typeof m === 'object' ? m.id : m))
      .filter((m): m is Model => Boolean(m))
      .map((m) => ({ name: m.name, href: modelHref(m), note: pickNote(m) })),
  }))
  if (!options.length) return null
  return (
    <section className="mt-16 bg-ridge text-white" aria-label={block.heading ?? 'Find the right mower'}>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <AcreageChooser options={options} heading={block.heading ?? undefined} />
      </div>
    </section>
  )
}

function CallToAction({ block }: { block: BlockOf<'callToAction'> }) {
  const tone =
    block.color === 'brand'
      ? 'bg-ridge text-white'
      : block.color === 'light'
        ? 'bg-fescue text-ink'
        : 'bg-signal text-white'
  return (
    <section className={section}>
      <div className={`flex flex-col items-start justify-between gap-6 rounded-[var(--radius-plate)] p-8 sm:p-10 md:flex-row md:items-center ${tone}`}>
        <div>
          <h2 className="type-decal-md text-3xl">{block.heading}</h2>
          {block.text ? <p className="mt-2 max-w-xl text-lg opacity-90">{block.text}</p> : null}
        </div>
        {block.buttonLabel && block.buttonUrl ? (
          <SmartLink
            href={block.buttonUrl}
            className={`btn shrink-0 ${block.color === 'light' ? 'btn-primary' : 'bg-white text-ink hover:bg-paper'}`}
          >
            {block.buttonLabel}
          </SmartLink>
        ) : null}
      </div>
    </section>
  )
}

function Features({ block }: { block: BlockOf<'features'> }) {
  const items = block.items ?? []
  const cols = items.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  const panel = block.background !== 'none'
  return (
    <section className={section}>
      <div className={`grid gap-10 ${panel ? 'rounded-[var(--radius-plate)] bg-fescue p-8 sm:p-10' : ''} ${block.heading || block.intro ? 'lg:grid-cols-[1fr_2fr]' : ''}`}>
        {block.heading || block.intro ? (
          <div>
            {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
            {block.intro ? <p className="mt-4 text-steel">{block.intro}</p> : null}
          </div>
        ) : null}
        <div className={`grid gap-8 ${cols}`}>
          {items.map((item) => (
            <div key={item.id ?? item.title}>
              <h3 className="font-bold text-ink [font-variation-settings:'wdth'_112]">{item.title}</h3>
              {item.text ? <p className="mt-2 text-steel">{item.text}</p> : null}
              {item.linkLabel && item.linkUrl ? (
                <SmartLink href={item.linkUrl} className="mt-3 inline-block font-semibold text-ridge underline underline-offset-4">
                  {item.linkLabel}
                </SmartLink>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq({ block }: { block: BlockOf<'faq'> }) {
  return (
    <section className={section}>
      {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
      <div className="mt-6 max-w-3xl divide-y divide-haze border-y border-haze">
        {(block.items ?? []).map((item) => (
          <details key={item.id ?? item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
              {item.question}
              <span aria-hidden="true" className="text-signal transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-steel">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

async function Visit({ block }: { block: BlockOf<'visit'> }) {
  const settings = await getSiteSettings()
  return (
    <section className={section}>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
          {block.text ? <p className="mt-4 text-steel">{block.text}</p> : null}
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
  )
}

function LeadFormSection({ block, path }: { block: BlockOf<'leadForm'>; path: string }) {
  return (
    <section className={section}>
      <div className="max-w-3xl">
        {block.heading ? <h2 className={h2}>{block.heading}</h2> : null}
        {block.intro ? <p className="mt-3 text-lg text-steel">{block.intro}</p> : null}
        <div className="mt-6">
          <LeadForm
            type={block.formType ?? 'contact'}
            page={path}
            siteKey={turnstileSiteKey()}
            renderedAt={formRenderedAt()}
          />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

/** Renders a page's blocks in order. `startsPage` lets the first hero use the page's h1. */
export function RenderBlocks({ blocks, path, startsPage = false }: { blocks?: Page['layout']; path: string; startsPage?: boolean }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`
        switch (block.blockType) {
          case 'hero':
            return <Hero key={key} block={block} first={startsPage && i === 0} />
          case 'content':
            return <Content key={key} block={block} />
          case 'mediaText':
            return <MediaText key={key} block={block} />
          case 'categoryGrid':
            return <CategoryGrid key={key} block={block} />
          case 'featuredModels':
            return <FeaturedModels key={key} block={block} />
          case 'offers':
            return <Offers key={key} block={block} />
          case 'inStock':
            return <InStock key={key} block={block} />
          case 'acreage':
            return <Acreage key={key} block={block} />
          case 'callToAction':
            return <CallToAction key={key} block={block} />
          case 'features':
            return <Features key={key} block={block} />
          case 'faq':
            return <Faq key={key} block={block} />
          case 'visit':
            return <Visit key={key} block={block} />
          case 'leadForm':
            return <LeadFormSection key={key} block={block} path={path} />
          default:
            return null
        }
      })}
    </>
  )
}
