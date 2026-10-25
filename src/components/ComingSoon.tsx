import Link from 'next/link'

import { telHref } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'

import { PageIntro } from './PageIntro'

/** Temporary page for sections still being built. */
export async function ComingSoon({ title, lede, what }: { title: string; lede: string; what: string }) {
  const settings = await getSiteSettings()
  return (
    <>
      <PageIntro title={title} lede={lede} trail={[{ href: '/', label: 'Home' }, { label: title }]} />
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="max-w-2xl rounded-[var(--radius-plate)] border border-haze bg-white p-8">
          <p className="text-lg">{what} is on its way to this page. Until then, give us a call and we’ll take care of you.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={telHref(settings.phone)} className="btn btn-primary">
              Call {settings.phone}
            </a>
            <Link href="/equipment" className="btn btn-quiet text-ridge">
              Browse equipment
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
