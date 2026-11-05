import { expect, test, type Page } from '@playwright/test'

const UNKNOWN_PATH = '/does-not-exist'

function brandLink(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: 'AstroBookings' })
}

test.describe('Shared layout', () => {
  test('the home page shows the AstroBookings name', async ({ page }) => {
    await page.goto('/')

    await expect(brandLink(page)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome to AstroBookings' })).toBeVisible()
  })

  test('selecting the AstroBookings name returns to the home page', async ({ page }) => {
    await page.goto(UNKNOWN_PATH)

    await brandLink(page).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Welcome to AstroBookings' })).toBeVisible()
  })
})

test.describe('Unknown pages', () => {
  test('an unknown address shows a not-found page inside the layout', async ({ page }) => {
    await page.goto(UNKNOWN_PATH)

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(brandLink(page)).toBeVisible()
    const homeLink = page.getByRole('main').getByRole('link', { name: 'Back to the home page' })
    await expect(homeLink).toHaveAttribute('href', '/')
  })
})

test.describe('API availability notice', () => {
  const TEST_API_HEALTH_URL = 'http://localhost:3100/health'
  const NOTICE_TEXT = 'The AstroBookings service cannot be reached'

  test('no notice is shown when the API responds 200', async ({ page }) => {
    const healthResponse = page.waitForResponse(TEST_API_HEALTH_URL)

    await page.goto('/')

    expect((await healthResponse).status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Welcome to AstroBookings' })).toBeVisible()
    await expect(page.getByText(NOTICE_TEXT)).toHaveCount(0)
  })

  test('a notice is shown when the API cannot be reached, and the page still renders', async ({ page }) => {
    await page.route('**/health', (route) => route.abort('connectionrefused'))

    await page.goto('/')

    await expect(page.getByRole('alert')).toContainText(NOTICE_TEXT)
    await expect(brandLink(page)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Welcome to AstroBookings' })).toBeVisible()
  })

  test('the notice is also shown on other pages', async ({ page }) => {
    await page.route('**/health', (route) => route.abort('connectionrefused'))

    await page.goto(UNKNOWN_PATH)

    await expect(page.getByRole('alert')).toContainText(NOTICE_TEXT)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
