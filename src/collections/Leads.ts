import type { CollectionConfig } from 'payload'

import { hasRole, userHasRole, type Role } from '../access/roles'

export const LEAD_TYPES = [
  { label: 'Quote request', value: 'quote' },
  { label: 'Trade-in value', value: 'trade-in' },
  { label: 'Contact', value: 'contact' },
]

/**
 * Leads from the website's quote, trade-in and contact forms.
 * Created only by the site's own form handlers (which run spam checks), never directly
 * through the public API.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Lead', plural: 'Leads' },
  admin: {
    group: 'Customers',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'type', 'status', 'phone', 'createdAt'],
    listSearchableFields: ['name', 'email', 'phone', 'summary'],
    hidden: ({ user }) => !userHasRole(user as { roles?: Role[] }, 'sales', 'manager'),
  },
  defaultSort: '-createdAt',
  access: {
    read: hasRole('sales', 'manager'),
    create: () => false,
    update: hasRole('sales', 'manager'),
    delete: hasRole('manager'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', required: true, options: LEAD_TYPES, admin: { width: '33%' } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'new',
          index: true,
          options: [
            { label: 'New', value: 'new' },
            { label: 'Contacted', value: 'contacted' },
            { label: 'Won', value: 'won' },
            { label: 'Lost', value: 'lost' },
            { label: 'Spam', value: 'spam' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'assignedTo',
          type: 'relationship',
          relationTo: 'users',
          admin: { width: '33%' },
        },
      ],
    },
    { name: 'summary', type: 'text', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '34%' } },
        { name: 'email', type: 'email', admin: { width: '33%' } },
        { name: 'phone', type: 'text', admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'preferredContact',
          type: 'select',
          options: [
            { label: 'Phone call', value: 'phone' },
            { label: 'Text message', value: 'text' },
            { label: 'Email', value: 'email' },
          ],
          admin: { width: '33%' },
        },
        { name: 'zip', label: 'ZIP code', type: 'text', admin: { width: '33%' } },
        {
          name: 'timeframe',
          type: 'select',
          options: [
            { label: 'Ready now', value: 'now' },
            { label: 'Within a month', value: 'month' },
            { label: 'Just researching', value: 'researching' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    { name: 'message', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'model', label: 'Interested in (model)', type: 'relationship', relationTo: 'models' },
        { name: 'unit', label: 'Interested in (stock unit)', type: 'relationship', relationTo: 'inventory' },
      ],
    },
    {
      name: 'tradeIn',
      type: 'group',
      admin: { condition: (data) => data?.type === 'trade-in' || Boolean(data?.tradeIn?.make) },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'year', type: 'number' },
            { name: 'make', type: 'text' },
            { name: 'model', type: 'text' },
            { name: 'hours', type: 'number' },
          ],
        },
        {
          name: 'condition',
          type: 'select',
          options: [
            { label: 'Excellent', value: 'excellent' },
            { label: 'Good', value: 'good' },
            { label: 'Fair', value: 'fair' },
            { label: 'Needs work', value: 'needs-work' },
          ],
        },
        { name: 'details', type: 'textarea' },
      ],
    },
    {
      name: 'staffNotes',
      type: 'array',
      labels: { singular: 'Note', plural: 'Staff notes' },
      admin: { description: 'Calls made, quotes given, next steps.' },
      fields: [
        { name: 'note', type: 'textarea', required: true },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          admin: { readOnly: true },
          hooks: {
            beforeChange: [({ value, req }) => value ?? req.user?.id],
          },
        },
        {
          name: 'at',
          type: 'date',
          admin: { readOnly: true },
          hooks: { beforeChange: [({ value }) => value ?? new Date().toISOString()] },
        },
      ],
    },
    {
      name: 'source',
      type: 'group',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'page', type: 'text', admin: { readOnly: true } },
        { name: 'ip', type: 'text', admin: { readOnly: true } },
      ],
    },
  ],
}
