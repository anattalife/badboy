import Image from 'next/image'
import Link from 'next/link'

import { telHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { MobileNav } from './MobileNav'
import { CartLink } from './store/CartWidgets'

export type MenuItem = { href: string; label: string }

export function Header({ settings, menu }: { settings: SiteSetting; menu: MenuItem[] }) {
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 sm:px-6">
          <p>{settings.address?.city ? `${settings.address.city}, ${settings.address.state}` : settings.siteName}</p>
          {hoursSummary ? <p className="hidden md:block">{hoursSummary}</p> : null}
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <DealerLockup settings={settings} />
          <div className="flex items-center gap-3">
            <a
              href={telHref(settings.phone)}
              className="hidden text-right leading-tight xl:block"
            >
              <span className="block text-xs text-steel">Call us</span>
              <span className="text-lg font-bold text-ink hover:underline">{settings.phone}</span>
            </a>
            <Link href="/financing" className="btn btn-quiet hidden text-ridge lg:inline-flex">
              Apply for financing
            </Link>
            <Link href="/contact" className="btn btn-primary hidden sm:inline-flex">
              Get a quote
            </Link>
            <MobileNav items={[...menu, { href: '/cart', label: 'Cart' }]} phone={settings.phone} />
          </div>
        </div>
      </div>

      <div className="hidden bg-ridge lg:block">
        <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <ul className="flex items-center">
            {menu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 text-[0.95rem] font-semibold uppercase tracking-wide text-white hover:bg-white/10 [font-variation-settings:'wdth'_110]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="text-white [&_a]:text-white [&_a:hover]:bg-white/10">
            <CartLink />
          </div>
        </nav>
      </div>
    </header>
  )
}

/** The dealer's logo (or name) beside the Bad Boy logo: the standard authorized-dealer lockup. */
export function DealerLockup({ settings, reverse = false }: { settings: SiteSetting; reverse?: boolean }) {
  const logo = typeof settings.logo === 'object' ? settings.logo : null
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-5">
      <Link
        href="/"
        aria-label={`${settings.siteName} home`}
        className={`${logo?.url ? 'min-w-0 shrink' : 'shrink-0'} ${reverse && logo?.url ? 'rounded-[var(--radius-plate)] bg-white px-3 py-2' : ''}`}
      >
        {logo?.url ? (
          <Image
            src={logo.url}
            alt={settings.siteName}
            width={logo.width ?? 240}
            height={logo.height ?? 60}
            className="h-10 w-auto max-w-[44vw] object-contain sm:h-14 sm:max-w-64"
            priority
          />
        ) : (
          <span
            className={`type-decal block max-w-[7.5rem] text-[0.95rem] leading-tight sm:max-w-none sm:text-[1.7rem] sm:leading-none ${reverse ? 'text-white' : 'text-ridge'}`}
          >
            {settings.siteName}
          </span>
        )}
      </Link>
      <span className={`h-10 w-px shrink-0 sm:h-12 ${reverse ? 'bg-white/30' : 'bg-haze'}`} aria-hidden="true" />
      <div className="shrink-0">
        <Image
          src={reverse ? '/brand/bbm_logo_horizontal_reverse.webp' : '/brand/bbm_logo_horizontal.webp'}
          alt="Bad Boy Mowers"
          width={150}
          height={34}
          priority={!reverse}
          className="h-5 w-auto sm:h-8"
        />
        <p className={`mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.14em] ${reverse ? 'text-white/70' : 'text-steel'}`}>
          Authorized dealer
        </p>
      </div>
    </div>
  )
}
