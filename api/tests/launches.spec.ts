import { expect, test } from '@playwright/test';
import { bearer, createLaunch, registerUser, uniqueText } from './support/helpers';

test.describe('Public launch catalogue', () => {
  test('the list is readable without a token', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.get('/launches');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toContainEqual(expect.objectContaining({ id: launch.id }));
  });

  test('q returns only matching launches', async ({ request }) => {
    const owner = await registerUser(request);
    const name = uniqueText('searchable');
    const match = await createLaunch(request, owner, { name });
    await createLaunch(request, owner);

    const response = await request.get('/launches', { params: { q: name } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.map((launch: { id: string }) => launch.id)).toEqual([match.id]);
  });

  test('_sort and _order control the order', async ({ request }) => {
    const owner = await registerUser(request);
    await createLaunch(request, owner, { price: 11 });
    await createLaunch(request, owner, { price: 99 });

    const ascending = await request.get('/launches', { params: { _sort: 'price', _order: 'asc' } });
    const descending = await request.get('/launches', { params: { _sort: 'price', _order: 'desc' } });

    const pricesOf = async (response: typeof ascending): Promise<number[]> =>
      (await response.json()).map((launch: { price: number }) => launch.price);
    const ascendingPrices = await pricesOf(ascending);
    expect(ascendingPrices).toEqual([...ascendingPrices].sort((a, b) => a - b));
    const descendingPrices = await pricesOf(descending);
    expect(descendingPrices).toEqual([...descendingPrices].sort((a, b) => b - a));
  });

  test('one launch is readable without a token', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.get(`/launches/${launch.id}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).id).toBe(launch.id);
  });
});

test.describe('Launch status ownership', () => {
  test("another user's launch cannot change status", async ({ request }) => {
    const owner = await registerUser(request);
    const otherUser = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.patch(`/launches/${launch.id}/status`, {
      headers: bearer(otherUser.token),
      data: { status: 'confirmed' },
    });

    expect(response.status()).toBe(403);
  });

  test('an unknown launch responds 404', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.patch('/launches/does-not-exist/status', {
      headers: bearer(user.token),
      data: { status: 'confirmed' },
    });

    expect(response.status()).toBe(404);
  });
});

test.describe('Launch vocabulary', () => {
  test('the previous route is gone', async ({ request }) => {
    const response = await request.get('/activities');

    expect(response.status()).toBe(404);
  });

  test('the previous booking fields are rejected', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user);

    const response = await request.post('/bookings', {
      headers: bearer(user.token),
      data: { activityId: launch.id, participants: 1 },
    });

    expect(response.status()).toBe(400);
    const { errors } = await response.json();
    expect(errors).toContainEqual(expect.objectContaining({ field: 'launchId' }));
    expect(errors).toContainEqual(expect.objectContaining({ field: 'seats' }));
  });

  test('a launch has the new fields and not the previous ones', async ({ request }) => {
    const response = await request.get('/launches/launch-1');

    expect(response.status()).toBe(200);
    const launch = await response.json();
    for (const field of ['totalSeats', 'minSeats', 'launchSite']) {
      expect(launch).toHaveProperty(field);
    }
    for (const field of ['maxParticipants', 'minParticipants', 'location']) {
      expect(launch).not.toHaveProperty(field);
    }
  });
});
