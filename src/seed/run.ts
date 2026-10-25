/**
 * Seeds the local database with dealership info and the Bad Boy catalog.
 * Run with: pnpm seed
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { seed } from './seed'

const payload = await getPayload({ config })
try {
  await seed(payload)
  payload.logger.info('[seed] Done')
  process.exit(0)
} catch (error) {
  payload.logger.error(error)
  process.exit(1)
}
