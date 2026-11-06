import { randomUUID } from 'node:crypto'
import { expect, type APIRequestContext } from '@playwright/test'

/** The API test server that playwright.config.ts starts. */
export const TEST_API_URL = 'http://localhost:3100'
export const TEST_PASSWORD = 'secret-password'

export type TestUser = {
  username: string
  email: string
  password: string
}

/** Unique details, because all tests in a run share one API. */
export function uniqueUserDetails(): TestUser {
  const id = randomUUID()
  return { username: `user-${id}`, email: `user-${id}@example.com`, password: TEST_PASSWORD }
}

/** Registers a unique user through the API and returns the details needed to log in. */
export async function registerUser(request: APIRequestContext): Promise<TestUser> {
  const user = uniqueUserDetails()
  const response = await request.post(`${TEST_API_URL}/users`, { data: { ...user, terms: true } })
  expect(response.status()).toBe(201)
  return user
}

const FAR_FUTURE_DATE = '2099-01-01T12:00:00.000Z'

export type LaunchStatus = 'published' | 'confirmed' | 'sold-out' | 'done' | 'cancelled'

export type TestLaunch = {
  id: string
  name: string
  totalSeats: number
  /** The owner's token, so a test can change the launch after creating it. */
  ownerToken: string
}

type ApiAccount = { token: string }

function bearer(account: ApiAccount) {
  return { Authorization: `Bearer ${account.token}` }
}

/** Registers a unique user through the API and returns its token, for setting up data. */
async function registerApiAccount(request: APIRequestContext): Promise<ApiAccount> {
  const response = await request.post(`${TEST_API_URL}/users`, { data: { ...uniqueUserDetails(), terms: true } })
  expect(response.status()).toBe(201)
  return { token: (await response.json()).accessToken }
}

/**
 * Creates a unique published launch through the API, then moves it to `status` if given.
 * The default price keeps booking totals clear of the mock gateway's declines (multiples of 1000).
 */
export async function createLaunch(
  request: APIRequestContext,
  options: { status?: LaunchStatus; totalSeats?: number; price?: number; minSeats?: number } = {},
): Promise<TestLaunch> {
  const owner = await registerApiAccount(request)
  const response = await request.post(`${TEST_API_URL}/launches`, {
    headers: bearer(owner),
    data: {
      name: `launch-${randomUUID()}`,
      rocket: 'Test Rocket',
      price: options.price ?? 25,
      date: FAR_FUTURE_DATE,
      duration: 90,
      launchSite: 'Test Site',
      minSeats: options.minSeats ?? 1,
      totalSeats: options.totalSeats ?? 4,
      status: 'published',
    },
  })
  expect(response.status()).toBe(201)
  const launch: TestLaunch = { ...(await response.json()), ownerToken: owner.token }

  if (options.status !== undefined && options.status !== 'published') {
    await setLaunchStatus(request, launch, options.status)
  }
  return launch
}

/** Moves a launch to another status through the API, as its owner. */
export async function setLaunchStatus(
  request: APIRequestContext,
  launch: TestLaunch,
  status: LaunchStatus,
): Promise<void> {
  const transition = await request.patch(`${TEST_API_URL}/launches/${launch.id}/status`, {
    headers: bearer({ token: launch.ownerToken }),
    data: { status },
  })
  expect(transition.status()).toBe(200)
}

/** Books seats on a launch as a new user, through the API. */
export async function bookSeats(request: APIRequestContext, launchId: string, seats: number): Promise<void> {
  const booker = await registerApiAccount(request)
  const response = await request.post(`${TEST_API_URL}/bookings`, {
    headers: bearer(booker),
    data: { launchId, seats },
  })
  expect(response.status()).toBe(201)
}
