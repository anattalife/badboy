import type { Access, CollectionConfig } from 'payload'

import { hasRole } from '../access/roles'
import { slugField } from '../fields/slug'

export const PART_CATEGORIES = [
  { label: 'Mower accessories', value: 'mower-accessories' },
  { label: 'UTV accessories', value: 'utv-accessories' },
  { label: 'E-Series accessories', value: 'e-series' },
  { label: 'Maintenance parts', value: 'maintenance' },
  { label: 'Other parts', value: 'other' },
]

const activeOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { active: { equals: true } }
}

type PartLike = {
  active?: boolean | null
  price?: number | null
  weightLb?: number | null
  availability?: string | null
}

/** A part can be bought online only with a price and a shipping weight. */
export const canBuyOnline = (p: PartLike) =>
  Boolean(p.active && p.price && p.price > 0 && p.weightLb && p.weightLb > 0 && p.availability !== 'discontinued')

/**
 * Parts and accessories sold in the online store. Created by staff or by uploading a price list
 * (see Parts imports). Matched on part number when importing.
 */
export const Parts: CollectionConfig = {
  slug: 'parts',
  labels: { singular: 'Part', plural: 'Parts' },
  admin: {
    group: 'Parts store',
    useAsTitle: 'name',
    defaultColumns: ['name', 'partNumber', 'price', 'weightLb', 'availability', 'active'],
    listSearchableFields: ['name', 'partNumber', 'description'],
    description:
      'Parts need a price and a shipping weight to be sold online. Without them they show “Call to order”.',
  },
  defaultSort: 'name',
  access: {
    read: activeOrStaff,
    create: hasRole('parts', 'manager'),
    update: hasRole('parts', 'manager'),
    delete: hasRole('manager'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      type: 'row',
      fields: [
        { name: 'partNumber', type: 'text', unique: true, index: true, admin: { width: '33%' } },
        { name: 'category', type: 'select', required: true, defaultValue: 'other', options: PART_CATEGORIES, admin: { width: '33%' } },
        { name: 'group', type: 'text', admin: { width: '33%', description: 'Optional sub-group, e.g. Comfort, Lighting.' } },
      ],
    },
    { name: 'description', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', min: 0, admin: { width: '25%', description: 'Your price in dollars.' } },
        { name: 'msrp', label: 'MSRP', type: 'number', min: 0, admin: { width: '25%' } },
        {
          name: 'availability',
          type: 'select',
          defaultValue: 'in-stock',
          options: [
            { label: 'In stock', value: 'in-stock' },
            { label: 'Special order', value: 'special-order' },
            { label: 'Discontinued', value: 'discontinued' },
          ],
          admin: { width: '25%' },
        },
        { name: 'stockQty', label: 'On hand', type: 'number', min: 0, admin: { width: '25%' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Shipping size',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'weightLb', label: 'Weight (lb)', type: 'number', min: 0, admin: { description: 'Packed weight. Required to ship.' } },
            { name: 'lengthIn', label: 'Length (in)', type: 'number', min: 0 },
            { name: 'widthIn', label: 'Width (in)', type: 'number', min: 0 },
            { name: 'heightIn', label: 'Height (in)', type: 'number', min: 0 },
          ],
        },
      ],
    },
    {
      name: 'models',
      label: 'Fits these Bad Boy models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      admin: { description: 'Used for “Parts for your machine” on model pages.' },
    },
    {
      name: 'fits',
      label: 'Fitment notes',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Show on the website.' },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Entered by staff', value: 'manual' },
        { label: 'Price list import', value: 'import' },
        { label: 'Bad Boy accessory catalog', value: 'bad-boy' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
