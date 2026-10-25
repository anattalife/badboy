import Image from 'next/image'
import Link from 'next/link'

import { canBuyOnline } from '@/collections/Parts'
import { formatMoney } from '@/lib/format'
import type { Media, Part } from '@/payload-types'

import { EquipmentArt } from '../EquipmentArt'
import { AddToCart } from './CartWidgets'

export const partImage = (p: Part): Media | null => {
  const img = p.images?.[0]
  return img && typeof img === 'object' ? img : null
}

export function PartCard({ part }: { part: Part }) {
  const img = partImage(part)
  const buyable = canBuyOnline(part)
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white">
      {img?.url ? (
        <Image src={img.url} alt={img.alt} width={480} height={360} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <EquipmentArt kind="part" className="aspect-[4/3]" notice={false} />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold leading-snug text-ink [font-variation-settings:'wdth'_108]">
          <Link href={`/parts/${part.slug}`} className="after:absolute after:inset-0">
            {part.name}
          </Link>
        </h3>
        {part.partNumber ? <p className="mt-1 text-sm text-steel">Part {part.partNumber}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="font-bold text-ridge">{formatMoney(part.price) ?? 'Call for price'}</p>
          {buyable ? (
            <AddToCart id={part.id} name={part.name} compact />
          ) : (
            <span className="text-sm font-medium text-steel">Call to order</span>
          )}
        </div>
      </div>
    </article>
  )
}
