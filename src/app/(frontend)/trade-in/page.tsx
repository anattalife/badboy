import type { Metadata } from 'next'

import { LeadForm } from '@/components/forms/LeadForm'
import { PageBlocks, pageMetadata, pageText } from '@/components/CmsPage'
import { PageIntro } from '@/components/PageIntro'
import { resolveInterest } from '@/lib/payload'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

export const generateMetadata = (): Promise<Metadata> => pageMetadata('trade-in')

export default async function TradeInPage(props: PageProps<'/trade-in'>) {
  const { page, title, intro } = await pageText('trade-in')
  const interest = await resolveInterest(await props.searchParams)
  return (
    <>
      <PageIntro
        title={title}
        lede={intro}
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
      <PageBlocks page={page} path="/trade-in" />
    </>
  )
}
