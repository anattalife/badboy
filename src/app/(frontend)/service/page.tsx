import type { Metadata } from 'next'

import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Service' }

export default function Page() {
  return <ComingSoon title="Service" lede="Maintenance, repairs and warranty work for Bad Boy equipment." what="Online service requests" />
}
