import type { Metadata } from 'next'

import { CreditApplicationForm } from '@/components/forms/CreditApplicationForm'
import { PageIntro } from '@/components/PageIntro'
import { telHref } from '@/lib/format'
import { getSiteSettings, resolveInterest } from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

import { CONSENT_TEXT } from './consent'

export const metadata: Metadata = {
  title: 'Apply for financing',
  description: 'Apply online for financing on Bad Boy mowers, tractors, UTVs and equipment in Roanoke, VA.',
}

export default async function FinancingPage(props: PageProps<'/financing'>) {
  const [settings, interest] = await Promise.all([getSiteSettings(), resolveInterest(await props.searchParams)])

  return (
    <>
      <PageIntro
        title="Apply for financing"
        lede="Fill this out once and our finance team will work with our lenders to find you options. It takes about 10 minutes."
        trail={[{ href: '/', label: 'Home' }, { label: 'Financing' }]}
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <CreditApplicationForm
          modelSlug={interest.modelSlug}
          stockNumber={interest.stockNumber}
          subject={interest.subject}
          suggestedPrice={interest.price}
          consentText={CONSENT_TEXT}
          siteKey={turnstileSiteKey()}
          renderedAt={formRenderedAt()}
        />
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[var(--radius-plate)] bg-fescue p-6">
            <h2 className="font-bold text-ink [font-variation-settings:'wdth'_110]">How your information is protected</h2>
            <ul className="mt-3 space-y-2 text-sm text-steel">
              <li>Sent over an encrypted connection.</li>
              <li>Your SSN, date of birth and income are encrypted before they’re stored.</li>
              <li>Only our finance team can open your application, and every view is recorded.</li>
              <li>We never send your application details by email.</li>
            </ul>
          </div>
          <div className="rounded-[var(--radius-plate)] border border-haze p-6">
            <h2 className="font-bold text-ink [font-variation-settings:'wdth'_110]">Rather apply by phone?</h2>
            <a href={telHref(settings.phone)} className="mt-2 block text-xl font-bold text-ridge hover:underline">
              {settings.phone}
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
