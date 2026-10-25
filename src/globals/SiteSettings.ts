import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access/roles'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Dealership info',
  admin: { group: 'Settings' },
  access: {
    read: anyone,
    update: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'siteName', type: 'text', required: true, defaultValue: 'Roanoke Mowers' },
        { name: 'legalName', type: 'text', defaultValue: 'Roanoke Golf Cars, LLC' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', required: true },
        { name: 'fax', type: 'text' },
      ],
    },
    {
      name: 'leadEmail',
      type: 'email',
      required: true,
      admin: { description: 'Where new leads and requests are sent. Not shown on the site.' },
      access: { read: ({ req }) => Boolean(req.user) },
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', required: true },
            { name: 'state', type: 'text', required: true, defaultValue: 'VA' },
            { name: 'zip', type: 'text', required: true },
          ],
        },
        { name: 'mapUrl', type: 'text', admin: { description: 'Google Maps link for directions.' } },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      labels: { singular: 'Hours row', plural: 'Hours' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'days', type: 'text', required: true },
            { name: 'hours', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'serviceArea',
      type: 'textarea',
      admin: { description: 'Towns you serve, shown in the footer and used for local search.' },
    },
    { name: 'facebookUrl', type: 'text' },
    {
      name: 'announcement',
      type: 'text',
      admin: { description: 'Optional banner across the top of every page (e.g. a sale or holiday hours).' },
    },
  ],
}
