import type { CollectionConfig } from 'payload'

import { isContentManager, publishedOrStaff } from '../access/roles'
import { slugField } from '../fields/slug'

export const SPEC_GROUPS = [
  'General',
  'Engine',
  'Battery',
  'Deck',
  'Drive',
  'Hydraulics',
  'Capacities',
  'Dimensions',
  'Comfort',
  'Warranty',
] as const

/**
 * A Bad Boy model line (e.g. "Rogue", "5055 Compact Utility Tractor").
 * Individual units for sale (with stock numbers and serials) are a separate
 * Inventory collection that points at a model.
 */
export const Models: CollectionConfig = {
  slug: 'models',
  labels: { singular: 'Equipment model', plural: 'Equipment models' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'featured', '_status', 'updatedAt'],
    group: 'Equipment',
    listSearchableFields: ['name', 'slug', 'tagline'],
  },
  // Admin list is alphabetical; the public site sorts by `order` explicitly.
  defaultSort: 'name',
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  access: {
    read: publishedOrStaff,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          index: true,
        },
      ],
    },
    slugField('name'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on the home page.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers appear first in a category.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'tagline', type: 'text', admin: { description: 'One short line.' } },
            { name: 'summary', type: 'textarea' },
            {
              name: 'highlights',
              type: 'array',
              labels: { singular: 'Highlight', plural: 'Highlights' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'msrp',
              label: 'Bad Boy base MSRP',
              type: 'number',
              min: 0,
              admin: {
                description:
                  'Reference only, from Bad Boy’s build page for the base configuration. Not shown on the website.',
              },
            },
            {
              name: 'startingPrice',
              type: 'number',
              min: 0,
              admin: {
                description: 'Optional “starting at” price in dollars. Leave blank to show “Call for price”.',
              },
            },
          ],
        },
        {
          label: 'Specs',
          fields: [
            {
              name: 'specs',
              type: 'array',
              labels: { singular: 'Spec', plural: 'Specs' },
              admin: {
                description:
                  'Use the same labels across models (e.g. “Engine”, “Cutting Widths”) so they line up in comparisons.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'group',
                      type: 'select',
                      defaultValue: 'General',
                      options: SPEC_GROUPS.map((g) => ({ label: g, value: g })),
                      admin: { width: '25%' },
                    },
                    { name: 'label', type: 'text', required: true, admin: { width: '30%' } },
                    { name: 'value', type: 'text', required: true, admin: { width: '45%' } },
                  ],
                },
              ],
            },
            {
              name: 'configurations',
              type: 'array',
              labels: { singular: 'Configuration', plural: 'Configurations' },
              admin: { description: 'Deck size and engine combinations offered for this model.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'deck', type: 'text' },
                    { name: 'engine', type: 'text' },
                    { name: 'horsepower', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'discharge',
                      type: 'select',
                      options: [
                        { label: 'Side', value: 'side' },
                        { label: 'Rear', value: 'rear' },
                      ],
                    },
                    { name: 'modelNumber', type: 'text' },
                    {
                      name: 'msrp',
                      label: 'MSRP',
                      type: 'number',
                      min: 0,
                      admin: { description: 'Bad Boy MSRP for this configuration (reference).' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Photos',
          fields: [
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'First photo is the main image. A placeholder shows when empty.' },
            },
            {
              name: 'brochure',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional PDF spec sheet.' },
            },
          ],
        },
        {
          label: 'Source',
          fields: [
            {
              name: 'sourceUrl',
              type: 'text',
              admin: {
                description:
                  'Where these specs came from (staff only). Re-check against Bad Boy each model year.',
              },
            },
          ],
        },
      ],
    },
  ],
}
