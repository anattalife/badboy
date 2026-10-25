import type { Metadata } from 'next'

import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Financing' }

export default function Page() {
  return <ComingSoon title="Financing" lede="Apply for financing on new Bad Boy equipment from home." what="Our online credit application" />
}
