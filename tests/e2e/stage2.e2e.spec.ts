import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Inventory', () => {
  test('lists sample units and filters by condition', async ({ page }) => {
    await page.goto(`${BASE}/inventory`)
    await expect(page.locator('h1')).toHaveText('In stock')
    await expect(page.getByRole('link', { name: /Rogue/ }).first()).toBeVisible()

    await page.getByLabel('Condition').selectOption('used')
    await page.getByRole('button', { name: 'Show results' }).click()
    await expect(page).toHaveURL(/condition=used/)
    await expect(page.getByText(/match your filters/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Maverick HD/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Rogue/ })).toHaveCount(0)
  })

  test('unit page shows price, stock number and a link back to model specs', async ({ page }) => {
    await page.goto(`${BASE}/inventory?condition=used&sort=price-asc`)
    await page.getByRole('link', { name: /Maverick HD/ }).first().click()
    await expect(page.locator('h1')).toContainText('Maverick HD')
    await expect(page.getByText('$7,450')).toBeVisible()
    await expect(page.getByText('DEMO-1006').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /All Maverick HD specs/ })).toBeVisible()
  })

  test('model page shows units in stock', async ({ page }) => {
    await page.goto(`${BASE}/equipment/zero-turn-mowers/rogue`)
    await expect(page.getByRole('heading', { name: 'Rogue units on our lot' })).toBeVisible()
    await expect(page.getByText('Model BRG61385KA', { exact: false })).toBeVisible()
  })
})

test.describe('Compare', () => {
  test('shared link lines models up side by side', async ({ page }) => {
    await page.goto(`${BASE}/compare?models=rogue,rebel`)
    await expect(page.getByRole('columnheader', { name: /Rogue/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Rebel/ })).toBeVisible()
    await expect(page.getByRole('rowheader', { name: /Cutting Widths/ })).toBeVisible()
  })

  test('picking models with the compare buttons', async ({ page }) => {
    await page.goto(`${BASE}/equipment/zero-turn-mowers`)
    await page.getByRole('button', { name: 'Compare Maverick', exact: true }).click()
    await page.getByRole('button', { name: 'Compare ZT Elite', exact: true }).click()
    await page.getByRole('link', { name: 'Compare now' }).click()
    await expect(page).toHaveURL(/\/compare\?models=maverick,zt-elite/)

    await page.getByLabel('Add another model').selectOption('mz-magnum')
    await page.getByRole('button', { name: 'Add to comparison' }).click()
    await expect(page).toHaveURL(/models=maverick,zt-elite,mz-magnum/)
  })
})
