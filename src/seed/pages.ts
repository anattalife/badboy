import type { Payload } from 'payload'

import { DEFAULT_PAGES, resolveDefaultLayout } from '../blocks/defaults'
import { DEFAULT_FOOTER_LINKS, DEFAULT_MAIN_MENU } from '../globals/Navigation'

/**
 * Creates the website's starting pages and menus. Only adds what's missing: a page or menu the
 * dealer has edited is never touched. Runs on every install (demo and live).
 */
export async function seedPages(payload: Payload): Promise<{ created: string[] }> {
  const models = await payload.find({ collection: 'models', limit: 500, depth: 0, draft: true, select: { slug: true } })
  const ids = new Map(models.docs.map((m) => [m.slug ?? '', m.id]))
  const created: string[] = []

  for (const page of DEFAULT_PAGES) {
    const existing = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0, draft: true })
    if (existing.docs[0]) continue
    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        intro: page.intro,
        layout: resolveDefaultLayout(page.layout, ids) as never,
        _status: 'published',
      },
    })
    created.push(page.slug)
  }

  const nav = await payload.findGlobal({ slug: 'navigation', depth: 0 })
  if (!nav.mainMenu?.length && !nav.footerLinks?.length) {
    await payload.updateGlobal({
      slug: 'navigation',
      data: { mainMenu: DEFAULT_MAIN_MENU, footerLinks: DEFAULT_FOOTER_LINKS },
    })
    created.push('menus')
  }
  return { created }
}
