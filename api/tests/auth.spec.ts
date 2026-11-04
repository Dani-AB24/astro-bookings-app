import { expect, test } from '@playwright/test';
import { TEST_PASSWORD, registerUser, userFields } from './support/helpers';

test.describe('Service health', () => {
  test('GET /health responds without authentication', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

test.describe('Standard error format', () => {
  test('validation errors list the failing field', async ({ request }) => {
    const response = await request.post('/users', { data: userFields({ email: 'not-an-email' }) });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toContainEqual(expect.objectContaining({ field: 'email' }));
  });

  test('non-validation errors have an empty errors list', async ({ request }) => {
    const response = await request.get('/launches/does-not-exist');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Launch not found', errors: [] });
  });
});

test.describe('User registration', () => {
  test('valid fields create a user with an access token', async ({ request }) => {
    const response = await request.post('/users', { data: userFields() });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.user).toBeTruthy();
    expect(body.accessToken).toBeTruthy();
  });

  test('terms must be accepted', async ({ request }) => {
    const response = await request.post('/users', { data: userFields({ terms: false }) });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors).toContainEqual(expect.objectContaining({ field: 'terms' }));
  });

  test('an email can only be registered once', async ({ request }) => {
    const { email } = await registerUser(request);

    const response = await request.post('/users', { data: userFields({ email }) });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors).toContainEqual(expect.objectContaining({ field: 'email' }));
  });
});

test.describe('User login', () => {
  test('valid credentials return the user with an access token', async ({ request }) => {
    const { email } = await registerUser(request);

    const response = await request.post('/login', { data: { email, password: TEST_PASSWORD } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe(email);
    expect(body.accessToken).toBeTruthy();
  });

  test('a wrong password is rejected', async ({ request }) => {
    const { email } = await registerUser(request);

    const response = await request.post('/login', { data: { email, password: 'wrong-password' } });

    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBe('Invalid email or password');
  });
});

test.describe('Seeded admin user', () => {
  const adminCredentials = { email: 'admin@astrobookings.example', password: 'admin-demo-password' };

  test('can log in on a fresh start', async ({ request }) => {
    const response = await request.post('/login', { data: adminCredentials });

    expect(response.status()).toBe(200);
    expect((await response.json()).user.username).toBe('admin');
  });

  test('owns the seed launches', async ({ request }) => {
    const login = await request.post('/login', { data: adminCredentials });
    const { accessToken } = await login.json();

    // A published launch cannot go back to draft, so an owner gets a 400 and nothing changes.
    const response = await request.patch('/launches/launch-1/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'draft' },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain('Invalid status transition');
  });

  test('new users do not take over the seed launches', async ({ request }) => {
    const user = await registerUser(request);
    const login = await request.post('/login', { data: { email: user.email, password: TEST_PASSWORD } });
    const { accessToken } = await login.json();

    const response = await request.patch('/launches/launch-2/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'draft' },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('Authenticated endpoints', () => {
  test('a missing token is rejected', async ({ request }) => {
    const response = await request.get('/bookings');

    expect(response.status()).toBe(401);
  });

  test('a malformed token is rejected', async ({ request }) => {
    const response = await request.get('/bookings', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });

    expect(response.status()).toBe(401);
  });
});
