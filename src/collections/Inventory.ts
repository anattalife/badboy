import type { Access, CollectionBeforeValidateHook, CollectionConfig, FieldAccess } from 'payload'

import { hasRole } from '../access/roles'
import { slugify } from '../fields/slug'

/** Statuses the public can see. Everything else is staff-only. */
export const PUBLIC_STATUSES = ['available', 'on-order', 'pending'] as const

export const INVENTORY_STATUS_OPTIONS = [
  { label: 'In stock', value: 'available' },
  { label: 'On order', value: 'on-order' },
  { label: 'Sale pending', value: 'pending' },
  { label: 'Sold', value: 'sold' },
  { label: 'Hidden', value: 'hidden' },
]

export const CONDITION_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
  { label: 'Demo', value: 'demo' },
]

const publicOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { status: { in: [...PUBLIC_STATUSES] } }
}

const staffOnly: FieldAccess = ({ req }) => Boolean(req.user)

/** Pulls the first number out of a deck description like `61" deck` → 61. */
export const parseDeckInches = (deck?: string | null): number | null => {
  const match = deck?.match(/(\d{2,3})/)
  return match ? Number(match[1]) : null
}

const fillDerivedFields: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return data
  const merged = { ...originalDoc, ...data }

  // Category, make and display name follow the linked Bad Boy model.
  let modelName: string | undefined = merged.otherModelName ?? undefined
  const modelId = typeof merged.model === 'object' ? merged.model?.id : merged.model
  if (modelId) {
    const model = await req.payload.findByID({
      collection: 'models',
      id: modelId,
      depth: 0,
      draft: true,
      req,
    })
    data.category = model.category
    data.make = 'Bad Boy'
    modelName = model.name
  }

  data.deckInches = parseDeckInches(merged.deck)

  const make = data.make ?? merged.make ?? 'Bad Boy'
  data.title = [merged.year, make, modelName, merged.configuration].filter(Boolean).join(' ')
  if (merged.stockNumber) {
    data.slug = slugify(`${merged.year ?? ''} ${make} ${modelName ?? ''} ${merged.stockNumber}`)
  }

  // Record when a unit was sold.
  if (data.status === 'sold' && originalDoc?.status !== 'sold' && !merged.soldAt) {
    data.soldAt = new Date().toISOString()
  }
  return data
}

/**
 * Individual machines for sale: new stock, used units and trade-ins.
 */
export const Inventory: CollectionConfig = {
  slug: 'inventory',
  labels: { singular: 'Inventory unit', plural: 'Inventory' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stockNumber', 'condition', 'status', 'price', 'updatedAt'],
    group: 'Equipment',
    listSearchableFields: ['title', 'stockNumber', 'serialNumber'],
    description: 'Machines on the lot or on order. Sold and hidden units never show on the website.',
  },
  defaultSort: '-updatedAt',
  access: {
    read: publicOrStaff,
    create: hasRole('sales', 'manager'),
    update: hasRole('sales', 'manager'),
    delete: hasRole('manager'),
  },
  hooks: {
    beforeValidate: [fillDerivedFields],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'stockNumber',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { width: '33%' },
        },
        {
          name: 'condition',
          type: 'select',
          required: true,
          defaultValue: 'new',
          options: CONDITION_OPTIONS,
          admin: { width: '33%' },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'available',
          index: true,
          options: INVENTORY_STATUS_OPTIONS,
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'model',
          type: 'relationship',
          relationTo: 'models',
          index: true,
          admin: {
            width: '50%',
            description: 'Pick the Bad Boy model. Leave empty for other brands (trade-ins).',
          },
        },
        {
          name: 'year',
          type: 'number',
          required: true,
          min: 1990,
          max: 2100,
          defaultValue: () => new Date().getFullYear(),
          admin: { width: '25%' },
        },
        {
          name: 'hours',
          type: 'number',
          min: 0,
          admin: { width: '25%', description: 'Engine hours (used units).' },
        },
      ],
    },
    {
      type: 'row',
      admin: { condition: (data) => !data?.model },
      fields: [
        { name: 'make', type: 'text', defaultValue: 'Bad Boy', admin: { width: '50%' } },
        { name: 'otherModelName', label: 'Model name', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      index: true,
      admin: {
        description: 'Filled in automatically from the Bad Boy model.',
        condition: (data) => !data?.model,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'configuration',
          type: 'text',
          admin: { width: '40%', description: 'e.g. 61" Kawasaki FX1000V EFI' },
        },
        { name: 'deck', type: 'text', admin: { width: '30%', description: 'e.g. 61"' } },
        { name: 'engine', type: 'text', admin: { width: '30%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: { width: '33%', description: 'Your price in dollars. Leave blank for “Call for price”.' },
        },
        {
          name: 'msrp',
          label: 'MSRP',
          type: 'number',
          min: 0,
          admin: { width: '33%', description: 'Optional. Shown crossed out when higher than your price.' },
        },
        {
          name: 'serialNumber',
          type: 'text',
          access: { read: staffOnly },
          admin: { width: '33%', description: 'Staff only. Never shown on the website.' },
        },
      ],
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'First photo is the main image.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Condition notes, included attachments, warranty remaining, etc.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show first on the In Stock page.' },
    },
    {
      name: 'title',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true, description: 'Built from year, make, model and configuration.' },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'deckInches', type: 'number', index: true, admin: { hidden: true } },
    {
      name: 'soldAt',
      type: 'date',
      access: { read: staffOnly },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
