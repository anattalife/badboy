import type { GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'

export const UPS_SERVICES = [
  { label: 'UPS Ground', value: '03' },
  { label: 'UPS 3 Day Select', value: '12' },
  { label: 'UPS 2nd Day Air', value: '02' },
  { label: 'UPS Next Day Air Saver', value: '13' },
  { label: 'UPS Next Day Air', value: '01' },
]

export const upsServiceName = (code: string) => UPS_SERVICES.find((s) => s.value === code)?.label ?? `UPS service ${code}`

/** Parts store settings: shipping, packaging and sales tax. Read on the server only. */
export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store settings',
  admin: { group: 'Parts store' },
  access: {
    read: hasRole('parts', 'manager'),
    update: hasRole('manager'),
  },
  fields: [
    {
      name: 'storeOpen',
      label: 'Accept online orders',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Turn off to pause checkout (parts stay visible with “Call to order”).' },
    },
    {
      name: 'orderEmail',
      type: 'email',
      admin: { description: 'Where new order alerts go. Leave blank to use the lead email in Dealership info.' },
    },
    {
      type: 'collapsible',
      label: 'UPS shipping',
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
            { name: 'handlingFee', label: 'Handling fee per order ($)', type: 'number', min: 0, defaultValue: 0 },
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
          admin: { description: 'The address packages ship from.' },
          fields: [
            { name: 'name', type: 'text', defaultValue: 'Roanoke Golf Cars' },
            { name: 'phone', type: 'text', defaultValue: '5409860098' },
            { name: 'street', type: 'text', defaultValue: '4802 Melrose Ave NW' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', defaultValue: 'Roanoke' },
                { name: 'state', type: 'text', defaultValue: 'VA' },
                { name: 'zip', type: 'text', defaultValue: '24017' },
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
    {
      type: 'collapsible',
      label: 'Sales tax',
      admin: {
        description:
          'Confirm these with your accountant. Tax is charged only on orders shipping to the state below.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'taxEnabled', label: 'Charge sales tax', type: 'checkbox', defaultValue: true },
            { name: 'taxState', label: 'State', type: 'text', defaultValue: 'VA' },
            { name: 'taxRatePercent', label: 'Rate (%)', type: 'number', min: 0, max: 20, defaultValue: 5.3 },
            { name: 'taxShipping', label: 'Tax shipping charges', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
  ],
}
