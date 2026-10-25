import type { Metadata } from 'next'

import { PageIntro } from '@/components/PageIntro'
import { CartView } from '@/components/store/CartView'
import { getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Your cart', robots: { index: false } }

export default async function CartPage() {
  const settings = await getSiteSettings()
  return (
    <>
      <PageIntro title="Your cart" trail={[{ href: '/', label: 'Home' }, { href: '/parts', label: 'Parts' }, { label: 'Cart' }]} />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <CartView phone={settings.phone} />
      </div>
    </>
  )
}
