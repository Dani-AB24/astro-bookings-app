import { expect, test, type Locator, type Page } from '@playwright/test'
import { bookSeats, createLaunch, TEST_API_URL } from './support/helpers.ts'

// Dates show in the browser's time zone, so fix it to make them predictable.
test.use({ timezoneId: 'UTC' })

const PUBLISHED_SEED_LAUNCHES = ['Lunar Flyby Alpha', 'Orbital Sunrise', 'Mars Transfer Pioneer']
const DRAFT_SEED_LAUNCH = 'Station Resupply Crew'

function launchList(page: Page) {
  return page.getByRole('list', { name: 'Launches' })
}

function launchCard(page: Page, name: string) {
  return launchList(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
}

/** One labelled value on the detail page, such as `Rocket` and its value. */
function launchFact(page: Page, label: string) {
  return page
    .getByRole('main')
    .locator('dl > div')
    .filter({ has: page.getByRole('term').getByText(label, { exact: true }) })
    .getByRole('definition')
}

async function openLaunchList(page: Page) {
  await page.goto('/')
  await expect(launchCard(page, PUBLISHED_SEED_LAUNCHES[0])).toBeVisible()
}

test.describe('Launch list', () => {
  test('an anonymous visitor sees the published seed launches with their details, and no draft', async ({
    page,
  }) => {
    await openLaunchList(page)

    const lunar = launchCard(page, 'Lunar Flyby Alpha')
    await expect(lunar).toContainText('Aurora Heavy')
    await expect(lunar).toContainText('$249,999.00')
    await expect(lunar).toContainText('Mar 15, 2027, 2:00 PM UTC')
    await expect(lunar).toContainText('Cape Meridian Spaceport')
    await expect(lunar).toContainText(/\d+ seats? available/)

    for (const name of PUBLISHED_SEED_LAUNCHES) {
      await expect(launchCard(page, name)).toBeVisible()
    }
    await expect(page.getByRole('heading', { name: DRAFT_SEED_LAUNCH })).toHaveCount(0)
  })

  test('launches are listed soonest first', async ({ page }) => {
    await openLaunchList(page)

    const listedNames = await launchList(page).getByRole('listitem').getByRole('heading').allTextContents()
    const seedOrder = listedNames.filter((name) => PUBLISHED_SEED_LAUNCHES.includes(name))
    expect(seedOrder).toEqual(PUBLISHED_SEED_LAUNCHES)
  })

  test('selecting a launch opens its detail page', async ({ page }) => {
    await openLaunchList(page)

    await launchCard(page, 'Orbital Sunrise').getByRole('link', { name: 'Orbital Sunrise' }).click()

    await expect(page).toHaveURL('/launches/launch-2')
  })
})

test.describe('Finished launches hidden from the list', () => {
  test('a cancelled launch does not appear, while a published one does', async ({ page, request }) => {
    const published = await createLaunch(request)
    const cancelled = await createLaunch(request, { status: 'cancelled' })

    await openLaunchList(page)

    await expect(launchCard(page, published.name)).toBeVisible()
    await expect(page.getByRole('heading', { name: cancelled.name })).toHaveCount(0)
  })
})

test.describe('Launch detail', () => {
  test('an existing launch shows its details, with the duration in readable units', async ({ page }) => {
    await page.goto('/launches/launch-1')

    await expect(page.getByRole('heading', { level: 1, name: 'Lunar Flyby Alpha' })).toBeVisible()
    await expect(launchFact(page, 'Rocket')).toHaveText('Aurora Heavy')
    await expect(launchFact(page, 'Price per seat')).toHaveText('$249,999.00')
    await expect(launchFact(page, 'Date')).toHaveText('Mar 15, 2027, 2:00 PM UTC')
    await expect(launchFact(page, 'Duration')).toHaveText('7 days')
    await expect(launchFact(page, 'Launch site')).toHaveText('Cape Meridian Spaceport')
    await expect(launchFact(page, 'Status')).toHaveText('Published')
    await expect(launchFact(page, 'Available seats')).toHaveText(/^\d+$/)
    await expect(launchFact(page, 'Total seats')).toHaveText('6')
  })

  test('durations combine units where needed', async ({ page }) => {
    await page.goto('/launches/launch-3')

    await expect(launchFact(page, 'Duration')).toHaveText('182 days and 12 hours')
  })

  test('an unknown launch says it was not found and links to the launch list', async ({ page }) => {
    await page.goto('/launches/does-not-exist')

    await expect(page.getByRole('heading', { name: 'Launch not found' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Back to the launch list' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  test('a cancelled launch opened by its address shows the launch with its status', async ({ page, request }) => {
    const cancelled = await createLaunch(request, { status: 'cancelled' })

    await page.goto(`/launches/${cancelled.id}`)

    await expect(page.getByRole('heading', { level: 1, name: cancelled.name })).toBeVisible()
    await expect(launchFact(page, 'Status')).toHaveText('Cancelled')
  })
})

test.describe('Launch availability', () => {
  const FULL_MARKER = 'Full'
  const NOT_OPEN_MARKER = 'Not open for booking'

  function marker(scope: Locator, text: string) {
    return scope.getByText(text, { exact: true })
  }

  test('a published launch with seats shows how many are available, and no marker', async ({ page, request }) => {
    const launch = await createLaunch(request, { totalSeats: 4 })

    await openLaunchList(page)
    const card = launchCard(page, launch.name)
    await expect(card).toContainText('4 seats available')
    await expect(marker(card, FULL_MARKER)).toHaveCount(0)
    await expect(marker(card, NOT_OPEN_MARKER)).toHaveCount(0)

    await page.goto(`/launches/${launch.id}`)
    const main = page.getByRole('main')
    await expect(launchFact(page, 'Available seats')).toHaveText('4')
    await expect(marker(main, FULL_MARKER)).toHaveCount(0)
    await expect(marker(main, NOT_OPEN_MARKER)).toHaveCount(0)
  })

  test('a full launch whose status is still published is marked as full', async ({ page, request }) => {
    const launch = await createLaunch(request, { totalSeats: 2 })
    await bookSeats(request, launch.id, 2)

    await openLaunchList(page)
    await expect(marker(launchCard(page, launch.name), FULL_MARKER)).toBeVisible()

    await page.goto(`/launches/${launch.id}`)
    await expect(launchFact(page, 'Status')).toHaveText('Published')
    await expect(marker(page.getByRole('main'), FULL_MARKER)).toBeVisible()
  })

  test('a confirmed launch with seats is marked as not open for booking', async ({ page, request }) => {
    const launch = await createLaunch(request, { status: 'confirmed' })

    await openLaunchList(page)
    const card = launchCard(page, launch.name)
    await expect(marker(card, NOT_OPEN_MARKER)).toBeVisible()
    await expect(marker(card, FULL_MARKER)).toHaveCount(0)

    await page.goto(`/launches/${launch.id}`)
    await expect(marker(page.getByRole('main'), NOT_OPEN_MARKER)).toBeVisible()
  })
})

test.describe('Launch page states', () => {
  // The query client retries server errors twice with backoff before showing an error.
  const ERROR_TIMEOUT = 10_000
  const LOAD_ERROR = 'could not be loaded'

  // Match on the API origin too, so page navigations to /launches/:id are not intercepted.
  function isLaunchListRequest(url: URL) {
    return url.origin === TEST_API_URL && url.pathname === '/launches'
  }

  function isLaunchDetailRequest(url: URL) {
    return url.origin === TEST_API_URL && url.pathname.startsWith('/launches/')
  }

  async function failRequests(page: Page, matches: (url: URL) => boolean) {
    await page.route(matches, (route) =>
      route.fulfill({ status: 500, json: { message: 'Failed to retrieve launches', errors: [] } }),
    )
  }

  test('the list shows a loading state while waiting for launches', async ({ page }) => {
    let releaseResponse = () => {}
    const responseHeld = new Promise<void>((resolve) => (releaseResponse = resolve))
    await page.route(isLaunchListRequest, async (route) => {
      await responseHeld
      await route.continue()
    })

    await page.goto('/')

    await expect(page.getByRole('status')).toHaveText('Loading launches…')
    releaseResponse()
    await expect(launchCard(page, PUBLISHED_SEED_LAUNCHES[0])).toBeVisible()
    await expect(page.getByText('Loading launches…')).toHaveCount(0)
  })

  test('a failed list request shows an error and a retry control', async ({ page }) => {
    await failRequests(page, isLaunchListRequest)

    await page.goto('/')

    await expect(page.getByRole('main').getByRole('alert')).toContainText(LOAD_ERROR, { timeout: ERROR_TIMEOUT })
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('retrying after the request succeeds shows the launches', async ({ page }) => {
    await failRequests(page, isLaunchListRequest)
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible({ timeout: ERROR_TIMEOUT })

    await page.unroute(isLaunchListRequest)
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(launchCard(page, PUBLISHED_SEED_LAUNCHES[0])).toBeVisible()
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  })

  test('when there are no launches to show, the page says so', async ({ page }) => {
    await page.route(isLaunchListRequest, (route) => route.fulfill({ status: 200, json: [] }))

    await page.goto('/')

    await expect(page.getByText('There are no launches available right now.')).toBeVisible()
    await expect(launchList(page)).toHaveCount(0)
  })

  test('the detail page shows a loading state, then an error with a retry that recovers', async ({ page }) => {
    await failRequests(page, isLaunchDetailRequest)

    await page.goto('/launches/launch-1')

    await expect(page.getByRole('status')).toHaveText('Loading launch…')
    await expect(page.getByRole('main').getByRole('alert')).toContainText(LOAD_ERROR, { timeout: ERROR_TIMEOUT })

    await page.unroute(isLaunchDetailRequest)
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Lunar Flyby Alpha' })).toBeVisible()
  })
})
