/**
 * Adds newly prepared photos to a running site without re-running the whole seed:
 *   pnpm payload run src/seed/add-photos.ts gas-chainsaw gas-edger ...
 * Against the live site (from a machine signed in to Cloudflare):
 *   NODE_ENV=production pnpm payload run src/seed/add-photos.ts <targets...>
 * Only models/parts that still have no photos of their own are changed (see seedPhotos).
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { seedPhotos } from './photos'

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-') && !a.endsWith('.ts'))
if (!targets.length) throw new Error('Name the models or parts to add photos for.')

const payload = await getPayload({ config })
const { attached, skipped } = await seedPhotos(payload, targets)
payload.logger.info(`[photos] ${attached} photos attached${skipped.length ? `; skipped: ${skipped.join(', ')}` : ''}`)
process.exit(0)
