import type { Metadata } from 'next'
import Link from 'next/link'

import { OfferCard } from '@/components/OfferCard'
import { PageIntro } from '@/components/PageIntro'
import { telHref } from '@/lib/format'
import { getCurrentOffers, getSiteSettings } from '@/lib/payload'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return {
    title: 'Current offers',
    description: `Current Bad Boy financing offers, rebates and sales at ${s.siteName}.`,
  }
}

export default async function OffersPage() {
  const [offers, settings] = await Promise.all([getCurrentOffers(), getSiteSettings()])
  return (
    <>
      <PageIntro
        title="Current offers"
        lede="Bad Boy financing programs, rebates and our own specials. Claim one and we’ll get back to you with the details."
        trail={[{ href: '/', label: 'Home' }, { label: 'Offers' }]}
      />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        {offers.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-plate)] bg-fescue p-8">
            <p className="text-lg font-semibold">No offers posted right now.</p>
            <p className="mt-2 text-steel">
              Ask us about current Bad Boy financing and specials: call{' '}
              <a href={telHref(settings.phone)} className="font-semibold text-ridge underline">
                {settings.phone}
              </a>{' '}
              or{' '}
              <Link href="/contact" className="font-semibold text-ridge underline">
                send us a note
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </>
  )
}
