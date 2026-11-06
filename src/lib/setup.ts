import 'server-only'

import { cache } from 'react'

import { getPayloadClient } from './payload'

/** True once the setup wizard (or the demo seed) has filled in the dealership. */
export const isSetupComplete = cache(async (): Promise<boolean> => {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
    select: { setupCompletedAt: true },
  })
  return Boolean(settings.setupCompletedAt)
})

export { setupCodeMatches, setupCodeRequired } from './setupCode'
