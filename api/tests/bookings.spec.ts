import { expect, test } from '@playwright/test';
import { bearer, createLaunch, registerUser } from './support/helpers';

test.describe('Booking creation', () => {
  test('a booking within capacity is created and paid', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user);

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: launch.id, seats: 2 },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.launchId).toBe(launch.id);
    expect(body.seats).toBe(2);
    expect(body.paymentStatus).toBe('paid');
  });

  test('seats below 1 are rejected', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user);

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: launch.id, seats: 0 },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors).toContainEqual(expect.objectContaining({ field: 'seats' }));
  });

  test('requesting more than the remaining capacity is rejected', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user, { totalSeats: 2 });

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: launch.id, seats: 3 },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).message).toBe('Capacity exceeded. Available: 2, Requested: 3');
  });

  test('an unknown launch responds 404', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: 'does-not-exist', seats: 1 },
    });

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Launch not found');
  });

  test('a total divisible by 1000 is declined and no booking is created', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user, { price: 500 });

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: launch.id, seats: 2 },
    });

    expect(response.status()).toBe(402);
    expect((await response.json()).message).toBe('Payment could not be processed');
    const bookings = await request.get('/bookings', { headers: bearer(user.token) });
    expect(await bookings.json()).toEqual([]);
  });
});

test.describe('Booking retrieval', () => {
  test('the list holds only own bookings, with payment and launch details', async ({ request }) => {
    const user = await registerUser(request);
    const otherUser = await registerUser(request);
    const launch = await createLaunch(request, user);
    const headers = bearer(user.token);
    const created = await request.post('/bookings', {
      headers,
      data: { launchId: launch.id, seats: 1 },
    });
    await request.post('/bookings', {
      headers: bearer(otherUser.token),
      data: { launchId: launch.id, seats: 1 },
    });

    const response = await request.get('/bookings', { headers });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe((await created.json()).id);
    expect(body[0].paymentStatus).toBe('paid');
    expect(body[0].launch.name).toBe(launch.name);
  });

  test("another user's booking responds 404", async ({ request }) => {
    const user = await registerUser(request);
    const otherUser = await registerUser(request);
    const launch = await createLaunch(request, user);
    const created = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { launchId: launch.id, seats: 1 },
    });

    const response = await request.get(`/bookings/${(await created.json()).id}`, {
      headers: bearer(otherUser.token),
    });

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Booking not found');
  });
});
