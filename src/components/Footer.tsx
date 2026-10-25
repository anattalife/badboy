import Link from 'next/link'

import { fullAddress, telHref } from '@/lib/format'
import type { Category, SiteSetting } from '@/payload-types'

export function Footer({ settings, categories }: { settings: SiteSetting; categories: Category[] }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 bg-ridge-deep text-haze">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="type-decal text-2xl text-white">Roanoke Mowers</p>
          <p className="mt-3 max-w-sm">
            Bad Boy mowers, tractors, UTVs and equipment, sold and serviced by {settings.legalName}.
          </p>
          <address className="mt-6 not-italic leading-relaxed">
            {fullAddress(settings)}
            <br />
            <a href={telHref(settings.phone)} className="font-semibold text-white hover:underline">
              {settings.phone}
            </a>
          </address>
          {settings.address?.mapUrl ? (
            <a href={settings.address.mapUrl} className="mt-3 inline-block underline hover:text-white">
              Get directions
            </a>
          ) : null}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/financing" className="underline hover:text-white">
                Apply for financing
              </Link>
            </li>
            <li>
              <Link href="/trade-in" className="underline hover:text-white">
                Value your trade
              </Link>
            </li>
            <li>
              <Link href="/contact" className="underline hover:text-white">
                Contact us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-white">Equipment</h2>
          <ul className="mt-3 space-y-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/equipment/${c.slug}`} className="hover:text-white hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-white">Hours</h2>
          <dl className="mt-3 space-y-2">
            {settings.hours?.map((row) => (
              <div key={row.id ?? row.days} className="flex justify-between gap-4">
                <dt>{row.days}</dt>
                <dd className="text-white">{row.hours}</dd>
              </div>
            ))}
          </dl>
          {settings.serviceArea ? (
            <>
              <h2 className="mt-8 font-semibold text-white">Serving</h2>
              <p className="mt-2">{settings.serviceArea}</p>
            </>
          ) : null}
          {settings.facebookUrl ? (
            <a href={settings.facebookUrl} className="mt-6 inline-block underline hover:text-white">
              Follow us on Facebook
            </a>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-steel-light sm:px-6">
          © {year} {settings.legalName}. Bad Boy is a trademark of Bad Boy Mowers. Specifications and
          availability can change; confirm details with our sales team.
        </p>
      </div>
    </footer>
  )
}
