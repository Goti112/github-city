import { expect, test } from '@playwright/test'
import { mockGithub } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockGithub(page)
})

test('searching a user from the home page builds their city', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('Escribe un usuario de GitHub').fill('  ana ')
  await page.getByRole('button', { name: /crear ciudad/i }).click()

  await expect(page).toHaveURL(/\/ciudad\/ana$/)
  await expect(page.getByRole('heading', { name: 'Ana Dev' })).toBeVisible()
  await expect(page.getByText('GitHub City · Pueblo')).toBeVisible()
  await expect(page.getByText('2026 · 6 de 6 edificios')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
})

test('the building finder opens a repository and puts it in the URL', async ({ page }) => {
  await page.goto('/ciudad/ana')
  await page.getByRole('button', { name: /buscar un edificio/i }).click()
  await page.getByRole('combobox').fill('tienda')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'tienda-api' })).toBeVisible()
  await expect(page).toHaveURL(/repo=tienda-api/)

  await page.getByRole('button', { name: 'Cerrar panel del repositorio' }).click()
  await expect(page).not.toHaveURL(/repo=/)
})

test('a shared link restores the building and the year', async ({ page }) => {
  await page.goto('/ciudad/ana?repo=portfolio&year=2021')

  await expect(page.getByRole('heading', { name: 'portfolio' })).toBeVisible()
  await expect(page.getByText('2021 · 3 de 6 edificios')).toBeVisible()
})

test('the history slider rebuilds the city year by year', async ({ page }) => {
  await page.goto('/ciudad/ana')
  await page.getByRole('slider', { name: 'Año' }).fill('2020')
  await expect(page.getByText('2020 · 2 de 6 edificios')).toBeVisible()
})

test('a city duel shows the scoreboard and the winner', async ({ page }) => {
  await page.goto('/vs/ana/bea')

  await expect(page.getByText('Duelo de ciudades')).toBeVisible()
  await expect(page.getByText('Gana @ana')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ana Dev/ })).toBeVisible()
})

test('an unknown user gets a helpful not-found page', async ({ page }) => {
  await page.goto('/ciudad/nadie-xyz')
  await expect(page.getByRole('heading', { name: /no existe/ })).toBeVisible()
  await expect(page.getByPlaceholder('Escribe un usuario de GitHub')).toBeVisible()
})

test('the city loads without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/ciudad/ana')
  await expect(page.getByRole('heading', { name: 'Ana Dev' })).toBeVisible()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})
