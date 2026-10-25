'use client'

import Link from 'next/link'
import { useId, useState } from 'react'

import { telHref } from '@/lib/format'

export function MobileNav({
  items,
  phone,
}: {
  items: { href: string; label: string }[]
  phone: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const close = () => setOpen(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="btn btn-quiet text-ridge"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open ? (
        <div id={panelId} className="absolute inset-x-0 z-40 mt-4 border-b border-haze bg-paper shadow-lg">
          <ul className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="block border-b border-fescue py-3 text-lg font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="flex gap-3 py-4">
              <Link href="/contact" onClick={close} className="btn btn-primary flex-1">
                Get a quote
              </Link>
              <a href={telHref(phone)} className="btn btn-quiet flex-1 text-ridge">
                Call {phone}
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
