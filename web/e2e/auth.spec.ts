import { expect, test, type Page } from '@playwright/test'
import { registerUser, uniqueUserDetails, type TestUser } from './support/helpers.ts'

const HOME_HEADING = 'Welcome to AstroBookings'
const SESSION_STORAGE_KEY = 'astrobookings.session'
const DEMO_ACCOUNT = { username: 'admin', email: 'admin@astrobookings.example', password: 'admin-demo-password' }

function banner(page: Page) {
  return page.getByRole('banner')
}

async function fillRegistration(page: Page, user: TestUser, acceptTerms = true) {
  await page.getByLabel('Username').fill(user.username)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  if (acceptTerms) {
    await page.getByLabel('I accept the terms').check()
  }
}

async function fillLogin(page: Page, credentials: { email: string; password: string }) {
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
}

async function logIn(page: Page, user: TestUser) {
  await page.goto('/login')
  await fillLogin(page, user)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(banner(page)).toContainText(user.username)
}

async function expectAnonymousLayout(page: Page) {
  await expect(banner(page).getByRole('link', { name: 'Log in' })).toBeVisible()
  await expect(banner(page).getByRole('link', { name: 'Register' })).toBeVisible()
  await expect(banner(page).getByRole('button', { name: 'Log out' })).toHaveCount(0)
}

test.describe('Registration', () => {
  test('valid details with the terms accepted log the person in and show the home page', async ({ page }) => {
    const user = uniqueUserDetails()
    await page.goto('/register')

    await fillRegistration(page, user)
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: HOME_HEADING })).toBeVisible()
    await expect(banner(page)).toContainText(user.username)
  })

  test('without the terms accepted, the error is shown beside the checkbox and no one is logged in', async ({
    page,
  }) => {
    const user = uniqueUserDetails()
    await page.goto('/register')

    await fillRegistration(page, user, false)
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByLabel('I accept the terms')).toHaveAccessibleDescription('Terms acceptance is required')
    await expect(page).toHaveURL('/register')
    await expect(banner(page)).not.toContainText(user.username)
  })

  test('an email that is already registered shows the error beside the email field', async ({ page, request }) => {
    const existingUser = await registerUser(request)
    await page.goto('/register')

    await fillRegistration(page, { ...uniqueUserDetails(), email: existingUser.email })
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Email is already registered')
    await expect(page).toHaveURL('/register')
  })

  test('invalid fields show each error beside its field and keep the entered values', async ({ page }) => {
    const user = { ...uniqueUserDetails(), email: 'not-an-email', password: '123' }
    await page.goto('/register')

    await fillRegistration(page, user)
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Email must be a valid email address')
    await expect(page.getByLabel('Password')).toHaveAccessibleDescription(
      'Password is required and must be at least 6 characters long',
    )
    await expect(page.getByLabel('Username')).toHaveValue(user.username)
    await expect(page.getByLabel('Email')).toHaveValue(user.email)
  })
})

test.describe('Login', () => {
  test('valid credentials log the person in and show the home page', async ({ page, request }) => {
    const user = await registerUser(request)
    await page.goto('/login')

    await fillLogin(page, user)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: HOME_HEADING })).toBeVisible()
    await expect(banner(page)).toContainText(user.username)
  })

  test('the seeded demo account can log in', async ({ page }) => {
    await page.goto('/login')

    await fillLogin(page, DEMO_ACCOUNT)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/')
    await expect(banner(page)).toContainText(DEMO_ACCOUNT.username)
  })

  test('a wrong password shows the error and no one is logged in', async ({ page, request }) => {
    const user = await registerUser(request)
    await page.goto('/login')

    await fillLogin(page, { email: user.email, password: 'wrong-password' })
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Invalid email or password' })).toBeVisible()
    await expect(page).toHaveURL('/login')
    await expect(banner(page)).not.toContainText(user.username)
  })

  test('an empty email shows the error beside the email field', async ({ page }) => {
    await page.goto('/login')

    await fillLogin(page, { email: '', password: 'any-password' })
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
      'Email is required and must be a non-empty string',
    )
  })
})

test.describe('Session display', () => {
  test('an anonymous visitor sees links to log in and register, and no username', async ({ page }) => {
    await page.goto('/')

    await expectAnonymousLayout(page)
    await expect(banner(page).getByRole('link', { name: 'My bookings' })).toHaveCount(0)
  })

  test('a logged-in person sees their username, a link to their bookings, and a way to log out', async ({
    page,
    request,
  }) => {
    const user = await registerUser(request)
    await logIn(page, user)

    await page.goto('/does-not-exist')

    await expect(banner(page)).toContainText(user.username)
    await expect(banner(page).getByRole('link', { name: 'My bookings' })).toHaveAttribute('href', '/bookings')
    await expect(banner(page).getByRole('button', { name: 'Log out' })).toBeVisible()
    await expect(banner(page).getByRole('link', { name: 'Log in' })).toHaveCount(0)
  })
})

test.describe('Session persistence', () => {
  test('a logged-in person stays logged in with their username after a reload', async ({ page, request }) => {
    const user = await registerUser(request)
    await logIn(page, user)

    await page.reload()

    await expect(banner(page)).toContainText(user.username)
    await expect(banner(page).getByRole('button', { name: 'Log out' })).toBeVisible()
  })

  for (const [description, storedValue] of [
    ['invalid JSON', '{not json'],
    ['JSON without a user and token', JSON.stringify({ user: null })],
  ]) {
    test(`a stored session with ${description} is treated as anonymous`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [SESSION_STORAGE_KEY, storedValue] as const,
      )

      await page.goto('/')

      await expect(page.getByRole('heading', { name: HOME_HEADING })).toBeVisible()
      await expectAnonymousLayout(page)
    })
  }
})

test.describe('Logout', () => {
  test('logging out shows the home page as an anonymous visitor, also after a reload', async ({ page, request }) => {
    const user = await registerUser(request)
    await logIn(page, user)
    await banner(page).getByRole('link', { name: 'My bookings' }).click()
    await expect(page).toHaveURL('/bookings')

    await banner(page).getByRole('button', { name: 'Log out' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: HOME_HEADING })).toBeVisible()
    await expectAnonymousLayout(page)
    await expect(banner(page)).not.toContainText(user.username)

    await page.reload()

    await expectAnonymousLayout(page)
    await expect(banner(page)).not.toContainText(user.username)
  })
})

test.describe('Protected pages', () => {
  const BOOKINGS_HEADING = 'My bookings'

  test('an anonymous visitor who opens /bookings sees the login page', async ({ page }) => {
    await page.goto('/bookings')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  })

  test('after logging in, the visitor returns to /bookings', async ({ page, request }) => {
    const user = await registerUser(request)
    await page.goto('/bookings')

    await fillLogin(page, user)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/bookings')
    await expect(page.getByRole('heading', { name: BOOKINGS_HEADING })).toBeVisible()
  })

  test('after following the link to register and registering, the visitor returns to /bookings', async ({
    page,
  }) => {
    await page.goto('/bookings')

    await page.getByRole('main').getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL('/register')
    await fillRegistration(page, uniqueUserDetails())
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL('/bookings')
    await expect(page.getByRole('heading', { name: BOOKINGS_HEADING })).toBeVisible()
  })
})

test.describe('Login pages when logged in', () => {
  for (const path of ['/login', '/register']) {
    test(`a logged-in person who opens ${path} sees the home page`, async ({ page, request }) => {
      const user = await registerUser(request)
      await logIn(page, user)

      await page.goto(path)

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: HOME_HEADING })).toBeVisible()
    })
  }
})
