import Link from 'next/link'

import { telHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { MobileNav } from './MobileNav'

export const NAV = [
  { href: '/equipment', label: 'Equipment' },
  { href: '/compare', label: 'Compare' },
  { href: '/financing', label: 'Financing' },
  { href: '/parts', label: 'Parts' },
  { href: '/service', label: 'Service' },
  { href: '/contact', label: 'Contact' },
]

export function Header({ settings }: { settings: SiteSetting }) {
  const hoursSummary = (settings.hours ?? [])
    .filter((row) => !/closed/i.test(row.hours))
    .map((row) => `${row.days} ${row.hours}`)
    .join(' · ')
  return (
    <header>
      {settings.announcement ? (
        <div className="bg-signal px-4 py-2 text-center text-sm font-semibold text-white">
          {settings.announcement}
        </div>
      ) : null}

      <div className="bg-ridge-deep text-sm text-haze">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
          <p>
            Authorized Bad Boy dealer · {settings.address?.city}, {settings.address?.state}
          </p>
          <div className="flex items-center gap-5">
            {hoursSummary ? <span className="hidden md:inline">{hoursSummary}</span> : null}
            <a href={telHref(settings.phone)} className="font-semibold text-white hover:underline">
              {settings.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-haze bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-baseline gap-2" aria-label={`${settings.siteName} home`}>
            <span className="type-decal text-2xl text-ridge sm:text-[1.7rem]">Roanoke Mowers</span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 font-medium text-ink hover:bg-fescue"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/contact" className="btn btn-primary hidden sm:inline-flex">
              Get a quote
            </Link>
            <MobileNav items={NAV} phone={settings.phone} />
          </div>
        </div>
      </div>
    </header>
  )
}
