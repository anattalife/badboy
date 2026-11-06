import type { Metadata } from 'next'
import React from 'react'

import '../(frontend)/styles.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Set up your Bad Boy dealer website',
  robots: { index: false, follow: false },
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper">{children}</body>
    </html>
  )
}
