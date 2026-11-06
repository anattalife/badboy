import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { CompareTray } from '@/components/CompareControls'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileActions } from '@/components/MobileActions'
import { PaymentDisclaimer } from '@/components/Price'
import { cityState, themeStyle } from '@/lib/format'
import { getCategories, getSiteSettings } from '@/lib/payload'
import { isSetupComplete } from '@/lib/setup'

import './styles.css'

// Content comes from the CMS on every request for now. Edge caching is added in launch prep.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  if (!(await isSetupComplete())) return { title: 'Set up your website' }
  const settings = await getSiteSettings()
  const place = cityState(settings)
  const siteUrl = settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL
  return {
    ...(siteUrl && URL.canParse(siteUrl) ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: `${settings.siteName} · Bad Boy mowers, tractors & UTVs${place ? ` in ${place}` : ''}`,
      template: `%s · ${settings.siteName}`,
    },
    description: `Authorized Bad Boy dealer${place ? ` in ${place}` : ''}. Zero-turn and stand-on mowers, compact tractors, UTVs and light construction equipment, with financing, parts and service.`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A fresh install shows the setup wizard until the dealer has filled in their details.
  if (!(await isSetupComplete())) redirect('/setup')
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()])
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col" style={themeStyle(settings)}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Header settings={settings} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <PaymentDisclaimer />
        <Footer settings={settings} categories={categories} />
        <CompareTray />
        <MobileActions phone={settings.phone} />
      </body>
    </html>
  )
}
