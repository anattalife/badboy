import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Public site', () => {
  test('home page shows the dealer and the acreage helper', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/Roanoke Mowers/)
    await expect(page.locator('h1')).toHaveText('Bad Boy equipment for the Roanoke Valley')
    // Dealer colors from Dealership info are applied as CSS variables.
    await expect(page.locator('body')).toHaveCSS('--color-signal', '#e8641b')

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
    await expect(page.getByRole('main').getByRole('link', { name: 'Get a quote', exact: true })).toHaveAttribute(
      'href',
      /\/contact\?model=rogue/,
    )
  })

  test('a model under the wrong category is a 404', async ({ page }) => {
    const response = await page.goto(`${BASE}/equipment/tractors/rogue`)
    expect(response?.status()).toBe(404)
  })

  test('model pages show the Bad Boy photo gallery', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment/zero-turn-mowers/rogue')
    const main = page.locator('img[alt^="Bad Boy Rogue zero-turn mower"]').first()
    await expect(main).toBeVisible()
    await page.getByRole('button', { name: /Show photo 7/ }).click()
    await expect(page.getByRole('img', { name: 'Bad Boy Rogue zero-turn mower, rear view' })).toBeVisible()
  })

  test('a set-up site shows the dealer and Bad Boy logos and locks the setup wizard', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page.getByRole('img', { name: 'Bad Boy Mowers' }).first()).toBeVisible()
    await expect(page.getByText('Authorized dealer').first()).toBeVisible()
    await page.goto('http://localhost:3000/setup')
    await expect(page.getByRole('heading', { name: 'This website is already set up' })).toBeVisible()
    await page.goto('http://localhost:3000/admin/create-first-user')
    await expect(page).toHaveURL(/\/setup$/)
  })

  test('model pages offer a quote on a specific build', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment/zero-turn-mowers/rogue')
    await page.getByLabel('Build your Rogue').selectOption({ index: 1 })
    await page.getByRole('link', { name: 'Get a quote on this build' }).click()
    await expect(page.getByText(/Bad Boy Rogue 61" Kawasaki FX1000 35HP \(BRG61/)).toBeVisible()
  })
})
