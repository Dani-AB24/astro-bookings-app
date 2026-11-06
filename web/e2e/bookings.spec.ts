import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  bookSeatsAs,
  createLaunch,
  registerUser,
  setLaunchStatus,
  TEST_API_URL,
  type TestUser,
} from './support/helpers.ts'

function main(page: Page) {
  return page.getByRole('main')
}

function banner(page: Page) {
  return page.getByRole('banner')
}

function bookingList(page: Page) {
  return main(page).getByRole('list', { name: 'Bookings' })
}

function bookingItems(page: Page) {
  return bookingList(page).getByRole('listitem')
}

function bookingFor(page: Page, launchName: string) {
  return bookingItems(page).filter({ has: page.getByRole('heading', { name: launchName }) })
}

/** One labelled value on a booking, such as `Seats` and its value. */
function bookingFact(booking: ReturnType<typeof bookingFor>, label: string) {
  return booking
    .locator('dl > div')
    .filter({ has: booking.page().getByRole('term').getByText(label, { exact: true }) })
    .getByRole('definition')
}

/** Clicks near a card's bottom edge, far from its title link. */
async function clickCardAwayFromTitle(card: Locator) {
  const box = await card.boundingBox()
  if (box === null) {
    throw new Error('The card is not visible')
  }
  await card.click({ position: { x: box.width / 2, y: box.height - 8 } })
}

/** Rewrites every booking's payment status in the real `GET /bookings` response. */
async function replacePaymentStatus(page: Page, paymentStatus: string) {
  await page.route(`${TEST_API_URL}/bookings`, async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback()
    }
    const response = await route.fetch()
    const bookings: object[] = await response.json()
    await route.fulfill({ response, json: bookings.map((booking) => ({ ...booking, paymentStatus })) })
  })
}

/** Logs in a new user who has one booking on a new launch, and returns that launch. */
async function logInWithOneBooking(page: Page, request: Parameters<typeof createLaunch>[0]) {
  const launch = await createLaunch(request)
  const user = await registerUser(request)
  await bookSeatsAs(request, user, launch.id, 1)
  await logIn(page, user)
  return launch
}

async function logIn(page: Page, user: TestUser) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(banner(page)).toContainText(user.username)
}

/** Opens `/bookings` through the banner link, as a person would. */
async function openBookings(page: Page) {
  await banner(page).getByRole('link', { name: 'My bookings' }).click()
  await expect(page).toHaveURL('/bookings')
  await expect(main(page).getByRole('heading', { name: 'My bookings', level: 1 })).toBeVisible()
}

test.describe('Booking list', () => {
  test('a person with two bookings sees both with their details, the newest first', async ({ page, request }) => {
    const older = await createLaunch(request)
    const newer = await createLaunch(request)
    const user = await registerUser(request)
    await bookSeatsAs(request, user, older.id, 1)
    await bookSeatsAs(request, user, newer.id, 3)

    await logIn(page, user)
    await openBookings(page)

    await expect(bookingItems(page)).toHaveCount(2)
    await expect(bookingItems(page).nth(0)).toContainText(newer.name)
    await expect(bookingItems(page).nth(1)).toContainText(older.name)

    const booking = bookingFor(page, newer.name)
    await expect(bookingFact(booking, 'Rocket')).toHaveText('Test Rocket')
    await expect(bookingFact(booking, 'Launch date')).toContainText('2099')
    await expect(bookingFact(booking, 'Launch site')).toHaveText('Test Site')
    await expect(bookingFact(booking, 'Seats')).toHaveText('3')
    await expect(bookingFact(booking, 'Booked')).toContainText(String(new Date().getFullYear()))
    await expect(bookingFact(bookingFor(page, older.name), 'Seats')).toHaveText('1')
  })

  test('a booking made through the interface is listed without a page reload', async ({ page, request }) => {
    const launch = await createLaunch(request)
    await logIn(page, await registerUser(request))
    // Visiting first caches the empty list, so the test proves that booking refreshes it.
    await openBookings(page)
    await expect(bookingFor(page, launch.name)).toHaveCount(0)
    await page.evaluate(() => Object.assign(globalThis, { noReloadMarker: true }))

    await banner(page).getByRole('link', { name: 'AstroBookings' }).click()
    await main(page).getByRole('link', { name: launch.name }).click()
    await main(page).getByRole('form', { name: 'Book seats' }).getByLabel('Seats').fill('2')
    await main(page).getByRole('button', { name: /^Book / }).click()
    await main(page).getByRole('link', { name: 'View my bookings' }).click()

    await expect(page).toHaveURL('/bookings')
    await expect(bookingFact(bookingFor(page, launch.name), 'Seats')).toHaveText('2')
    expect(await page.evaluate(() => 'noReloadMarker' in globalThis)).toBe(true)
  })

  test('selecting the launch of a booking opens its detail page', async ({ page, request }) => {
    const launch = await createLaunch(request)
    const user = await registerUser(request)
    await bookSeatsAs(request, user, launch.id, 1)
    await logIn(page, user)
    await openBookings(page)

    await bookingFor(page, launch.name).getByRole('link', { name: launch.name }).click()

    await expect(page).toHaveURL(`/launches/${launch.id}`)
    await expect(main(page).getByRole('heading', { name: launch.name, level: 1 })).toBeVisible()
  })

  test('selecting a booking anywhere on its card opens its launch', async ({ page, request }) => {
    const launch = await logInWithOneBooking(page, request)
    await openBookings(page)

    await clickCardAwayFromTitle(bookingFor(page, launch.name))

    await expect(page).toHaveURL(`/launches/${launch.id}`)
  })
})

test.describe('Own bookings only', () => {
  test('after one person logs out, the next person in the same browser does not see their bookings', async ({
    page,
    request,
  }) => {
    const launch = await createLaunch(request)
    const first = await registerUser(request)
    const second = await registerUser(request)
    await bookSeatsAs(request, first, launch.id, 1)
    await logIn(page, first)
    await openBookings(page)
    await expect(bookingFor(page, launch.name)).toHaveCount(1)

    await banner(page).getByRole('button', { name: 'Log out' }).click()
    await logIn(page, second)
    await openBookings(page)

    await expect(main(page)).toContainText('You have no bookings yet.')
    await expect(main(page)).not.toContainText(launch.name)
  })
})

test.describe('Booking status', () => {
  test('a paid booking shows as paid, with its launch status', async ({ page, request }) => {
    const launch = await logInWithOneBooking(page, request)
    await openBookings(page)

    const booking = bookingFor(page, launch.name)
    await expect(bookingFact(booking, 'Payment')).toHaveText('Paid')
    await expect(bookingFact(booking, 'Launch status')).toHaveText('Published')
  })

  for (const [paymentStatus, label] of [
    ['pending', 'Pending'],
    ['refunded', 'Refunded'],
  ] as const) {
    test(`a ${paymentStatus} booking shows as ${paymentStatus}`, async ({ page, request }) => {
      const launch = await logInWithOneBooking(page, request)
      await replacePaymentStatus(page, paymentStatus)
      await openBookings(page)

      await expect(bookingFact(bookingFor(page, launch.name), 'Payment')).toHaveText(label)
    })
  }

  test('an unknown payment status is shown as the API sends it', async ({ page, request }) => {
    const launch = await logInWithOneBooking(page, request)
    await replacePaymentStatus(page, 'disputed')
    await openBookings(page)

    await expect(bookingFact(bookingFor(page, launch.name), 'Payment')).toHaveText('disputed')
  })

  test('a booking whose launch was cancelled afterwards shows the launch as cancelled', async ({ page, request }) => {
    const launch = await logInWithOneBooking(page, request)
    await setLaunchStatus(request, launch, 'cancelled')
    await openBookings(page)

    await expect(bookingFact(bookingFor(page, launch.name), 'Launch status')).toHaveText('Cancelled')
  })
})

test.describe('Booking page states', () => {
  const SESSION_STORAGE_KEY = 'astrobookings.session'
  const EXPIRED_MESSAGE = /session has expired/i

  function isBookingsRequest(url: URL) {
    return url.href === `${TEST_API_URL}/bookings`
  }

  test('the page shows a loading state while waiting, then the bookings', async ({ page, request }) => {
    const launch = await logInWithOneBooking(page, request)
    let releaseResponse = () => {}
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    await page.route(isBookingsRequest, async (route) => {
      await responseReleased
      await route.fallback()
    })

    await openBookings(page)

    await expect(main(page).getByRole('status').filter({ hasText: 'Loading bookings' })).toBeVisible()
    releaseResponse()
    await expect(bookingFor(page, launch.name)).toHaveCount(1)
    await expect(main(page).getByRole('status').filter({ hasText: 'Loading bookings' })).toHaveCount(0)
  })

  test('a person with no bookings is told so and linked to the launch list', async ({ page, request }) => {
    await logIn(page, await registerUser(request))
    await openBookings(page)

    await expect(main(page)).toContainText('You have no bookings yet.')
    await main(page).getByRole('link', { name: 'Browse launches' }).click()

    await expect(page).toHaveURL('/')
  })

  test('a server error shows an error and a retry control that recovers, without logging out', async ({
    page,
    request,
  }) => {
    const user = await registerUser(request)
    const launch = await createLaunch(request)
    await bookSeatsAs(request, user, launch.id, 1)
    await logIn(page, user)
    await page.route(isBookingsRequest, (route) =>
      route.fulfill({ status: 500, json: { message: 'Internal server error', errors: [] } }),
    )

    await openBookings(page)

    const error = main(page).getByRole('alert')
    await expect(error).toContainText('Your bookings could not be loaded.')
    await expect(banner(page)).toContainText(user.username)
    await expect(page).toHaveURL('/bookings')

    await page.unroute(isBookingsRequest)
    await error.getByRole('button', { name: 'Try again' }).click()

    await expect(bookingFor(page, launch.name)).toHaveCount(1)
    await expect(main(page).getByRole('alert')).toHaveCount(0)
  })

  test('a rejected token logs the person out, and logging in again returns to /bookings', async ({
    page,
    request,
  }) => {
    const user = await registerUser(request)
    await logIn(page, user)
    // Breaks the token's signature, so the real API rejects it with 401 while the client still holds it.
    await page.evaluate((key) => {
      const session = JSON.parse(localStorage.getItem(key) ?? '{}')
      localStorage.setItem(key, JSON.stringify({ ...session, accessToken: `${session.accessToken}tampered` }))
    }, SESSION_STORAGE_KEY)

    await banner(page).getByRole('link', { name: 'My bookings' }).click()

    await expect(page).toHaveURL('/login')
    await expect(main(page)).toContainText(EXPIRED_MESSAGE)
    await expect(banner(page)).not.toContainText(user.username)

    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/bookings')
    await expect(main(page)).toContainText('You have no bookings yet.')
  })
})
