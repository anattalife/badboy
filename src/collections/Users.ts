import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, ROLE_LABELS, ROLES, userHasRole, type Role } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff member', plural: 'Staff' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Settings',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60, // one work day
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // Only admins manage staff accounts. Staff can view the list and edit themselves.
    admin: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    create: isAdmin,
    update: ({ req, id }) =>
      userHasRole(req.user as { roles?: Role[] }, 'admin') || req.user?.id === id,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      // The very first account created becomes an admin, so a fresh install can be set up.
      async ({ req, operation, data }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) data.roles = ['admin']
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['sales'],
      saveToJWT: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: {
        // Staff can't promote themselves.
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        description:
          'Admin can do everything. Finance is the only other role that can see loan applicants’ SSN and income.',
      },
    },
  ],
}
