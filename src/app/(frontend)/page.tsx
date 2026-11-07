import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { DEFAULT_PAGES, resolveDefaultLayout } from '@/blocks/defaults'
import { getAllModels, getPage } from '@/lib/payload'
import type { Page } from '@/payload-types'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home')
  return page?.seo?.title || page?.seo?.description
    ? { title: page.seo.title ? { absolute: page.seo.title } : undefined, description: page.seo.description }
    : {}
}

/** The home page is built from blocks in Admin → Content → Pages → Home. */
export default async function HomePage() {
  const page = await getPage('home')
  let layout = page?.layout
  if (!page) {
    // Not created yet (before the catalog is loaded): show the starting layout.
    const models = await getAllModels()
    const ids = new Map(models.map((m) => [m.slug ?? '', m.id]))
    layout = resolveDefaultLayout(DEFAULT_PAGES.find((p) => p.slug === 'home')!.layout, ids) as Page['layout']
  }
  return <RenderBlocks blocks={layout} path="/" startsPage />
}
