import type { CollectionConfig } from 'payload'

import { isContentManager, publishedOrStaff } from '../access/roles'
import { slugField } from '../fields/slug'

export const OFFER_KINDS = [
  { label: 'Financing', value: 'financing' },
  { label: 'Rebate or discount', value: 'rebate' },
  { label: 'Sale', value: 'sale' },
  { label: 'Other', value: 'other' },
]

/**
 * Current promotions (Bad Boy factory programs or the dealer's own). Shown on /offers, the home page
 * and the pages of the models they apply to while between their start and end dates.
 */
export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Offer', plural: 'Offers' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'endsAt', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 10 },
  defaultSort: 'endsAt',
  access: {
    read: publishedOrStaff,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. “0% for 48 months on Rogue”' } },
    slugField('title'),
    {
      type: 'row',
      fields: [
        { name: 'kind', type: 'select', required: true, defaultValue: 'financing', options: OFFER_KINDS },
        { name: 'startsAt', label: 'Starts', type: 'date', admin: { description: 'Blank: starts now.' } },
        { name: 'endsAt', label: 'Ends', type: 'date', admin: { description: 'Blank: no end date.' } },
      ],
    },
    { name: 'summary', type: 'textarea', required: true, admin: { description: 'One or two sentences.' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'models',
      label: 'Applies to',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      admin: { description: 'Leave blank if it applies to everything. The offer shows on these models’ pages.' },
    },
    {
      name: 'disclaimer',
      label: 'Fine print',
      type: 'textarea',
      admin: { description: 'Terms, eligibility and “with approved credit” wording.' },
    },
  ],
}
