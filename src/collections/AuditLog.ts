import type { CollectionConfig } from 'payload'

import { isAdmin, type Role } from '../access/roles'

/**
 * Append-only record of who viewed sensitive data (credit applications) and when.
 * Entries are written by server code only; nobody can edit or delete them from the admin.
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Access log entry', plural: 'Access log' },
  admin: {
    group: 'Settings',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'user', 'createdAt'],
    description: 'Every time someone opens a credit application’s sensitive details. Entries cannot be changed.',
    hidden: ({ user }) => !(user as { roles?: Role[] } | null)?.roles?.includes('admin'),
  },
  defaultSort: '-createdAt',
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'summary', type: 'text', required: true },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Viewed sensitive data', value: 'view-sensitive' },
        { label: 'Deleted (retention)', value: 'purge' },
        { label: 'Exported', value: 'export' },
      ],
    },
    { name: 'collectionSlug', type: 'text', required: true },
    { name: 'docId', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'ip', type: 'text' },
  ],
}
