import { randomUUID } from 'crypto';
import { APIRequestContext, expect } from '@playwright/test';

const FAR_FUTURE_DATE = '2099-01-01';
export const TEST_PASSWORD = 'secret-password';

export interface TestUser {
  email: string;
  token: string;
}

export interface TestLaunch {
  id: string;
  name: string;
  price: number;
  totalSeats: number;
}

export function uniqueText(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export function userFields(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    username: uniqueText('user'),
    email: `${uniqueText('user')}@example.com`,
    password: TEST_PASSWORD,
    terms: true,
    ...overrides,
  };
}

export async function registerUser(request: APIRequestContext): Promise<TestUser> {
  const response = await request.post('/users', { data: userFields() });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return { email: body.user.email, token: body.accessToken };
}

export async function createLaunch(
  request: APIRequestContext,
  owner: TestUser,
  overrides: Record<string, unknown> = {},
): Promise<TestLaunch> {
  const response = await request.post('/launches', {
    headers: bearer(owner.token),
    data: {
      name: uniqueText('launch'),
      price: 25,
      date: FAR_FUTURE_DATE,
      duration: 60,
      launchSite: 'Test Site',
      minSeats: 1,
      totalSeats: 10,
      status: 'published',
      ...overrides,
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
