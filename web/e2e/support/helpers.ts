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
