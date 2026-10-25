import type { Metadata } from 'next'
import Link from 'next/link'

import { LeadForm } from '@/components/forms/LeadForm'
import { PageIntro } from '@/components/PageIntro'
import { fullAddress, telHref } from '@/lib/format'
import { getSiteSettings, resolveInterest } from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Get a quote, ask a question, or get directions to Roanoke Mowers on Melrose Ave NW in Roanoke, VA.',
}

export default async function ContactPage(props: PageProps<'/contact'>) {
  const [settings, interest] = await Promise.all([getSiteSettings(), resolveInterest(await props.searchParams)])
  const isQuote = Boolean(interest.subject)

  return (
    <>
      <PageIntro
        title={isQuote ? 'Get a quote' : 'Contact us'}
        lede={
          isQuote
            ? 'Tell us how to reach you and we’ll send pricing and availability.'
            : 'Questions about equipment, financing, parts or service? Send us a note or give us a call.'
        }
        trail={[{ href: '/', label: 'Home' }, { label: isQuote ? 'Get a quote' : 'Contact' }]}
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-8">
          <LeadForm
            type={isQuote ? 'quote' : 'contact'}
            modelSlug={interest.modelSlug}
            stockNumber={interest.stockNumber}
            subject={interest.subject}
            page={isQuote ? `/contact (quote: ${interest.subject})` : '/contact'}
            siteKey={turnstileSiteKey()}
            renderedAt={formRenderedAt()}
          />
        </div>
        <aside className="space-y-8">
          <div>
            <h2 className="type-decal-md text-xl text-ridge">Call us</h2>
            <a href={telHref(settings.phone)} className="mt-2 block text-2xl font-bold text-ink hover:underline">
              {settings.phone}
            </a>
          </div>
          <div>
            <h2 className="type-decal-md text-xl text-ridge">Visit</h2>
            <p className="mt-2">{fullAddress(settings)}</p>
            {settings.address?.mapUrl ? (
              <a href={settings.address.mapUrl} className="mt-2 inline-block font-semibold text-ridge underline">
                Get directions
              </a>
            ) : null}
          </div>
          <div>
            <h2 className="type-decal-md text-xl text-ridge">Hours</h2>
            <dl className="mt-2">
              {settings.hours?.map((row) => (
                <div key={row.id ?? row.days} className="flex justify-between border-b border-haze py-2">
                  <dt>{row.days}</dt>
                  <dd className="font-semibold">{row.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-[var(--radius-plate)] bg-fescue p-5">
            <p className="font-semibold">Trading in your old mower?</p>
            <Link href="/trade-in" className="mt-1 inline-block font-semibold text-ridge underline">
              Get a trade-in value
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}
