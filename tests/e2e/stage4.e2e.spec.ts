import { expect, type Page, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

async function waitForTurnstile(page: Page) {
  if (await page.locator('.cf-turnstile').count()) {
    await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: 20_000 })
  }
}

test.describe('Parts store', () => {
  test('search, filter by machine, and part page', async ({ page }) => {
    await page.goto(`${BASE}/parts?model=revolt`)
    await expect(page.locator('h1')).toHaveText('Parts and accessories')
    await expect(page.getByText(/\d+ parts? found/)).toBeVisible()

    await page.getByLabel('Search by name or part number').fill('088-4020-00')
    await page.getByLabel('Fits my machine').selectOption('')
    await page.getByRole('button', { name: 'Find parts' }).click()
    await page.getByRole('link', { name: /Front Basket/ }).first().click()
    await expect(page.getByText('Part number 088-4020-00')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Bad Boy Rogue' })).toBeVisible()
  })

  test('add to cart, get shipping rates, place a test order', async ({ page }) => {
    await page.goto(`${BASE}/parts?q=Front Basket`)
    await page.getByRole('button', { name: /Add to cart Front Basket/ }).first().click()
    await expect(page.getByRole('link', { name: /Cart\s*1/ })).toBeVisible()

    await page.goto(`${BASE}/cart`)
    await expect(page.getByRole('main').getByText('Front Basket', { exact: true }).first()).toBeVisible()
    await page.getByLabel(/Quantity for Front Basket/).fill('2')
    await expect(page.getByText('$149.98').first()).toBeVisible()
    await page.getByRole('link', { name: 'Check out' }).click()

    await page.getByLabel('Full name').fill('Pat Tester')
    await page.getByLabel('Email').fill('pat@example.com')
    await page.getByLabel('Street address').fill('100 Test Rd')
    await page.getByLabel('City').fill('Raleigh')
    await page.getByLabel('State').fill('NC')
    await page.getByLabel('ZIP').fill('27601')
    await page.getByRole('button', { name: 'See shipping options' }).first().click()

    await expect(page.getByRole('radio', { name: /UPS Ground/ })).toBeChecked()
    // North Carolina address: no Virginia sales tax.
    await expect(page.getByText('Sales tax').locator('..').getByText('$0.00')).toBeVisible()
    await page.getByRole('radio', { name: /UPS 2nd Day Air/ }).check()

    await page.waitForTimeout(2500)
    await waitForTurnstile(page)
    await page.getByRole('button', { name: /Place order/ }).click()
    await expect(page).toHaveURL(/\/order\/RM-\d{6}-[A-Z0-9]{5}\?t=/, { timeout: 30_000 })
    await expect(page.locator('h1')).toHaveText('Thank you for your order')
    await expect(page.getByText('UPS 2nd Day Air')).toBeVisible()
    await expect(page.getByRole('link', { name: /Cart\s*\d/ })).toHaveCount(0)
  })

  test('Virginia orders get sales tax, and changing the address clears old rates', async ({ page }) => {
    await page.goto(`${BASE}/parts?q=Front Basket`)
    await page.getByRole('button', { name: /Add to cart Front Basket/ }).first().click()
    await page.goto(`${BASE}/checkout`)
    await page.getByLabel('Full name').fill('Pat Tester')
    await page.getByLabel('Email').fill('pat@example.com')
    await page.getByLabel('Street address').fill('1 Market Sq')
    await page.getByLabel('City').fill('Roanoke')
    await page.getByLabel('State').fill('VA')
    await page.getByLabel('ZIP').fill('24011')
    await page.getByRole('button', { name: 'See shipping options' }).first().click()
    await expect(page.getByText('Sales tax (5.3%)')).toBeVisible()
    await expect(page.getByText('$3.97')).toBeVisible() // 5.3% of $74.99

    await page.getByLabel('ZIP').fill('24012')
    await expect(page.getByRole('radio', { name: /UPS Ground/ })).toHaveCount(0)
  })

  test('order links need the secret token', async ({ page }) => {
    const res = await page.goto(`${BASE}/order/RM-000000-AAAAA?t=wrong-token-wrong-token-wrong`)
    expect(res?.status()).toBe(404)
  })
})
