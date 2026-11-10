import { APIError, type CollectionConfig } from 'payload'

import { isContentManager, publishedOrStaff } from '../access/roles'
import { PAGE_BLOCKS } from '../blocks/config'
import { slugify } from '../fields/slug'

/**
 * Pages that come with the site. Their address is fixed and they can't be deleted, but everything
 * on them is editable. The home page is built entirely from blocks; on the others the blocks appear
 * below the page's own working part (the listing, form or store).
 */
export const BUILT_IN_PAGES: Record<string, string> = {
  home: '/',
  equipment: '/equipment',
  inventory: '/inventory',
  offers: '/offers',
  compare: '/compare',
  contact: '/contact',
  'trade-in': '/trade-in',
  financing: '/financing',
  parts: '/parts',
  service: '/service',
}

/** Addresses used by the site itself, so a new page can't take them. */
const RESERVED = new Set([
  ...Object.keys(BUILT_IN_PAGES),
  'admin', 'api', 'setup', 'preview', 'cart', 'checkout', 'order', 'brand', 'media', '_next', 'webhooks',
])

export const pagePath = (slug?: string | null) => (slug ? (BUILT_IN_PAGES[slug] ?? `/${slug}`) : '/')

const siteUrl = () => process.env.SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL || ''

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Every page on the website. Edit the text and blocks, then Publish. Use Preview to see changes before they go live.',
    livePreview: {
      url: ({ data }) => `${siteUrl()}/preview?path=${encodeURIComponent(pagePath(data?.slug as string))}`,
    },
    preview: (data) => `${siteUrl()}/preview?path=${encodeURIComponent(pagePath(data?.slug as string))}`,
  },
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 25 },
  access: {
    read: publishedOrStaff,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, operation }) => {
        if (!data) return data
        const original = originalDoc?.slug as string | undefined
        // Built-in pages keep their address.
        if (original && BUILT_IN_PAGES[original]) {
          data.slug = original
          return data
        }
        const slug = slugify(String(data.slug || data.title || ''))
        // Built-in page addresses can only be taken by the built-in page itself (created by the
        // seed); the unique index stops a second one.
        if (slug && RESERVED.has(slug) && slug !== original && !(BUILT_IN_PAGES[slug] && operation === 'create')) {
          throw new APIError(`The address “/${slug}” is used by the website. Pick another.`, 400, null, true)
        }
        // New drafts have no title yet; leave the address empty (null) rather than "" so they don't clash.
        data.slug = slug || null
        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        // Server code (tests cleaning up after themselves) can pass this; the REST API can't set context.
        if (req.context?.allowBuiltInDelete === true) return
        const page = await req.payload.findByID({ collection: 'pages', id, depth: 0, req, draft: true })
        if (page?.slug && BUILT_IN_PAGES[page.slug]) {
          throw new APIError('This page is part of the website and can’t be deleted. You can edit it instead.', 400, null, true)
        }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'The page heading.' } },
    {
      name: 'slug',
      label: 'Page address',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'The part after the domain, e.g. “about-us” for /about-us. Fixed for the website’s built-in pages.',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'One or two sentences under the heading. Not used when the page starts with a hero banner.' },
    },
    {
      name: 'layout',
      label: 'Page content',
      type: 'blocks',
      labels: { singular: 'Section', plural: 'Sections' },
      blocks: PAGE_BLOCKS,
      admin: {
        description:
          'Add, reorder and edit sections. On built-in pages like Financing or In stock, these appear below the page’s form or listing.',
      },
    },
    {
      name: 'seo',
      label: 'Search engines',
      type: 'group',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'title', type: 'text', admin: { description: 'Blank: the page heading.' } },
        { name: 'description', type: 'textarea', admin: { description: 'Blank: the intro.' } },
      ],
    },
  ],
}
