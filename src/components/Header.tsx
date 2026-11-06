import Image from 'next/image'
import Link from 'next/link'

import { telHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { MobileNav } from './MobileNav'
import { CartLink } from './store/CartWidgets'

export const NAV = [
  { href: '/equipment', label: 'Equipment' },
  { href: '/inventory', label: 'In stock' },
  { href: '/compare', label: 'Compare' },
  { href: '/financing', label: 'Financing' },
  { href: '/parts', label: 'Parts' },
  { href: '/service', label: 'Service' },
  { href: '/contact', label: 'Contact' },
]

export function Header({ settings }: { settings: SiteSetting }) {
  const logo = typeof settings.logo === 'object' ? settings.logo : null
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
          <p className="flex items-center gap-2.5">
            <Image
              src="/brand/bbm_logo_horizontal_reverse.webp"
              alt="Bad Boy Mowers"
              width={96}
              height={22}
              className="h-[22px] w-auto"
            />
            <span>
              Authorized dealer
              {settings.address?.city ? ` · ${settings.address.city}, ${settings.address.state}` : ''}
            </span>
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
            {logo?.url ? (
              <Image src={logo.url} alt={settings.siteName} width={logo.width ?? 240} height={logo.height ?? 60} className="h-10 w-auto sm:h-12" priority />
            ) : (
              <span className="type-decal text-2xl text-ridge sm:text-[1.7rem]">{settings.siteName}</span>
            )}
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
            <CartLink />
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
