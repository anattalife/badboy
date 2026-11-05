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
        { name: 'siteName', label: 'Website name', type: 'text', required: true },
        { name: 'legalName', label: 'Legal business name', type: 'text', required: true },
      ],
    },
    {
      name: 'siteUrl',
      label: 'Website address',
      type: 'text',
      admin: { description: 'e.g. https://www.example.com. Used in links, emails and search results.' },
    },
    {
      type: 'collapsible',
      label: 'Look and home page',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Optional. A wide logo on a transparent background works best. Without one, the website name is shown.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'brandColor',
              label: 'Main color',
              type: 'text',
              defaultValue: '#2f4a5c',
              validate: (v: unknown) => !v || /^#[0-9a-f]{6}$/i.test(String(v)) || 'Use a hex color like #2f4a5c.',
              admin: { description: 'Headings, header bar and footer. Hex, e.g. #2f4a5c.' },
            },
            {
              name: 'accentColor',
              label: 'Button color',
              type: 'text',
              defaultValue: '#e8641b',
              validate: (v: unknown) => !v || /^#[0-9a-f]{6}$/i.test(String(v)) || 'Use a hex color like #e8641b.',
              admin: { description: 'Main buttons. Hex, e.g. #e8641b.' },
            },
          ],
        },
        {
          name: 'regionName',
          label: 'Area you serve (short)',
          type: 'text',
          admin: { description: 'Completes the headline “Bad Boy equipment for …”, e.g. “the Roanoke Valley”.' },
        },
        { name: 'heroText', label: 'Home page intro', type: 'textarea' },
        {
          name: 'showMountains',
          label: 'Mountain horizon under the home page headline',
          type: 'checkbox',
          defaultValue: false,
        },
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
      name: 'creditApplicationRetentionDays',
      label: 'Delete credit applications after (days)',
      type: 'number',
      min: 30,
      defaultValue: 365,
      required: true,
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description:
          'Applications older than this are deleted automatically. Check with your accountant or lender how long you must keep them.',
      },
    },
    {
      name: 'announcement',
      type: 'text',
      admin: { description: 'Optional banner across the top of every page (e.g. a sale or holiday hours).' },
    },
  ],
}
