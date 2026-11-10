/**
 * Creates any starting pages a running site doesn't have yet (never touches edited pages):
 *   bash scripts/on-live.sh src/seed/add-pages.ts
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { seedPages } from './pages'

const payload = await getPayload({ config })
const { created } = await seedPages(payload)
payload.logger.info(`[pages] ${created.length ? `created: ${created.join(', ')}` : 'nothing to add'}`)
process.exit(0)
