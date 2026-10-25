import type { Metadata } from 'next'

import { PageIntro } from '@/components/PageIntro'
import { CheckoutForm } from '@/components/store/CheckoutForm'
import { formRenderedAt, turnstileSiteKey } from '@/lib/spam'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  return (
    <>
      <PageIntro title="Checkout" trail={[{ href: '/', label: 'Home' }, { href: '/cart', label: 'Cart' }, { label: 'Checkout' }]} />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <CheckoutForm siteKey={turnstileSiteKey()} renderedAt={formRenderedAt()} />
      </div>
    </>
  )
}
