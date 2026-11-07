import type { Metadata } from 'next'

import { DEFAULT_PAGES } from '@/blocks/defaults'
import { BlockPage, pageMetadata } from '@/components/CmsPage'
import { getPage } from '@/lib/payload'
import type { Page } from '@/payload-types'

export const generateMetadata = (): Promise<Metadata> => pageMetadata('service')

/** Built from blocks in Admin → Content → Pages → Service. */
export default async function ServicePage() {
  const page = (await getPage('service')) ?? ({ ...DEFAULT_PAGES.find((p) => p.slug === 'service')!, id: 0 } as unknown as Page)
  return <BlockPage page={page} path="/service" />
}
