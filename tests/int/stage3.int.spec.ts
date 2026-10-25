import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { decrypt, encrypt, isEncrypted, mask } from '@/lib/crypto'
import { ageFrom, isPhone, isSsn, money } from '@/lib/forms'
import { purgeExpiredApplications } from '@/collections/CreditApplications'
import type { User } from '@/payload-types'

describe('Field encryption', () => {
  it('round-trips and never stores plain text', async () => {
    const stored = await encrypt('123-45-6789')
    expect(isEncrypted(stored)).toBe(true)
    expect(stored).not.toContain('6789')
    expect(await decrypt(stored)).toBe('123-45-6789')
  })

  it('uses a fresh IV each time', async () => {
    expect(await encrypt('same')).not.toBe(await encrypt('same'))
  })

  it('rejects tampered data', async () => {
    const stored = await encrypt('secret')
    const tampered = stored.slice(0, -4) + (stored.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    await expect(decrypt(tampered)).rejects.toThrow()
  })

  it('masks to the last four digits at most', () => {
    expect(mask('123-45-6789')).toBe('•••-••-6789')
    expect(mask('1980-01-31', 'date')).toBe('••/••/••••')
    expect(mask('5200', 'money')).toBe('$•••••')
  })
})

describe('Form validation helpers', () => {
  it('validates SSNs', () => {
    expect(isSsn('123-45-6789')).toBe(true)
    expect(isSsn('000-12-3456')).toBe(false)
    expect(isSsn('666-12-3456')).toBe(false)
    expect(isSsn('123-00-6789')).toBe(false)
    expect(isSsn('12345678')).toBe(false)
  })
  it('validates phones, money and ages', () => {
    expect(isPhone('(540) 986-0098')).toBe(true)
    expect(isPhone('986-0098')).toBe(false)
    expect(money('$4,250.50')).toBe(4250.5)
    expect(money('abc')).toBeNull()
    expect(ageFrom('2000-02-30')).toBeNull()
    expect(ageFrom('2000-06-15', new Date(2026, 5, 14))).toBe(25)
    expect(ageFrom('2000-06-15', new Date(2026, 5, 15))).toBe(26)
  })
})

let payload: Payload
const cleanup: { collection: 'users' | 'credit-applications' | 'leads'; id: number }[] = []

const user = async (roles: ('admin' | 'finance' | 'sales')[]) => {
  const u = await payload.create({
    collection: 'users',
    data: { name: `T ${roles.join()}`, email: `${roles.join('-')}-${Date.now()}-${Math.random()}@roanokemowers.test`, password: 'test-password-123', roles },
  })
  cleanup.push({ collection: 'users', id: u.id })
  return u
}

const application = async () => {
  const app = await payload.create({
    collection: 'credit-applications',
    overrideAccess: true,
    context: { maskSensitive: true },
    data: {
      status: 'new',
      summary: 'Test A. · Rogue',
      equipmentDescription: 'Test mower',
      applicant: {
        firstName: 'Test',
        lastName: 'Applicant',
        email: 'applicant@example.com',
        phone: '5405550100',
        ssn: '123-45-6789',
        dateOfBirth: '1980-01-31',
        monthlyIncome: '5200',
        address: { street: '1 Main St', city: 'Roanoke', state: 'VA', zip: '24017', housing: 'own' },
        employment: { status: 'employed', employer: 'Acme' },
      },
      coApplicant: [
        {
          firstName: 'Co',
          lastName: 'Applicant',
          email: 'co@example.com',
          phone: '5405550101',
          ssn: '234-56-7890',
          dateOfBirth: '1982-03-04',
          monthlyIncome: '3100',
          address: { street: '1 Main St', city: 'Roanoke', state: 'VA', zip: '24017', housing: 'own' },
          employment: { status: 'employed', employer: 'Acme' },
        },
      ],
      consent: { agreedAt: new Date().toISOString(), text: 'test consent', ip: '127.0.0.1', userAgent: 'vitest' },
    },
  })
  cleanup.push({ collection: 'credit-applications', id: app.id })
  return app
}

describe('Credit applications', () => {
  let finance: User
  let sales: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const { totalDocs } = await payload.count({ collection: 'users' })
    if (totalDocs === 0) await user(['admin']) // first account becomes admin automatically
    finance = await user(['finance'])
    sales = await user(['sales'])
  })

  afterAll(async () => {
    for (const { collection, id } of cleanup.reverse()) {
      await payload.delete({ collection, id, overrideAccess: true, context: { maskSensitive: true } }).catch((): void => undefined)
    }
  })

  it('stores SSN, date of birth and income encrypted in the database', async () => {
    const app = await application()
    const raw = (await payload.db.findOne({
      collection: 'credit-applications',
      where: { id: { equals: app.id } },
    })) as unknown as { applicant: Record<string, string> }
    expect(isEncrypted(raw.applicant.ssn)).toBe(true)
    expect(isEncrypted(raw.applicant.dateOfBirth)).toBe(true)
    expect(isEncrypted(raw.applicant.monthlyIncome)).toBe(true)
    expect(JSON.stringify(raw)).not.toContain('6789')
  })

  it('shows Finance the real values on a single application and logs the view', async () => {
    const app = await application()
    const before = await payload.count({ collection: 'audit-log', where: { docId: { equals: String(app.id) } } })
    const doc = await payload.findByID({ collection: 'credit-applications', id: app.id, overrideAccess: false, user: finance })
    expect(doc.applicant.ssn).toBe('123-45-6789')
    expect(doc.applicant.monthlyIncome).toBe('5200')
    const after = await payload.count({ collection: 'audit-log', where: { docId: { equals: String(app.id) } } })
    expect(after.totalDocs).toBe(before.totalDocs + 1)
  })

  it('masks values in lists, even for Finance', async () => {
    const app = await application()
    const { docs } = await payload.find({
      collection: 'credit-applications',
      where: { id: { equals: app.id } },
      overrideAccess: false,
      user: finance,
    })
    expect(docs[0].applicant.ssn).toBe('•••-••-6789')
  })

  it('keeps Sales and the public out entirely', async () => {
    const app = await application()
    await expect(
      payload.findByID({ collection: 'credit-applications', id: app.id, overrideAccess: false, user: sales }),
    ).rejects.toThrow()
    await expect(
      payload.findByID({ collection: 'credit-applications', id: app.id, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('does not overwrite encrypted values when a masked value is saved back', async () => {
    const app = await application()
    await payload.update({
      collection: 'credit-applications',
      id: app.id,
      data: { status: 'reviewing', applicant: { ...app.applicant, ssn: '•••-••-6789' } },
      overrideAccess: false,
      user: finance,
    })
    const doc = await payload.findByID({ collection: 'credit-applications', id: app.id, overrideAccess: false, user: finance })
    expect(doc.applicant.ssn).toBe('123-45-6789')
    expect(doc.coApplicant?.[0]?.ssn).toBe('234-56-7890')
    expect(doc.status).toBe('reviewing')
  })

  it('encrypts the co-applicant and lets Finance edit a fully filled application', async () => {
    const app = await application()
    const raw = (await payload.db.findOne({
      collection: 'credit-applications',
      where: { id: { equals: app.id } },
    })) as unknown as { coApplicant: Record<string, string>[] }
    expect(isEncrypted(raw.coApplicant[0].ssn)).toBe(true)

    const full = await payload.findByID({ collection: 'credit-applications', id: app.id, overrideAccess: false, user: finance })
    const updated = await payload.update({
      collection: 'credit-applications',
      id: app.id,
      data: { ...full, lender: 'Test Lender', staffNotes: [{ note: 'Called applicant' }] },
      overrideAccess: false,
      user: finance,
    })
    expect(updated.lender).toBe('Test Lender')
  })

  it('cannot be created through the public API', async () => {
    await expect(
      payload.create({
        collection: 'credit-applications',
        data: { status: 'new', applicant: { firstName: 'X', lastName: 'Y' } } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('deletes applications older than the retention period', async () => {
    const old = await application()
    const fresh = await application()
    await payload.db.updateOne({
      collection: 'credit-applications',
      id: old.id,
      data: { createdAt: new Date(Date.now() - 400 * 86400000).toISOString() },
    })
    await payload.updateGlobal({ slug: 'site-settings', data: { creditApplicationRetentionDays: 365 } })
    const removed = await purgeExpiredApplications(payload)
    expect(removed).toBeGreaterThanOrEqual(1)
    const ids = (
      await payload.find({ collection: 'credit-applications', where: { id: { in: [old.id, fresh.id] } }, context: { maskSensitive: true } })
    ).docs.map((d) => d.id)
    expect(ids).toEqual([fresh.id])
  })
})

describe('Leads', () => {
  it('cannot be created through the public API', async () => {
    await expect(
      payload.create({
        collection: 'leads',
        data: { type: 'contact', name: 'Spammer' } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('Database limits', () => {
  it('keeps every table small enough to update on Cloudflare D1 (100 parameters per query)', async () => {
    const p = await getPayload({ config: await config })
    const tables = (p.db as unknown as { tables: Record<string, Record<string, unknown>> }).tables
    const tooWide = Object.entries(tables)
      .map(([name, table]) => [name, Object.keys(table).length] as const)
      // An update is an upsert that binds every column twice.
      .filter(([, columns]) => columns * 2 > 100)
    expect(tooWide).toEqual([])
  })
})
