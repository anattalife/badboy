import type { Metadata } from 'next'
import React from 'react'

import { CompareTray } from '@/components/CompareControls'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { cityState, themeStyle } from '@/lib/format'
import { getCategories, getSiteSettings } from '@/lib/payload'

import './styles.css'

// Content comes from the CMS on every request for now. Edge caching is added in launch prep.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
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
        <Footer settings={settings} categories={categories} />
        <CompareTray />
      </body>
    </html>
  )
}
