import type { Metadata } from 'next'

import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Parts' }

export default function Page() {
  return <ComingSoon title="Parts" lede="Genuine Bad Boy parts, blades, belts and filters." what="Online parts ordering" />
}
