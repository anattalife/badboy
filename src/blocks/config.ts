import type { Block, Field } from 'payload'

/** A link a staff member can type: a page on this site (/financing), a full address, tel: or mailto:. */
export const linkUrlField = (name = 'url', required = true, width?: string): Field => ({
  name,
  label: 'Link',
  type: 'text',
  required,
  validate: (v: unknown) =>
    (!required && !v) ||
    (typeof v === 'string' && /^(\/|https:\/\/|tel:|mailto:|#)/i.test(v.trim())) ||
    'Use a page on this site like /financing, or a full address starting with https://',
  admin: { width, description: 'A page on this site like /financing, or a full address starting with https://' },
})

const button = (required = false): Field => ({
  type: 'row',
  fields: [
    { name: 'buttonLabel', label: 'Button text', type: 'text', required, admin: { width: '40%' } },
    linkUrlField('buttonUrl', required, '60%'),
  ],
})

const heading = (defaultValue?: string): Field => ({ name: 'heading', type: 'text', defaultValue })

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero banner', plural: 'Hero banners' },
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', defaultValue: 'Authorized Bad Boy dealer' },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Bad Boy equipment for {region}',
      admin: { description: '{region} is replaced with the area you serve (Dealership info → Look and home page).' },
    },
    {
      name: 'text',
      type: 'textarea',
      admin: { description: 'Leave blank to use the home page intro from Dealership info.' },
    },
    {
      name: 'buttons',
      type: 'array',
      maxRows: 3,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '35%' } },
            linkUrlField('url', true, '45%'),
            {
              name: 'style',
              type: 'select',
              defaultValue: 'primary',
              options: [
                { label: 'Orange', value: 'primary' },
                { label: 'Outline', value: 'outline' },
              ],
              admin: { width: '20%' },
            },
          ],
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Leave blank to show a featured Bad Boy model, or the home page photo from Dealership info.' },
    },
    { name: 'showMountains', label: 'Show the mountain horizon', type: 'checkbox', defaultValue: false },
  ],
}

export const ContentBlock: Block = {
  slug: 'content',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [
    { name: 'body', type: 'richText', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'width',
          type: 'select',
          defaultValue: 'narrow',
          options: [
            { label: 'Easy reading width', value: 'narrow' },
            { label: 'Full width', value: 'wide' },
          ],
        },
        {
          name: 'background',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Light grey panel', value: 'panel' },
          ],
        },
      ],
    },
  ],
}

export const MediaTextBlock: Block = {
  slug: 'mediaText',
  labels: { singular: 'Photo with text', plural: 'Photos with text' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Photo on the left', value: 'left' },
        { label: 'Photo on the right', value: 'right' },
      ],
    },
    heading(),
    { name: 'body', type: 'richText' },
    button(),
  ],
}

export const CategoryGridBlock: Block = {
  slug: 'categoryGrid',
  labels: { singular: 'Equipment categories', plural: 'Equipment categories' },
  fields: [heading('The full Bad Boy line')],
}

export const FeaturedModelsBlock: Block = {
  slug: 'featuredModels',
  labels: { singular: 'Featured models', plural: 'Featured models' },
  fields: [
    heading('Popular with our customers'),
    {
      name: 'models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      maxRows: 9,
      admin: { description: 'Leave blank to show the models marked “Featured”.' },
    },
  ],
}

export const OffersBlock: Block = {
  slug: 'offers',
  labels: { singular: 'Current offers', plural: 'Current offers' },
  fields: [
    heading('Current offers'),
    { name: 'limit', label: 'How many', type: 'number', min: 1, max: 9, defaultValue: 3 },
  ],
}

export const InStockBlock: Block = {
  slug: 'inStock',
  labels: { singular: 'In-stock units', plural: 'In-stock units' },
  fields: [
    heading('On the lot now'),
    { name: 'limit', label: 'How many', type: 'number', min: 1, max: 12, defaultValue: 3 },
  ],
}

export const AcreageBlock: Block = {
  slug: 'acreage',
  labels: { singular: 'Mower finder (by acreage)', plural: 'Mower finders' },
  fields: [
    heading('How much ground are you covering?'),
    {
      name: 'options',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. “1–3 acres”' } },
        { name: 'advice', type: 'textarea', required: true },
        { name: 'models', label: 'Suggested models', type: 'relationship', relationTo: 'models', hasMany: true, maxRows: 3 },
      ],
    },
  ],
}

export const CallToActionBlock: Block = {
  slug: 'callToAction',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    button(true),
    {
      name: 'color',
      type: 'select',
      defaultValue: 'accent',
      options: [
        { label: 'Button color (orange)', value: 'accent' },
        { label: 'Main color (black)', value: 'brand' },
        { label: 'Light grey', value: 'light' },
      ],
    },
  ],
}

export const FeaturesBlock: Block = {
  slug: 'features',
  labels: { singular: 'Feature list', plural: 'Feature lists' },
  fields: [
    heading(),
    { name: 'intro', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 8,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'linkLabel', label: 'Link text', type: 'text', admin: { width: '40%' } },
            linkUrlField('linkUrl', false, '60%'),
          ],
        },
      ],
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'panel',
      options: [
        { label: 'Light grey panel', value: 'panel' },
        { label: 'None', value: 'none' },
      ],
    },
  ],
}

export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'Questions and answers', plural: 'Questions and answers' },
  fields: [
    heading('Common questions'),
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

export const VisitBlock: Block = {
  slug: 'visit',
  labels: { singular: 'Visit us (address and hours)', plural: 'Visit us' },
  fields: [
    heading('Come see it in person'),
    { name: 'text', type: 'textarea', admin: { description: 'Optional. Address, phone and hours come from Dealership info.' } },
  ],
}

export const LeadFormBlock: Block = {
  slug: 'leadForm',
  labels: { singular: 'Contact form', plural: 'Contact forms' },
  fields: [
    heading('Send us a message'),
    { name: 'intro', type: 'textarea' },
    {
      name: 'formType',
      type: 'select',
      defaultValue: 'contact',
      options: [
        { label: 'General question', value: 'contact' },
        { label: 'Quote request', value: 'quote' },
        { label: 'Trade-in value', value: 'trade-in' },
      ],
      admin: { description: 'Submissions arrive in Leads and by email, like the other forms.' },
    },
  ],
}

export const PAGE_BLOCKS: Block[] = (
  [
  HeroBlock,
  ContentBlock,
  MediaTextBlock,
  CategoryGridBlock,
  FeaturedModelsBlock,
  OffersBlock,
  InStockBlock,
  AcreageBlock,
  CallToActionBlock,
  FeaturesBlock,
  FaqBlock,
  VisitBlock,
  LeadFormBlock,
] as Block[]
).map((b) => ({ ...b, admin: { ...b.admin, disableBlockName: true } }))
