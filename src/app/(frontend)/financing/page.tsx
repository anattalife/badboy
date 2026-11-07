import type { Metadata } from 'next'

import { CreditApplicationForm } from '@/components/forms/CreditApplicationForm'
import { PageBlocks, pageMetadata, pageText } from '@/components/CmsPage'
import { PageIntro } from '@/components/PageIntro'
import { financeOptions } from '@/lib/financing'
import { telHref } from '@/lib/format'
import { getSiteSettings, resolveInterest } from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

import { consentText } from './consent'

export const generateMetadata = (): Promise<Metadata> => pageMetadata('financing')

export default async function FinancingPage(props: PageProps<'/financing'>) {
  const { page, title, intro } = await pageText('financing')
  const [settings, interest] = await Promise.all([getSiteSettings(), resolveInterest(await props.searchParams)])
  const { links, showForm } = financeOptions(settings)

  return (
    <>
      <PageIntro
        title={title}
        lede={
          showForm
            ? intro
            : 'Apply online with our lender. It only takes a few minutes, and our team will follow up with you.'
        }
        trail={[{ href: '/', label: 'Home' }, { label: 'Financing' }]}
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-10">
          {links.length ? (
            <section aria-labelledby="lenders" className="rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-8">
              <h2 id="lenders" className="type-decal-md text-2xl text-ridge">
                {showForm ? 'Apply with one of our lenders' : 'Apply online'}
              </h2>
              {interest.subject ? (
                <p className="mt-2 text-steel">
                  For: <strong className="text-ink">{interest.subject}</strong>
                </p>
              ) : null}
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {links.map((l) => (
                  <li key={l.id ?? l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full justify-center">
                      {l.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    {l.note ? <p className="mt-2 text-sm text-steel">{l.note}</p> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-steel">
                These open our lender’s secure site in a new tab. Let us know which machine you’re interested in when you
                apply.
              </p>
            </section>
          ) : null}
          {showForm ? (
            <section aria-label="Our credit application">
              {links.length ? (
                <h2 className="type-decal-md mb-5 text-2xl text-ridge">Or apply with us</h2>
              ) : null}
              <CreditApplicationForm
                modelSlug={interest.modelSlug}
                stockNumber={interest.stockNumber}
                subject={interest.subject}
                suggestedPrice={interest.price}
                consentText={consentText(settings.legalName ?? settings.siteName)}
                siteKey={turnstileSiteKey()}
                renderedAt={formRenderedAt()}
              />
            </section>
          ) : null}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[var(--radius-plate)] bg-fescue p-6" hidden={!showForm}>
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
      <PageBlocks page={page} path="/financing" />
    </>
  )
}
