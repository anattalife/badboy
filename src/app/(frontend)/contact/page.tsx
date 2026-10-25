import type { Metadata } from 'next'

import { PageIntro } from '@/components/PageIntro'
import { fullAddress, telHref } from '@/lib/format'
import { getModelBySlug, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Call, visit or get directions to Roanoke Mowers on Melrose Ave NW in Roanoke, VA.',
}

export default async function ContactPage(props: PageProps<'/contact'>) {
  const { model: modelSlug } = await props.searchParams
  const [settings, model] = await Promise.all([
    getSiteSettings(),
    typeof modelSlug === 'string' ? getModelBySlug(modelSlug) : Promise.resolve(null),
  ])

  return (
    <>
      <PageIntro
        title={model ? `Get a quote on the ${model.name}` : 'Contact us'}
        lede="Call or stop by the shop. Online quote and contact forms are coming next."
        trail={[{ href: '/', label: 'Home' }, { label: 'Contact' }]}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="type-decal-md text-2xl text-ridge">Call us</h2>
          <a href={telHref(settings.phone)} className="mt-3 block text-3xl font-bold text-ink hover:underline">
            {settings.phone}
          </a>
          {model ? (
            <p className="mt-2 text-steel">Mention the Bad Boy {model.name} and we’ll have pricing ready.</p>
          ) : null}
          <h2 className="type-decal-md mt-10 text-2xl text-ridge">Visit</h2>
          <p className="mt-3 text-lg">{fullAddress(settings)}</p>
          {settings.address?.mapUrl ? (
            <a href={settings.address.mapUrl} className="btn btn-quiet mt-4 text-ridge">
              Get directions
            </a>
          ) : null}
        </div>
        <div>
          <h2 className="type-decal-md text-2xl text-ridge">Hours</h2>
          <dl className="mt-3 text-lg">
            {settings.hours?.map((row) => (
              <div key={row.id ?? row.days} className="flex justify-between border-b border-haze py-2.5">
                <dt>{row.days}</dt>
                <dd className="font-semibold">{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  )
}
