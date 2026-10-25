import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Public site', () => {
  test('home page shows the dealer and the acreage helper', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/Roanoke Mowers/)
    await expect(page.locator('h1')).toHaveText('Bad Boy equipment for the Roanoke Valley')

    await page.getByRole('button', { name: '1–3 acres' }).click()
    await expect(page.getByRole('link', { name: /^ZT Elite 48/ })).toBeVisible()
  })

  test('category page lists models', async ({ page }) => {
    await page.goto(`${BASE}/equipment/zero-turn-mowers`)
    await expect(page.locator('h1')).toHaveText('Bad Boy Zero-Turn Mowers')
    await expect(page.getByRole('link', { name: 'Rogue', exact: true })).toBeVisible()
  })

  test('model page shows specs and a quote link', async ({ page }) => {
    await page.goto(`${BASE}/equipment/zero-turn-mowers/rogue`)
    await expect(page.locator('h1')).toHaveText('Rogue')
    await expect(page.getByRole('heading', { name: 'Specifications' })).toBeVisible()
    await expect(page.getByRole('rowheader', { name: 'Cutting Widths' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Get a quote' })).toHaveAttribute(
      'href',
      /\/contact\?model=rogue/,
    )
  })

  test('a model under the wrong category is a 404', async ({ page }) => {
    const response = await page.goto(`${BASE}/equipment/tractors/rogue`)
    expect(response?.status()).toBe(404)
  })
})
