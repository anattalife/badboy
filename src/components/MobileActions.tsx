import Link from 'next/link'

import { telHref } from '@/lib/format'

/** Always-visible Call / Quote / Apply bar on phones, where most leads start. */
export function MobileActions({ phone }: { phone: string }) {
  const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold'
  return (
    <>
      <div className="h-14 lg:hidden" aria-hidden="true" />
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-black/20 bg-ridge text-white lg:hidden"
      >
        <a href={telHref(phone)} className={item}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
          </svg>
          Call
        </a>
        <Link href="/contact" className={`${item} bg-signal`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.5l8 5 8-5V6zm16 2.85-8 5-8-5V18h16z" />
          </svg>
          Get a quote
        </Link>
        <Link href="/financing" className={item}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M3 6h18v12H3zm2 2v2h14V8zm0 5v3h6v-3z" />
          </svg>
          Apply
        </Link>
      </nav>
    </>
  )
}
