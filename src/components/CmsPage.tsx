import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { DEFAULT_PAGES } from '@/blocks/defaults'
import { cityState } from '@/lib/format'
import { getPage, getSiteSettings } from '@/lib/payload'
import type { Page } from '@/payload-types'

import { PageIntro } from './PageIntro'

/** Title and intro for a built-in page: from the editable page, else the starting text. */
export async function pageText(slug: string) {
  const page = await getPage(slug)
  const fallback = DEFAULT_PAGES.find((p) => p.slug === slug)
  return {
    page,
    title: page?.title ?? fallback?.title ?? '',
    intro: page?.intro ?? fallback?.intro ?? null,
  }
}

export async function pageMetadata(slug: string): Promise<Metadata> {
  const [{ page, title, intro }, settings] = await Promise.all([pageText(slug), getSiteSettings()])
  // Without a custom description, the intro plus who and where (helps local search).
  const where = [settings.siteName, cityState(settings)].filter(Boolean).join(', ')
  return {
    title: page?.seo?.title || title,
    description: page?.seo?.description || [intro, where].filter(Boolean).join(' · '),
  }
}

/** The editable sections of a built-in page, shown after its form or listing. */
export function PageBlocks({ page, path }: { page: Page | null; path: string }) {
  return page?.layout?.length ? (
    <div className="pt-4">
      <RenderBlocks blocks={page.layout} path={path} />
    </div>
  ) : null
}

/** A page made entirely of blocks (home, service, and pages staff add). */
export function BlockPage({ page, path }: { page: Page; path: string }) {
  const startsWithHero = page.layout?.[0]?.blockType === 'hero'
  return (
    <>
      {startsWithHero ? null : (
        <PageIntro title={page.title} lede={page.intro} trail={[{ href: '/', label: 'Home' }, { label: page.title }]} />
      )}
      <RenderBlocks blocks={page.layout} path={path} startsPage={startsWithHero} />
    </>
  )
}
