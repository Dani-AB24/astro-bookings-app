import { expect, test, type Page } from '@playwright/test'
import {
  bookSeats,
  createLaunch,
  registerUser,
  setLaunchStatus,
  TEST_API_URL,
  type TestUser,
} from './support/helpers.ts'

function main(page: Page) {
  return page.getByRole('main')
}

function bookingForm(page: Page) {
  return main(page).getByRole('form', { name: 'Book seats' })
}

async function logIn(page: Page, user: TestUser) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('banner')).toContainText(user.username)
}

/** One labelled value on the detail page, such as `Available seats` and its value. */
function launchFact(page: Page, label: string) {
  return main(page)
    .locator('dl > div')
    .filter({ has: page.getByRole('term').getByText(label, { exact: true }) })
    .getByRole('definition')
}

function confirmation(page: Page) {
  return main(page).getByRole('status').filter({ hasText: 'Booking confirmed' })
}

async function availableSeatsFromApi(request: Parameters<typeof createLaunch>[0], launchId: string) {
  const response = await request.get(`${TEST_API_URL}/launches/${launchId}`)
  expect(response.status()).toBe(200)
  return (await response.json()).availableSeats as number
}

function seatsInput(page: Page) {
  return bookingForm(page).getByLabel('Seats')
}

function bookButton(page: Page) {
  return bookingForm(page).getByRole('button', { name: /^Book / })
}

function isBookingRequest(url: URL) {
  return url.origin === TEST_API_URL && url.pathname === '/bookings'
}

/** Records every booking request the page sends, so tests can assert that none was sent. */
function recordBookingRequests(page: Page): string[] {
  const methods: string[] = []
  page.on('request', (request) => {
    if (isBookingRequest(new URL(request.url())) && request.method() === 'POST') {
      methods.push(request.method())
    }
  })
  return methods
}

/** Logs a new user in and opens a new launch created with the given options. */
async function openLaunchAsNewUser(
  page: Page,
  request: Parameters<typeof createLaunch>[0],
  options: Parameters<typeof createLaunch>[1] = {},
) {
  const launch = await createLaunch(request, options)
  await logIn(page, await registerUser(request))
  await openLaunch(page, launch.id)
  await expect(bookingForm(page)).toBeVisible()
  return launch
}

async function openLaunch(page: Page, launchId: string) {
  await page.goto(`/launches/${launchId}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('Booking access', () => {
  test('a logged-in person on a published launch with seats sees the booking form', async ({ page, request }) => {
    const launch = await createLaunch(request)
    await logIn(page, await registerUser(request))

    await openLaunch(page, launch.id)

    await expect(bookingForm(page)).toBeVisible()
  })

  test('an anonymous visitor sees a link to log in instead of the form, and returns to the launch', async ({
    page,
    request,
  }) => {
    const launch = await createLaunch(request)
    const user = await registerUser(request)

    await openLaunch(page, launch.id)
    await expect(bookingForm(page)).toHaveCount(0)
    await main(page).getByRole('link', { name: 'Log in to book seats' }).click()

    await expect(page).toHaveURL('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(`/launches/${launch.id}`)
    await expect(bookingForm(page)).toBeVisible()
  })

  test('a full launch shows no booking form', async ({ page, request }) => {
    const launch = await createLaunch(request, { totalSeats: 2 })
    await bookSeats(request, launch.id, 2)
    await logIn(page, await registerUser(request))

    await openLaunch(page, launch.id)

    await expect(main(page).getByText('Full', { exact: true })).toBeVisible()
    await expect(bookingForm(page)).toHaveCount(0)
  })

  test('a launch that is not published shows no booking form, nor a link to log in', async ({ page, request }) => {
    const launch = await createLaunch(request, { status: 'confirmed' })

    await openLaunch(page, launch.id)

    await expect(main(page).getByText('Not open for booking', { exact: true })).toBeVisible()
    await expect(bookingForm(page)).toHaveCount(0)
    await expect(main(page).getByRole('link', { name: 'Log in to book seats' })).toHaveCount(0)
  })
})

test.describe('Seat selection', () => {
  test('the form starts at 1 seat and shows the total for the selected seats', async ({ page, request }) => {
    await openLaunchAsNewUser(page, request, { price: 89999, totalSeats: 4 })

    await expect(seatsInput(page)).toHaveValue('1')
    await expect(bookButton(page)).toHaveText(/Book 1 seat for \$89,999/)

    await seatsInput(page).fill('2')

    await expect(bookingForm(page)).toContainText('$179,998')
    await expect(bookButton(page)).toHaveText(/Book 2 seats for \$179,998/)
  })

  test('more seats than are available explains the limit, cannot be submitted, and sends no request', async ({
    page,
    request,
  }) => {
    await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    const bookingRequests = recordBookingRequests(page)

    await seatsInput(page).fill('5')
    await seatsInput(page).press('Enter')

    await expect(seatsInput(page)).toHaveAccessibleDescription(/up to 4 seats/)
    await expect(bookButton(page)).toBeDisabled()
    expect(bookingRequests).toEqual([])
  })

  for (const [description, value] of [
    ['0', '0'],
    ['a fraction', '1.5'],
    ['nothing', ''],
  ]) {
    test(`entering ${description} cannot be submitted and sends no request`, async ({ page, request }) => {
      await openLaunchAsNewUser(page, request)
      const bookingRequests = recordBookingRequests(page)

      await seatsInput(page).fill(value)
      await seatsInput(page).press('Enter')

      await expect(bookButton(page)).toBeDisabled()
      await expect(seatsInput(page)).toHaveAttribute('aria-invalid', 'true')
      expect(bookingRequests).toEqual([])
    })
  }

  test('one seat can be selected on a launch whose minimum is 2', async ({ page, request }) => {
    await openLaunchAsNewUser(page, request, { minSeats: 2, totalSeats: 4 })

    await expect(seatsInput(page)).toHaveValue('1')
    await expect(bookButton(page)).toBeEnabled()
    await expect(seatsInput(page)).toHaveAttribute('aria-invalid', 'false')
  })
})

test.describe('Successful booking', () => {
  test('booking 2 of 4 seats confirms them as paid, links to bookings, and shows 2 seats available', async ({
    page,
    request,
  }) => {
    await openLaunchAsNewUser(page, request, { totalSeats: 4 })

    await seatsInput(page).fill('2')
    await bookButton(page).click()

    await expect(confirmation(page)).toContainText('2 seats')
    await expect(confirmation(page)).toContainText('paid')
    await expect(confirmation(page).getByRole('link', { name: 'View my bookings' })).toHaveAttribute(
      'href',
      '/bookings',
    )
    await expect(launchFact(page, 'Available seats')).toHaveText('2')
  })

  test('booking the last seats confirms the booking, marks the launch as full, and hides the form', async ({
    page,
    request,
  }) => {
    await openLaunchAsNewUser(page, request, { totalSeats: 2 })

    await seatsInput(page).fill('2')
    await bookButton(page).click()

    await expect(confirmation(page)).toContainText('2 seats')
    await expect(main(page).getByText('Full', { exact: true })).toBeVisible()
    await expect(launchFact(page, 'Available seats')).toHaveText('0')
    await expect(bookingForm(page)).toHaveCount(0)
  })
})

test.describe('Single submission', () => {
  test('selecting the booking button twice quickly creates only one booking', async ({ page, request }) => {
    const launch = await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    const bookingRequests = recordBookingRequests(page)
    // Hold the first response so the second click lands while the booking is pending.
    let releaseResponse = () => {}
    const responseHeld = new Promise<void>((resolve) => (releaseResponse = resolve))
    await page.route(isBookingRequest, async (route) => {
      await responseHeld
      await route.continue()
    })

    await bookButton(page).dblclick()
    await expect(bookButton(page)).toBeDisabled()
    releaseResponse()

    await expect(confirmation(page)).toContainText('1 seat')
    expect(bookingRequests).toHaveLength(1)
    expect(await availableSeatsFromApi(request, launch.id)).toBe(3)
  })
})

test.describe('Booking failures', () => {
  function failureAlert(page: Page) {
    return main(page).getByRole('alert')
  }

  async function respondToBooking(page: Page, status: number, message: string) {
    await page.route(isBookingRequest, (route) => route.fulfill({ status, json: { message, errors: [] } }))
  }

  test('a capacity error shows its message and updates the seats available', async ({ page, request }) => {
    const launch = await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    await expect(launchFact(page, 'Available seats')).toHaveText('4')
    // Someone else books meanwhile, so the page's seat count is stale.
    await bookSeats(request, launch.id, 3)
    const capacityMessage = 'Capacity exceeded. Available: 1, Requested: 2'
    await respondToBooking(page, 400, capacityMessage)

    await seatsInput(page).fill('2')
    await bookButton(page).click()

    await expect(failureAlert(page)).toContainText(capacityMessage)
    await expect(launchFact(page, 'Available seats')).toHaveText('1')
    await expect(confirmation(page)).toHaveCount(0)
    await expect(page).toHaveURL(`/launches/${launch.id}`)
  })

  test('a declined payment says that no booking was made, and the person can try again', async ({
    page,
    request,
  }) => {
    const launch = await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    await respondToBooking(page, 402, 'Payment could not be processed')

    await bookButton(page).click()

    await expect(failureAlert(page)).toContainText('payment was declined')
    await expect(failureAlert(page)).toContainText('no booking was made')
    await expect(confirmation(page)).toHaveCount(0)
    await expect(bookButton(page)).toBeEnabled()
    await expect(page).toHaveURL(`/launches/${launch.id}`)

    await page.unroute(isBookingRequest)
    await bookButton(page).click()

    await expect(confirmation(page)).toContainText('1 seat')
    await expect(failureAlert(page)).toHaveCount(0)
  })

  test('a launch closed meanwhile shows the message and updates the launch status', async ({ page, request }) => {
    const launch = await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    await setLaunchStatus(request, launch, 'confirmed')

    await bookButton(page).click()

    await expect(failureAlert(page)).toContainText('Launch is not open for booking')
    await expect(launchFact(page, 'Status')).toHaveText('Confirmed')
    await expect(bookingForm(page)).toHaveCount(0)
    await expect(confirmation(page)).toHaveCount(0)
    await expect(page).toHaveURL(`/launches/${launch.id}`)
  })

  test('an unreachable service says the booking could not be completed, and the person can try again', async ({
    page,
    request,
  }) => {
    const launch = await openLaunchAsNewUser(page, request, { totalSeats: 4 })
    await page.route(isBookingRequest, (route) => route.abort('failed'))

    await bookButton(page).click()

    await expect(failureAlert(page)).toContainText('booking could not be completed')
    await expect(confirmation(page)).toHaveCount(0)
    await expect(bookButton(page)).toBeEnabled()
    await expect(page).toHaveURL(`/launches/${launch.id}`)
  })
})

test.describe('Expired session', () => {
  const SESSION_STORAGE_KEY = 'astrobookings.session'
  const EXPIRED_MESSAGE = /session has expired/i

  /** Breaks the stored token's signature, so the real API rejects it with 401 while the client still holds it. */
  async function tamperWithStoredToken(page: Page) {
    await page.evaluate((key) => {
      const session = JSON.parse(localStorage.getItem(key) ?? '{}')
      localStorage.setItem(key, JSON.stringify({ ...session, accessToken: `${session.accessToken}tampered` }))
    }, SESSION_STORAGE_KEY)
  }

  test('a rejected token while booking logs the person out, says so, and logging in returns to the launch', async ({
    page,
    request,
  }) => {
    const launch = await createLaunch(request, { totalSeats: 4 })
    const user = await registerUser(request)
    await logIn(page, user)
    await tamperWithStoredToken(page)
    await openLaunch(page, launch.id)
    const bookingRequests = recordBookingRequests(page)

    await bookButton(page).click()

    await expect(page).toHaveURL('/login')
    await expect(main(page)).toContainText(EXPIRED_MESSAGE)
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(page.getByRole('banner')).not.toContainText(user.username)
    expect(bookingRequests).toHaveLength(1)

    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(`/launches/${launch.id}`)
    await expect(bookingForm(page)).toBeVisible()
    await expect(main(page)).not.toContainText(EXPIRED_MESSAGE)
    expect(await availableSeatsFromApi(request, launch.id)).toBe(4)
  })

  test('a wrong password on the login page is not treated as an expired session', async ({ page, request }) => {
    const user = await registerUser(request)
    await page.goto('/login')

    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(main(page).getByRole('alert').filter({ hasText: 'Invalid email or password' })).toBeVisible()
    await expect(main(page)).not.toContainText(EXPIRED_MESSAGE)
    await expect(page).toHaveURL('/login')
  })
})
