import Image from 'next/image'
import Link from 'next/link'

import type { Offer } from '@/payload-types'

const KIND: Record<string, string> = { financing: 'Financing offer', rebate: 'Rebate', sale: 'Sale', other: 'Offer' }

const ends = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null

export function OfferCard({ offer, compact = false }: { offer: Offer; compact?: boolean }) {
  const img = typeof offer.image === 'object' && offer.image?.url ? offer.image : null
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white">
      {img && !compact ? (
        <Image src={img.url!} alt={img.alt} width={img.width ?? 800} height={img.height ?? 450} className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="h-1.5 bg-signal" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-signal-deep">{KIND[offer.kind] ?? 'Offer'}</p>
        <h3 className="type-decal-md mt-1 text-xl text-ink">{offer.title}</h3>
        <p className="mt-2 text-steel">{offer.summary}</p>
        {offer.endsAt ? <p className="mt-2 text-sm font-semibold">Ends {ends(offer.endsAt)}</p> : null}
        <div className="mt-auto pt-4">
          <Link href={`/contact?offer=${encodeURIComponent(offer.slug ?? '')}`} className="btn btn-primary">
            Claim this offer
          </Link>
        </div>
        {offer.disclaimer && !compact ? <p className="mt-4 text-xs text-steel">{offer.disclaimer}</p> : null}
      </div>
    </article>
  )
}
