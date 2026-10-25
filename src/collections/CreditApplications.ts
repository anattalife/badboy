import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  Payload,
} from 'payload'

import { hasRole, userHasRole, type Role } from '../access/roles'
import { decrypt, encrypt, isEncrypted, mask, MASK_CHAR } from '../lib/crypto'

/** Fields encrypted at rest, per person on the application. */
const SENSITIVE: { name: string; kind: 'ssn' | 'date' | 'money' }[] = [
  { name: 'ssn', kind: 'ssn' },
  { name: 'dateOfBirth', kind: 'date' },
  { name: 'monthlyIncome', kind: 'money' },
  { name: 'otherMonthlyIncome', kind: 'money' },
]

/**
 * The co-applicant lives in its own table (an array limited to one row). Keeping both people as
 * flat columns would exceed Cloudflare D1's 100-parameter limit when an application is updated.
 */
const peopleOf = (doc: Record<string, unknown>): { person: Record<string, unknown>; original?: Person }[] => {
  const list: { person: Record<string, unknown>; original?: Person }[] = []
  if (doc.applicant && typeof doc.applicant === 'object') list.push({ person: doc.applicant as Record<string, unknown> })
  if (Array.isArray(doc.coApplicant)) {
    for (const row of doc.coApplicant) if (row && typeof row === 'object') list.push({ person: row })
  }
  return list
}

const sensitiveNote = 'Encrypted. Only Finance and Admin can read it, and each view is logged.'

const personFields = (): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'firstName', type: 'text', required: true },
      { name: 'middleInitial', type: 'text', maxLength: 1, admin: { width: '15%' } },
      { name: 'lastName', type: 'text', required: true },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'ssn', label: 'SSN', type: 'text', admin: { description: sensitiveNote } },
      { name: 'dateOfBirth', type: 'text', admin: { description: sensitiveNote } },
    ],
  },
  {
    name: 'address',
    type: 'group',
    fields: [
      { name: 'street', type: 'text' },
      {
        type: 'row',
        fields: [
          { name: 'city', type: 'text' },
          { name: 'state', type: 'text' },
          { name: 'zip', type: 'text' },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'yearsAtAddress', type: 'number', min: 0 },
          { name: 'monthsAtAddress', type: 'number', min: 0, max: 11 },
          {
            name: 'housing',
            type: 'select',
            options: [
              { label: 'Own', value: 'own' },
              { label: 'Rent', value: 'rent' },
              { label: 'Live with family', value: 'family' },
              { label: 'Other', value: 'other' },
            ],
          },
          { name: 'monthlyHousingPayment', type: 'number', min: 0 },
        ],
      },
    ],
  },
  {
    name: 'employment',
    type: 'group',
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            options: [
              { label: 'Employed', value: 'employed' },
              { label: 'Self-employed', value: 'self-employed' },
              { label: 'Retired', value: 'retired' },
              { label: 'Other', value: 'other' },
            ],
          },
          { name: 'employer', type: 'text' },
          { name: 'jobTitle', type: 'text' },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'employerPhone', type: 'text' },
          { name: 'yearsEmployed', type: 'number', min: 0 },
          { name: 'monthsEmployed', type: 'number', min: 0, max: 11 },
        ],
      },
    ],
  },
  {
    type: 'row',
    fields: [
      { name: 'monthlyIncome', label: 'Gross monthly income', type: 'text', admin: { description: sensitiveNote } },
      { name: 'otherMonthlyIncome', label: 'Other monthly income', type: 'text', admin: { description: sensitiveNote } },
      { name: 'otherIncomeSource', type: 'text' },
    ],
  },
]

type Person = Record<string, unknown> | null | undefined

/** Encrypt plain values on save; keep the stored value if a masked placeholder comes back. */
const encryptSensitive: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  const originals: Person[] = [
    originalDoc?.applicant as Person,
    ...((Array.isArray(originalDoc?.coApplicant) ? originalDoc.coApplicant : []) as Person[]),
  ]
  const people = peopleOf(data)
  for (const [index, { person }] of people.entries()) {
    // Match array rows by id when possible; fall back to position.
    const original =
      index === 0
        ? originals[0]
        : (originals.slice(1).find((o) => o && person.id && o.id === person.id) ?? originals[index])
    for (const { name } of SENSITIVE) {
      const value = person[name]
      if (typeof value !== 'string' || value === '') continue
      if (value.includes(MASK_CHAR) || value === '[unreadable]') {
        person[name] = original?.[name] ?? null
      } else if (!isEncrypted(value)) {
        person[name] = await encrypt(value.trim())
      }
    }
  }
  return data
}

/**
 * Decrypt for Finance/Admin when they open one application (and log it).
 * Lists and everyone else get masked values.
 */
const decryptOrMask: CollectionAfterReadHook = async ({ doc, req, findMany, context }) => {
  const user = req.user as { id: number; roles?: Role[] } | null
  const reveal = !findMany && userHasRole(user, 'finance') && !context?.maskSensitive
  let revealed = false

  for (const { person } of peopleOf(doc)) {
    for (const { name, kind } of SENSITIVE) {
      const stored = person[name]
      if (typeof stored !== 'string' || !stored) continue
      let plain: string
      try {
        plain = await decrypt(stored)
      } catch {
        person[name] = '[unreadable]'
        continue
      }
      person[name] = reveal ? plain : mask(plain, kind)
      if (reveal) revealed = true
    }
  }

  if (revealed && user) {
    await req.payload.create({
      collection: 'audit-log',
      overrideAccess: true,
      data: {
        summary: `Viewed credit application #${doc.id}`,
        action: 'view-sensitive',
        collectionSlug: 'credit-applications',
        docId: String(doc.id),
        user: user.id,
        ip: req.headers?.get('cf-connecting-ip') ?? req.headers?.get('x-forwarded-for') ?? undefined,
      },
    })
  }
  return doc
}

/** Deletes applications older than the retention period set in Dealership info. */
export async function purgeExpiredApplications(payload: Payload): Promise<number> {
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const days = settings.creditApplicationRetentionDays
  if (!days || days < 1) return 0
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { docs } = await payload.delete({
    collection: 'credit-applications',
    where: { createdAt: { less_than: cutoff } },
    overrideAccess: true,
    context: { maskSensitive: true },
  })
  if (docs.length) {
    await payload.create({
      collection: 'audit-log',
      overrideAccess: true,
      data: {
        summary: `Deleted ${docs.length} credit application(s) older than ${days} days`,
        action: 'purge',
        collectionSlug: 'credit-applications',
      },
    })
  }
  return docs.length
}

export const CreditApplications: CollectionConfig = {
  slug: 'credit-applications',
  labels: { singular: 'Credit application', plural: 'Credit applications' },
  admin: {
    group: 'Customers',
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'status', 'amountRequested', 'createdAt'],
    description:
      'Finance and Admin only. SSN, date of birth and income are encrypted and every view is logged.',
    hidden: ({ user }) => !userHasRole(user as { roles?: Role[] }, 'finance'),
  },
  defaultSort: '-createdAt',
  access: {
    read: hasRole('finance'),
    create: () => false, // only the website's application form creates these
    update: hasRole('finance'),
    delete: hasRole('finance'),
  },
  hooks: {
    beforeChange: [encryptSensitive],
    afterRead: [decryptOrMask],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'new',
          index: true,
          options: [
            { label: 'New', value: 'new' },
            { label: 'Reviewing', value: 'reviewing' },
            { label: 'Sent to lender', value: 'submitted' },
            { label: 'Approved', value: 'approved' },
            { label: 'Declined', value: 'declined' },
            { label: 'Withdrawn', value: 'withdrawn' },
          ],
        },
        { name: 'lender', type: 'text' },
        { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
      ],
    },
    { name: 'summary', type: 'text', admin: { readOnly: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Purchase',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'model', type: 'relationship', relationTo: 'models' },
                { name: 'unit', type: 'relationship', relationTo: 'inventory' },
              ],
            },
            { name: 'equipmentDescription', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'purchasePrice', type: 'number', min: 0 },
                { name: 'downPayment', type: 'number', min: 0 },
                { name: 'amountRequested', type: 'number', min: 0 },
              ],
            },
          ],
        },
        { label: 'Applicant', fields: [{ name: 'applicant', type: 'group', label: false, fields: personFields() }] },
        {
          label: 'Co-applicant',
          fields: [
            {
              name: 'coApplicant',
              type: 'array',
              label: 'Co-applicant',
              labels: { singular: 'Co-applicant', plural: 'Co-applicants' },
              maxRows: 1,
              fields: personFields().map((f) =>
                // Names aren't required for the optional co-applicant at the schema level.
                'fields' in f && f.type === 'row'
                  ? { ...f, fields: f.fields.map((ff) => ('required' in ff ? { ...ff, required: false } : ff)) as Field[] }
                  : f,
              ),
            },
          ],
        },
        {
          label: 'Notes',
          fields: [
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
                {
                  name: 'at',
                  type: 'date',
                  admin: { readOnly: true },
                  hooks: { beforeChange: [({ value }) => value ?? new Date().toISOString()] },
                },
              ],
            },
          ],
        },
        {
          label: 'Consent',
          fields: [
            {
              name: 'consent',
              type: 'group',
              admin: { readOnly: true },
              fields: [
                { name: 'agreedAt', type: 'date' },
                { name: 'text', label: 'Exact text the applicant agreed to', type: 'textarea' },
                { name: 'ip', type: 'text' },
                { name: 'userAgent', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
