import { readFileSync } from 'node:fs'
import path from 'node:path'

/** A dealer profile in `dealers/<name>.json`. Copy `dealers/_template.json` to start a new one. */
export type DealerProfile = {
  siteName: string
  legalName: string
  siteUrl?: string
  phone: string
  fax?: string
  leadEmail: string
  adminEmail?: string
  address: { street: string; city: string; state: string; zip: string; mapUrl?: string }
  hours?: { days: string; hours: string }[]
  regionName?: string
  heroText?: string
  serviceArea?: string
  facebookUrl?: string
  brandColor?: string
  accentColor?: string
  showMountains?: boolean
  /** Extra categories for in-stock listings that aren't Bad Boy, e.g. Golf carts, Trailers. */
  inventoryCategories?: string[]
  tax?: { enabled: boolean; state?: string; ratePercent?: number; taxShipping?: boolean }
}

export const DEFAULT_DEALER_PROFILE = 'roanoke-golf-cars'

/** Loads the profile named by DEALER_PROFILE (default: roanoke-golf-cars). */
export function loadDealerProfile(name = process.env.DEALER_PROFILE || DEFAULT_DEALER_PROFILE): DealerProfile {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(`DEALER_PROFILE must be a file name in dealers/ without .json, got "${name}"`)
  }
  const file = path.resolve(process.cwd(), 'dealers', `${name}.json`)
  const profile = JSON.parse(readFileSync(file, 'utf8')) as DealerProfile
  for (const key of ['siteName', 'legalName', 'phone', 'leadEmail'] as const) {
    if (!profile[key]) throw new Error(`dealers/${name}.json is missing "${key}"`)
  }
  return profile
}
