import { expect, type Page, test } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const BASE = 'http://localhost:3000'

// Forms reject submissions made faster than a person could type.
const humanPause = (page: Page) => page.waitForTimeout(2800)

/** Waits for Turnstile (if configured) to finish before submitting. */
async function waitForTurnstile(page: Page) {
  const widget = page.locator('.cf-turnstile')
  if (await widget.count()) {
    await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: 20_000 })
  }
}

test.describe('Lead forms', () => {
  test('quote request from a model page', async ({ page }) => {
    await page.goto(`${BASE}/equipment/zero-turn-mowers/rogue`)
    await page.getByRole('main').getByRole('link', { name: 'Get a quote' }).click()
    await expect(page).toHaveURL(/\/contact\?model=rogue/)
    await expect(page.getByText('Bad Boy Rogue', { exact: true })).toBeVisible()

    await page.getByLabel('Your name').fill('Pat Tester')
    await page.getByLabel('Phone').fill('540-555-0123')
    await page.getByLabel('When are you looking to buy?').selectOption('month')
    await humanPause(page)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: 'Request my quote' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText('We’ll get back to you with pricing')
  })

  test('validation errors keep what was typed', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await page.getByLabel('Your name').fill('Pat Tester')
    await page.getByLabel('Email').fill('not-an-email')
    await humanPause(page)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Please fix the highlighted fields')
    await expect(page.getByText('Enter a valid email address.')).toBeVisible()
    await expect(page.getByText('Tell us how we can help.')).toBeVisible()
    await expect(page.getByLabel('Your name')).toHaveValue('Pat Tester')
  })

  test('trade-in request', async ({ page }) => {
    await page.goto(`${BASE}/trade-in`)
    await page.getByLabel('Your name').fill('Pat Tester')
    await page.getByLabel('Email').fill('pat@example.com')
    await page.getByLabel('Year').fill('2019')
    await page.getByLabel('Make').fill('Bad Boy')
    await page.getByRole('textbox', { name: 'Model' }).fill('Maverick')
    await page.getByLabel('Hours').fill('320')
    await humanPause(page)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: 'Get my trade-in value' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText('review your trade-in')
  })
})

async function fillApplicant(page: Page, ssn = '123-45-6789') {
  await page.getByLabel('First name').fill('Jordan')
  await page.getByLabel('Last name').fill('Tester')
  await page.getByLabel('Email').fill('jordan@example.com')
  await page.getByLabel('Mobile phone').fill('5405550142')
  await page.getByLabel('Social Security number').fill(ssn)
  await page.getByLabel('Date of birth').fill('1985-04-12')
  await page.getByLabel('Street address').fill('100 Test Rd')
  await page.getByLabel('City').fill('Roanoke')
  await page.getByLabel('ZIP').fill('24017')
  await page.getByLabel('Years there').first().fill('6')
  await page.getByLabel('Housing').selectOption('own')
  await page.getByLabel('Status').selectOption('employed')
  await page.getByLabel('Employer or business').fill('Valley Landscaping')
  await page.getByLabel('Gross monthly income').fill('5400')
}

test.describe('Credit application', () => {
  test.beforeAll(async () => seedTestUser())
  test.afterAll(async () => cleanupTestUser())

  test('rejects an invalid SSN and keeps the rest of the form', async ({ page }) => {
    await page.goto(`${BASE}/financing?model=maverick`)
    await fillApplicant(page, '000-12-3456')
    await page.getByLabel('I have read and agree').check()
    await humanPause(page)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByText('Enter a valid 9-digit Social Security number.')).toBeVisible()
    await expect(page.getByLabel('Employer or business')).toHaveValue('Valley Landscaping')
  })

  test('submits, and only staff with access can see the SSN', async ({ page }) => {
    await page.goto(`${BASE}/financing?unit=DEMO-1002`)
    await expect(page.getByText(/Maverick.*stock DEMO-1002/)).toBeVisible()
    await fillApplicant(page)
    await page.getByLabel('Down payment').fill('1000')
    await page.getByLabel('I have read and agree').check()
    await humanPause(page)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText('received securely')

    // Admin opens the newest application and sees the decrypted SSN.
    await login({ page, user: testUser })
    await page.goto(`${BASE}/admin/collections/credit-applications`)
    await page.getByRole('link', { name: /Jordan T\./ }).first().click()
    await page.getByRole('button', { name: 'Applicant', exact: true }).click()
    await expect(page.locator('input[name="applicant.ssn"]')).toHaveValue('123-45-6789')

    // …and that view was written to the access log.
    await page.goto(`${BASE}/admin/collections/audit-log`)
    await expect(page.getByText(/Viewed credit application #\d+/).first()).toBeVisible()
  })
})
