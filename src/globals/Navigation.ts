import type { GlobalConfig } from 'payload'

import { anyone, isContentManager } from '../access/roles'
import { linkUrlField } from '../blocks/config'

const linkRow = [
  {
    type: 'row' as const,
    fields: [
      { name: 'label', type: 'text' as const, required: true, admin: { width: '40%' } },
      linkUrlField('url', true, '60%'),
    ],
  },
]

/** The menus: main menu in the header, and the links in the footer. */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menus',
  admin: { group: 'Content', description: 'The main menu and the footer links. Drag rows to reorder.' },
  access: { read: anyone, update: isContentManager },
  fields: [
    {
      name: 'mainMenu',
      label: 'Main menu',
      type: 'array',
      maxRows: 9,
      labels: { singular: 'Menu item', plural: 'Menu items' },
      fields: linkRow,
    },
    {
      name: 'footerLinks',
      label: 'Footer links',
      type: 'array',
      maxRows: 12,
      labels: { singular: 'Link', plural: 'Links' },
      fields: linkRow,
    },
    {
      name: 'footerText',
      label: 'Footer text',
      type: 'textarea',
      admin: { description: 'Blank: “Bad Boy mowers, tractors, UTVs and equipment, sold and serviced by <legal name>.”' },
    },
  ],
}

export const DEFAULT_MAIN_MENU = [
  { label: 'Equipment', url: '/equipment' },
  { label: 'In stock', url: '/inventory' },
  { label: 'Offers', url: '/offers' },
  { label: 'Compare', url: '/compare' },
  { label: 'Financing', url: '/financing' },
  { label: 'Parts', url: '/parts' },
  { label: 'Service', url: '/service' },
  { label: 'Contact', url: '/contact' },
]

export const DEFAULT_FOOTER_LINKS = [
  { label: 'Apply for financing', url: '/financing' },
  { label: 'Value your trade', url: '/trade-in' },
  { label: 'Contact us', url: '/contact' },
  { label: 'Shipping and returns', url: '/shipping-and-returns' },
  { label: 'Privacy', url: '/privacy' },
]
