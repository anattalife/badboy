import type { CollectionConfig } from 'payload'

import { hasRole, userHasRole, type Role } from '../access/roles'

export const ORDER_STATUSES = [
  { label: 'Awaiting payment', value: 'pending-payment' },
  { label: 'Paid — to pack', value: 'paid' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
]

/**
 * Parts orders. Created only by the website's checkout, which prices everything on the server.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    group: 'Parts store',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'status', 'total', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customerName', 'email', 'trackingNumber'],
    hidden: ({ user }) => !userHasRole(user as { roles?: Role[] }, 'parts', 'manager'),
  },
  defaultSort: '-createdAt',
  access: {
    read: hasRole('parts', 'manager'),
    create: () => false,
    update: hasRole('parts', 'manager'),
    delete: hasRole('manager'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'orderNumber', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending-payment',
          index: true,
          options: ORDER_STATUSES,
        },
        { name: 'trackingNumber', label: 'UPS tracking number', type: 'text' },
      ],
    },
    {
      // Secret part of the customer's confirmation link. Never shown in the admin.
      name: 'accessToken',
      type: 'text',
      required: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'shipTo',
      type: 'group',
      fields: [
        { name: 'street', type: 'text', required: true },
        { name: 'street2', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', required: true },
            { name: 'state', type: 'text', required: true },
            { name: 'zip', type: 'text', required: true },
            { name: 'residential', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'part', type: 'relationship', relationTo: 'parts' },
            { name: 'partNumber', type: 'text' },
            { name: 'name', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'unitPrice', type: 'number', required: true },
            { name: 'qty', type: 'number', required: true },
            { name: 'lineTotal', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'shippingAmount', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'taxAmount', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'total', type: 'number', required: true, admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'shippingService', type: 'text', admin: { readOnly: true } },
        { name: 'shippingServiceCode', type: 'text', admin: { readOnly: true } },
        { name: 'taxRatePercent', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'payment',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'provider', type: 'text' },
            { name: 'reference', type: 'text' },
            { name: 'paidAt', type: 'date' },
          ],
        },
      ],
    },
    { name: 'customerNotes', type: 'textarea', admin: { readOnly: true } },
    {
      name: 'staffNotes',
      type: 'array',
      fields: [
        { name: 'note', type: 'textarea', required: true },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          admin: { readOnly: true },
          hooks: { beforeChange: [({ value, req }) => value ?? req.user?.id] },
        },
      ],
    },
    { name: 'ip', type: 'text', admin: { position: 'sidebar', readOnly: true } },
  ],
}
