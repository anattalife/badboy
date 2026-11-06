import Image from 'next/image'
import Link from 'next/link'

import { kindForCategory } from '@/lib/format'
import type { Category, Inventory, Media } from '@/payload-types'

import { EquipmentArt } from './EquipmentArt'
import { Price } from './Price'

export const unitHref = (unit: Inventory) => `/inventory/${unit.slug}`

export const unitPhoto = (unit: Inventory): Media | null => {
  const p = unit.photos?.[0]
  return p && typeof p === 'object' ? p : null
}

/** The model's factory photo, used when a unit has no photos of its own yet. */
export const unitFactoryPhoto = (unit: Inventory): Media | null => {
  const model = typeof unit.model === 'object' ? unit.model : null
  const img = model?.images?.[0]
  return img && typeof img === 'object' && img.url ? img : null
}

export const unitCategory = (unit: Inventory): Category | null =>
  typeof unit.category === 'object' ? unit.category : null

const CONDITION: Record<string, string> = { new: 'New', used: 'Used', demo: 'Demo' }
const STATUS_TAG: Record<string, string> = { 'on-order': 'On order', pending: 'Sale pending' }

export function UnitCard({ unit }: { unit: Inventory }) {
  const photo = unitPhoto(unit)
  const factory = photo ? null : unitFactoryPhoto(unit)
  const category = unitCategory(unit)
  const tag = STATUS_TAG[unit.status]

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white">
      <div className="relative">
        {photo?.url ? (
          <Image
            src={photo.url}
            alt={photo.alt}
            width={photo.width ?? 960}
            height={photo.height ?? 560}
            className="aspect-[12/7] w-full object-cover"
          />
        ) : factory?.url ? (
          <Image
            src={factory.url}
            alt={factory.alt}
            width={factory.width ?? 960}
            height={factory.height ?? 560}
            className="aspect-[12/7] w-full object-contain p-3"
          />
        ) : (
          <EquipmentArt kind={kindForCategory(category?.slug)} className="aspect-[12/7]" label={unit.title ?? ''} />
        )}
        <span className="absolute left-2.5 top-2 rounded bg-ridge px-2 py-0.5 text-xs font-semibold text-white">
          {CONDITION[unit.condition] ?? unit.condition}
        </span>
        {tag ? (
          <span className="absolute bottom-2 left-2.5 rounded bg-signal px-2 py-0.5 text-xs font-semibold text-white">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold leading-snug text-ink [font-variation-settings:'wdth'_110]">
          <Link href={unitHref(unit)} className="after:absolute after:inset-0">
            {unit.title}
          </Link>
        </h3>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel">
          <div className="flex gap-1">
            <dt>Stock</dt>
            <dd className="font-medium text-ink">{unit.stockNumber}</dd>
          </div>
          {unit.hours != null ? (
            <div className="flex gap-1">
              <dt>Hours</dt>
              <dd className="font-medium text-ink">{unit.hours.toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-auto pt-4">
          <Price unit={unit} quoteHref={`/contact?unit=${encodeURIComponent(unit.stockNumber)}`} size="sm" inCard />
        </div>
      </div>
    </article>
  )
}
