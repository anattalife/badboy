import type { Metadata } from 'next'

import { LeadForm } from '@/components/forms/LeadForm'
import { PageIntro } from '@/components/PageIntro'
import { resolveInterest } from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

export const metadata: Metadata = {
  title: 'Value your trade',
  description: 'Tell us about your mower, tractor or UTV and get a trade-in value from Roanoke Mowers.',
}

export default async function TradeInPage(props: PageProps<'/trade-in'>) {
  const interest = await resolveInterest(await props.searchParams)
  return (
    <>
      <PageIntro
        title="Value your trade"
        lede="Tell us about the machine you’re trading in and we’ll get back to you with a value."
        trail={[{ href: '/', label: 'Home' }, { label: 'Value your trade' }]}
      />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-8">
          <LeadForm
            type="trade-in"
            modelSlug={interest.modelSlug}
            stockNumber={interest.stockNumber}
            subject={interest.subject ? `Trading toward the ${interest.subject}` : null}
            page="/trade-in"
            siteKey={turnstileSiteKey()}
            renderedAt={formRenderedAt()}
          />
        </div>
      </div>
    </>
  )
}
