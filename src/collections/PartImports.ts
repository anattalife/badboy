import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { hasRole } from '../access/roles'
import { importPartsCsv } from '../lib/partsImport'

const runImport: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data
  const file = req.file
  if (!file?.data) throw new Error('Choose a CSV file to upload.')
  const text = new TextDecoder().decode(file.data as Uint8Array)
  const result = await importPartsCsv(req.payload, text, { req })
  data.created = result.created
  data.updated = result.updated
  data.skipped = result.skipped
  data.columnsFound = Object.entries(result.columns)
    .map(([field, header]) => `${field} ← “${header}”`)
    .join('\n')
  data.problems = result.errors.join('\n') || 'None'
  data.importedBy = req.user?.id
  return data
}

/**
 * Upload a price list (CSV) here to add or update parts in bulk. Each upload is kept as a record
 * of what was imported and what happened.
 */
export const PartImports: CollectionConfig = {
  slug: 'part-imports',
  labels: { singular: 'Price list import', plural: 'Price list imports' },
  admin: {
    group: 'Parts store',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'created', 'updated', 'skipped', 'createdAt'],
    description:
      'Upload a CSV price list to add or update parts. Rows are matched by part number. A template is at /parts-import-template.csv on the website.',
  },
  defaultSort: '-createdAt',
  access: {
    read: hasRole('parts', 'manager'),
    create: hasRole('parts', 'manager'),
    update: () => false,
    delete: hasRole('manager'),
  },
  upload: {
    mimeTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/csv'],
  },
  hooks: { beforeChange: [runImport] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'created', label: 'New parts', type: 'number', admin: { readOnly: true } },
        { name: 'updated', label: 'Updated parts', type: 'number', admin: { readOnly: true } },
        { name: 'skipped', label: 'Skipped rows', type: 'number', admin: { readOnly: true } },
      ],
    },
    { name: 'columnsFound', label: 'Columns used', type: 'textarea', admin: { readOnly: true } },
    { name: 'problems', type: 'textarea', admin: { readOnly: true } },
    { name: 'importedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
