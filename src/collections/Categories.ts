import type { CollectionConfig } from 'payload'

import { categoryRead, notCarriedField } from '../access/carried'
import { isContentManager } from '../access/roles'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Equipment category', plural: 'Equipment categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'notCarried', 'order'],
    group: 'Equipment',
  },
  defaultSort: 'order',
  access: {
    read: categoryRead,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    notCarriedField('category'),
    {
      name: 'inventoryOnly',
      label: 'Only for in-stock listings',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'For things you list in inventory that aren’t Bad Boy (golf carts, trailers, other brands). Shows as a filter on In stock, never in the Bad Boy catalog.',
      },
    },
    slugField('name'),
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One or two sentences shown on the category page.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. A placeholder illustration is shown when empty.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
