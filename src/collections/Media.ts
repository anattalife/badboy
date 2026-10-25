import type { CollectionConfig } from 'payload'

import { anyone, hasRole, isStaff } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo or file', plural: 'Photos & files' },
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: hasRole('manager'),
  },
  fields: [
    {
      name: 'alt',
      label: 'Description',
      type: 'text',
      required: true,
      admin: { description: 'Describe the photo for screen readers and search engines.' },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
    // Image resizing needs sharp, which doesn't run on Cloudflare Workers.
    // Images are resized at delivery time by Cloudflare Images instead (see docs/DEPLOY.md).
    crop: false,
    focalPoint: false,
  },
}
