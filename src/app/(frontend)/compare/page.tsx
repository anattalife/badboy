import type { Metadata } from 'next'

import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Compare equipment' }

export default function Page() {
  return <ComingSoon title="Compare equipment" lede="Line up Bad Boy models side by side and see how the specs stack up." what="Side-by-side comparison" />
}
