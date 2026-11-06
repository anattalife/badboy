import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '../access/roles'
import { PRICE_DISPLAY } from '../fields/pricing'

export const DEFAULT_BRAND_COLOR = '#1d1d1b'
export const DEFAULT_ACCENT_COLOR = '#e8641b'
export const DEFAULT_FINANCE_DISCLAIMER =
  'Estimated payment for illustration only, with approved credit. Not an offer of credit. Taxes, fees and down payment not included unless stated. See us for current rates and terms.'

const staffOnly = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

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
      type: 'tabs',
      tabs: [
        {
          label: 'Dealership',
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
              admin: {
                description:
                  'e.g. https://www.example.com. Used in links, emails and search results.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', required: true },
                { name: 'fax', type: 'text' },
              ],
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
                {
                  name: 'mapUrl',
                  type: 'text',
                  admin: { description: 'Google Maps link for directions.' },
                },
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
              admin: {
                description: 'Towns you serve, shown in the footer and used for local search.',
              },
            },
            { name: 'facebookUrl', type: 'text' },
            {
              name: 'announcement',
              type: 'text',
              admin: {
                description:
                  'Optional banner across the top of every page (e.g. a sale or holiday hours).',
              },
            },
          ],
        },
        {
          label: 'Look and home page',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Optional. A wide logo on a transparent background works best. Without one, the website name is shown.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'brandColor',
                  label: 'Main color',
                  type: 'text',
                  defaultValue: DEFAULT_BRAND_COLOR,
                  validate: (v: unknown) =>
                    !v || /^#[0-9a-f]{6}$/i.test(String(v)) || 'Use a hex color like #1d1d1b.',
                  admin: { description: 'Headings, header bar and footer. Hex, e.g. #1d1d1b.' },
                },
                {
                  name: 'accentColor',
                  label: 'Button color',
                  type: 'text',
                  defaultValue: DEFAULT_ACCENT_COLOR,
                  validate: (v: unknown) =>
                    !v || /^#[0-9a-f]{6}$/i.test(String(v)) || 'Use a hex color like #e8641b.',
                  admin: { description: 'Main buttons. Hex, e.g. #e8641b.' },
                },
              ],
            },
            {
              name: 'regionName',
              label: 'Area you serve (short)',
              type: 'text',
              admin: {
                description:
                  'Completes the headline “Bad Boy equipment for …”, e.g. “the Roanoke Valley”.',
              },
            },
            { name: 'heroText', label: 'Home page intro', type: 'textarea' },
            {
              name: 'heroImage',
              label: 'Home page photo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Optional. Without one, the main photo of a featured Bad Boy model is used.',
              },
            },
            {
              name: 'showMountains',
              label: 'Mountain horizon under the home page headline',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          label: 'Prices and financing',
          fields: [
            {
              name: 'priceDisplay',
              label: 'How prices show on the website',
              type: 'select',
              required: true,
              defaultValue: 'dealer',
              options: [...PRICE_DISPLAY],
              admin: {
                description:
                  'The default for every model and unit. Each model or unit can override it. When no price shows, visitors get a “Get today’s price” button that sends you a quote request.',
              },
            },
            {
              name: 'financeApplication',
              label: 'Where “Apply for financing” goes',
              type: 'radio',
              required: true,
              defaultValue: 'builtin',
              options: [
                { label: 'Our secure online application (built in)', value: 'builtin' },
                { label: 'Our lender’s online application (links below)', value: 'links' },
                { label: 'Both: lender links above our application', value: 'both' },
              ],
              admin: {
                description:
                  'Every “Apply for financing” button on the site opens your Financing page, which shows what you pick here.',
                layout: 'vertical',
              },
            },
            {
              name: 'financeLinks',
              label: 'Lender application links',
              type: 'array',
              maxRows: 4,
              labels: { singular: 'Lender link', plural: 'Lender links' },
              admin: {
                condition: (data) =>
                  data?.financeApplication === 'links' || data?.financeApplication === 'both',
                description:
                  'The online credit applications your lenders gave you. Opens in a new tab.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      label: 'Button text',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', description: 'e.g. “Apply with our lender”' },
                    },
                    {
                      name: 'url',
                      label: 'Application link',
                      type: 'text',
                      required: true,
                      validate: (v: unknown) =>
                        (typeof v === 'string' &&
                          /^https:\/\/[^\s]+$/i.test(v) &&
                          URL.canParse(v)) ||
                        'Paste the full link, starting with https://',
                      admin: { width: '60%' },
                    },
                  ],
                },
                {
                  name: 'note',
                  type: 'text',
                  admin: { description: 'Optional, e.g. “Promotional rates on Bad Boy equipment”' },
                },
              ],
            },
            {
              name: 'showPaymentEstimate',
              label: 'Show an estimated monthly payment next to prices',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              type: 'row',
              admin: { condition: (data) => Boolean(data?.showPaymentEstimate) },
              fields: [
                {
                  name: 'financeApr',
                  label: 'APR (%)',
                  type: 'number',
                  min: 0,
                  max: 40,
                  defaultValue: 6.99,
                },
                {
                  name: 'financeTermMonths',
                  label: 'Term (months)',
                  type: 'number',
                  min: 6,
                  max: 120,
                  defaultValue: 60,
                },
                {
                  name: 'financeDownPercent',
                  label: 'Down payment (%)',
                  type: 'number',
                  min: 0,
                  max: 90,
                  defaultValue: 0,
                },
              ],
            },
            {
              name: 'financeDisclaimer',
              label: 'Payment estimate disclaimer',
              type: 'textarea',
              defaultValue: DEFAULT_FINANCE_DISCLAIMER,
              admin: { condition: (data) => Boolean(data?.showPaymentEstimate) },
            },
          ],
        },
        {
          label: 'Leads and privacy',
          fields: [
            {
              name: 'leadEmail',
              type: 'email',
              required: true,
              admin: {
                description: 'Where new leads and requests are sent. Not shown on the site.',
              },
              access: { read: ({ req }) => Boolean(req.user) },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'financeEmail',
                  type: 'email',
                  access: { read: staffOnly },
                  admin: {
                    width: '50%',
                    description: 'Optional. Credit application alerts. Blank uses the lead email.',
                  },
                },
                {
                  name: 'serviceEmail',
                  type: 'email',
                  access: { read: staffOnly },
                  admin: {
                    width: '50%',
                    description: 'Optional. Service request alerts. Blank uses the lead email.',
                  },
                },
              ],
            },
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
          ],
        },
      ],
    },
    {
      name: 'setupCompletedAt',
      label: 'Setup finished',
      type: 'date',
      access: { read: staffOnly, update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When the setup wizard was finished.',
      },
    },
  ],
}
