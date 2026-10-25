import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'e2e-admin@roanokemowers.test',
  password: 'e2e-test-password',
  name: 'E2E Admin',
  roles: ['admin'] as ('admin' | 'sales')[],
}

/** Seeds an admin user for e2e admin tests. */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'users', where: { email: { equals: testUser.email } } })
  await payload.create({ collection: 'users', data: testUser })
}

/** Cleans up the test user after tests. */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'users', where: { email: { equals: testUser.email } } })
}
