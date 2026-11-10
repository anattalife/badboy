import type { GlobalConfig } from 'payload'

import { hasRole, isAdminField } from '../access/roles'
import { secretField } from '../fields/secret'
import { checkConnections } from '../lib/connections-hook'

export const UPS_SERVICES = [
  { label: 'UPS Ground', value: '03' },
  { label: 'UPS 3 Day Select', value: '12' },
  { label: 'UPS 2nd Day Air', value: '02' },
  { label: 'UPS Next Day Air Saver', value: '13' },
  { label: 'UPS Next Day Air', value: '01' },
]

export const upsServiceName = (code: string) =>
  UPS_SERVICES.find((s) => s.value === code)?.label ?? `UPS service ${code}`

const statusField = (name: string, label: string) => ({
  name,
  label,
  type: 'text' as const,
  access: { read: isAdminField, update: isAdminField },
  admin: { readOnly: true },
})

/** Parts store settings: connections, shipping, packaging and sales tax. Read on the server only. */
export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store settings',
  admin: { group: 'Parts store' },
  access: {
    read: hasRole('parts', 'manager'),
    update: hasRole('manager'),
  },
  hooks: { beforeChange: [checkConnections] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Orders',
          fields: [
            {
              name: 'storeOpen',
              label: 'Accept online orders',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Turn off to pause checkout (parts stay visible with “Call to order”).',
              },
            },
            {
              name: 'orderEmail',
              type: 'email',
              admin: {
                description:
                  'Where new order alerts go. Leave blank to use the lead email in Dealership info.',
              },
            },
          ],
        },
        {
          label: 'Card payments',
          description:
            'Customers pay on Stripe’s secure checkout page; card numbers never touch this website. In your Stripe ' +
            'dashboard open Developers → API keys, copy the Secret key (sk_live_… for real payments, sk_test_… to try ' +
            'it out) and paste it below. Saving checks the key and sets up payment notifications automatically.',
          fields: [
            {
              name: 'stripe',
              label: false,
              type: 'group',
              fields: [
                secretField(
                  'secretKey',
                  'Stripe secret key',
                  {
                    description:
                      'Starts with sk_live_ or sk_test_. Clear the box and save to disconnect Stripe.',
                  },
                  (v) =>
                    /^(sk|rk)_(live|test)_[A-Za-z0-9]{10,}$/.test(v) ||
                    (v.startsWith('pk_')
                      ? 'That’s the publishable key. Paste the Secret key (it starts with sk_).'
                      : 'That doesn’t look like a Stripe secret key (it starts with sk_live_ or sk_test_).'),
                ),
                statusField('status', 'Connection'),
                secretField('webhookSecret', 'Payment notification secret', { hidden: true }),
                {
                  name: 'webhookId',
                  type: 'text',
                  access: { read: isAdminField, update: isAdminField },
                  admin: { hidden: true },
                },
                {
                  name: 'webhookUrl',
                  type: 'text',
                  access: { read: isAdminField, update: isAdminField },
                  admin: { hidden: true },
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping',
          fields: [
            {
              name: 'ups',
              label: 'UPS connection',
              type: 'group',
              admin: {
                description:
                  'Live UPS rates at checkout. At developer.ups.com sign in with your UPS login, create an app with the ' +
                  '“Rating” product, and copy its Client ID and Client Secret here with your 6-character UPS account ' +
                  'number. Saving checks them with UPS.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'clientId',
                      label: 'Client ID',
                      type: 'text',
                      access: { read: isAdminField, update: isAdminField },
                    },
                    secretField('clientSecret', 'Client Secret'),
                    {
                      name: 'accountNumber',
                      label: 'UPS account number',
                      type: 'text',
                      access: { read: isAdminField, update: isAdminField },
                      validate: (v: unknown) =>
                        !v ||
                        /^[A-Za-z0-9]{6}$/.test(String(v).trim()) ||
                        'UPS account numbers are 6 letters and numbers.',
                    },
                  ],
                },
                {
                  name: 'testMode',
                  label: 'Use UPS’s test system (for trying it out; rates may not be real)',
                  type: 'checkbox',
                  defaultValue: false,
                  access: { read: isAdminField, update: isAdminField },
                },
                statusField('status', 'Connection'),
              ],
            },
            {
              type: 'collapsible',
              label: 'Shipping options',
              fields: [
                {
                  name: 'upsServices',
                  label: 'Services to offer',
                  type: 'select',
                  hasMany: true,
                  defaultValue: ['03', '12', '02', '01'],
                  options: UPS_SERVICES,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'handlingFee',
                      label: 'Handling fee per order ($)',
                      type: 'number',
                      min: 0,
                      defaultValue: 0,
                    },
                    {
                      name: 'freeShippingOver',
                      label: 'Free Ground shipping over ($)',
                      type: 'number',
                      min: 0,
                      admin: { description: 'Leave blank for no free shipping.' },
                    },
                  ],
                },
                {
                  name: 'shipFrom',
                  type: 'group',
                  admin: {
                    description:
                      'The address packages ship from. Leave blank to use the dealership address.',
                  },
                  fields: [
                    { name: 'name', type: 'text' },
                    { name: 'phone', type: 'text' },
                    { name: 'street', type: 'text' },
                    {
                      type: 'row',
                      fields: [
                        { name: 'city', type: 'text' },
                        { name: 'state', type: 'text' },
                        { name: 'zip', type: 'text' },
                      ],
                    },
                  ],
                },
                {
                  name: 'defaultBox',
                  label: 'Box for small parts without dimensions (inches)',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'length', type: 'number', defaultValue: 12 },
                        { name: 'width', type: 'number', defaultValue: 10 },
                        { name: 'height', type: 'number', defaultValue: 8 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Sales tax',
          description:
            'Confirm these with your accountant. Tax is charged only on orders shipping to the state below.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'taxEnabled',
                  label: 'Charge sales tax',
                  type: 'checkbox',
                  defaultValue: false,
                },
                { name: 'taxState', label: 'State', type: 'text' },
                { name: 'taxRatePercent', label: 'Rate (%)', type: 'number', min: 0, max: 20 },
                {
                  name: 'taxShipping',
                  label: 'Tax shipping charges',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
