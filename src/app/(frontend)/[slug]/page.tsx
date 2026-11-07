import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BUILT_IN_PAGES } from '@/collections/Pages'
import { BlockPage } from '@/components/CmsPage'
import { getPage } from '@/lib/payload'

/** Pages staff add in Admin → Content → Pages (About us, Rentals, …). */
async function load(slug: string) {
  if (BUILT_IN_PAGES[slug]) return null // those have their own routes
  return getPage(slug)
}

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const page = await load((await props.params).slug)
  if (!page) return {}
  return { title: page.seo?.title || page.title, description: page.seo?.description || page.intro || undefined }
}

export default async function CustomPage(props: PageProps<'/[slug]'>) {
  const slug = (await props.params).slug
  const page = await load(slug)
  if (!page) notFound()
  return <BlockPage page={page} path={`/${slug}`} />
}
