import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'e2e-admin@roanokemowers.test',
  password: 'e2e-test-password',
  name: 'E2E Admin',
  roles: ['admin'] as ('admin' | 'sales')[],
}

/**
 * The dev server and the test process open the same local SQLite file, so a write can briefly
 * hit "database is locked". Retry a few times instead of failing the run.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (err) {
      const busy = /SQLITE_BUSY|database is locked|internal error/i.test(String((err as Error)?.stack ?? err))
      if (!busy || i >= attempts) throw err
      await new Promise((r) => setTimeout(r, 500 * i))
    }
  }
}

/** Seeds an admin user for e2e admin tests. */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  await withRetry(() => payload.delete({ collection: 'users', where: { email: { equals: testUser.email } } }))
  await withRetry(() => payload.create({ collection: 'users', data: testUser }))
}

/** Cleans up the test user after tests. */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  await withRetry(() => payload.delete({ collection: 'users', where: { email: { equals: testUser.email } } }))
}
