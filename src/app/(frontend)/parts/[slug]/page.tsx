import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { canBuyOnline, PART_CATEGORIES } from '@/collections/Parts'
import { EquipmentArt } from '@/components/EquipmentArt'
import { Breadcrumbs } from '@/components/PageIntro'
import { AddToCart } from '@/components/store/CartWidgets'
import { partImage } from '@/components/store/PartCard'
import { formatMoney, modelHref, telHref } from '@/lib/format'
import { getPartBySlug, getSiteSettings } from '@/lib/payload'
import type { Model } from '@/payload-types'

export async function generateMetadata(props: PageProps<'/parts/[slug]'>): Promise<Metadata> {
  const part = await getPartBySlug((await props.params).slug)
  if (!part) return {}
  return {
    title: `${part.name}${part.partNumber ? ` (${part.partNumber})` : ''}`,
    description: part.description ?? `Bad Boy part ${part.partNumber ?? part.name}.`,
  }
}

export default async function PartPage(props: PageProps<'/parts/[slug]'>) {
  const [part, settings] = await Promise.all([
    getPartBySlug((await props.params).slug),
    getSiteSettings(),
  ])
  if (!part) notFound()

  const img = partImage(part)
  const buyable = canBuyOnline(part)
  const msrp = part.msrp && part.price && part.msrp > part.price ? formatMoney(part.msrp) : null
  const models = (part.models ?? []).filter((m): m is Model => typeof m === 'object')
  const category = PART_CATEGORIES.find((c) => c.value === part.category)
  // Fitment notes that only repeat a linked model's name add nothing.
  const modelNames = new Set(models.map((m) => m.name.toLowerCase()))
  const fitNotes = (part.fits ?? []).filter((f) => !modelNames.has(f.text.trim().toLowerCase()))

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { href: '/', label: 'Home' },
          { href: '/parts', label: 'Parts' },
          { label: part.name },
        ]}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        {img?.url ? (
          <Image
            src={img.url}
            alt={img.alt}
            width={900}
            height={675}
            priority
            className="aspect-[4/3] w-full rounded-[var(--radius-plate)] object-cover"
          />
        ) : (
          <EquipmentArt
            kind="part"
            className="aspect-[4/3] rounded-[var(--radius-plate)]"
            label={part.name}
          />
        )}
        <div>
          {category ? <p className="font-medium text-steel">{category.label}</p> : null}
          <h1 className="type-decal-md mt-2 text-3xl text-ridge sm:text-4xl">{part.name}</h1>
          {part.partNumber ? (
            <p className="mt-2 text-steel">Part number {part.partNumber}</p>
          ) : null}
          <p className="mt-5 text-3xl font-bold text-ridge [font-variation-settings:'wdth'_110]">
            {formatMoney(part.price) ?? 'Call for price'}
            {msrp ? (
              <span className="ml-2 text-lg font-normal text-steel line-through">{msrp}</span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-steel">
            {part.availability === 'special-order'
              ? 'Special order: ships when it arrives from Bad Boy.'
              : part.availability === 'discontinued'
                ? 'Discontinued.'
                : 'In stock.'}
          </p>
          <div className="mt-6">
            {buyable ? (
              <AddToCart id={part.id} name={part.name} />
            ) : (
              <div className="rounded-[var(--radius-plate)] bg-fescue p-5">
                <p className="font-semibold">Call to order this part</p>
                <a
                  href={telHref(settings.phone)}
                  className="mt-1 inline-block text-xl font-bold text-ridge hover:underline"
                >
                  {settings.phone}
                </a>
              </div>
            )}
          </div>
          {part.description ? <p className="mt-8 text-lg">{part.description}</p> : null}
          {models.length || fitNotes.length ? (
            <section className="mt-8" aria-labelledby="fits">
              <h2 id="fits" className="type-decal-md text-xl text-ridge">
                Fits
              </h2>
              {models.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {models.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={modelHref(m)}
                        className="inline-block rounded-full border border-ridge/30 px-3 py-1 text-sm font-medium text-ridge hover:border-ridge"
                      >
                        Bad Boy {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {fitNotes.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-steel">
                  {fitNotes.map((f) => (
                    <li key={f.id ?? f.text}>{f.text}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-sm text-steel">
                Not sure it fits? Call with your model and serial number.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
