import Image from 'next/image'
import Link from 'next/link'

import { formatPrice, kindForCategory } from '@/lib/format'
import type { Category, Inventory, Media } from '@/payload-types'

import { EquipmentArt } from './EquipmentArt'

export const unitHref = (unit: Inventory) => `/inventory/${unit.slug}`

export const unitPhoto = (unit: Inventory): Media | null => {
  const p = unit.photos?.[0]
  return p && typeof p === 'object' ? p : null
}

export const unitCategory = (unit: Inventory): Category | null =>
  typeof unit.category === 'object' ? unit.category : null

const CONDITION: Record<string, string> = { new: 'New', used: 'Used', demo: 'Demo' }
const STATUS_TAG: Record<string, string> = { 'on-order': 'On order', pending: 'Sale pending' }

export function PriceLine({ unit, size = 'md' }: { unit: Inventory; size?: 'md' | 'lg' }) {
  const price = formatPrice(unit.price)
  const msrp = unit.msrp && unit.price && unit.msrp > unit.price ? formatPrice(unit.msrp) : null
  return (
    <p className={`font-bold text-ridge [font-variation-settings:'wdth'_110] ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>
      {price ?? 'Call for price'}
      {msrp ? (
        <span className={`ml-2 font-normal text-steel line-through ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          <span className="sr-only">MSRP </span>
          {msrp}
        </span>
      ) : null}
    </p>
  )
}

export function UnitCard({ unit }: { unit: Inventory }) {
  const photo = unitPhoto(unit)
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
          <PriceLine unit={unit} />
        </div>
      </div>
    </article>
  )
}
