import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';
import { bearer, createLaunch, registerUser, TestUser, uniqueText } from './support/helpers';

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

test.describe('Launch rocket', () => {
  const launchData = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    name: uniqueText('launch'),
    price: 25,
    date: '2099-01-01',
    launchSite: 'Test Site',
    minSeats: 1,
    totalSeats: 10,
    ...overrides,
  });

  test('a launch is created with its rocket', async ({ request }) => {
    const owner = await registerUser(request);

    const response = await request.post('/launches', {
      headers: bearer(owner.token),
      data: launchData({ rocket: 'Aurora Heavy' }),
    });

    expect(response.status()).toBe(201);
    expect((await response.json()).rocket).toBe('Aurora Heavy');
  });

  test('a launch without a rocket is rejected', async ({ request }) => {
    const owner = await registerUser(request);

    const response = await request.post('/launches', {
      headers: bearer(owner.token),
      data: launchData(),
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).errors).toContainEqual(expect.objectContaining({ field: 'rocket' }));
  });

  test('the owner can change the rocket', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { rocket: 'Falcata 3' },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).rocket).toBe('Falcata 3');
  });

  test('an empty rocket is rejected on update', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { rocket: '' },
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).errors).toContainEqual(expect.objectContaining({ field: 'rocket' }));
  });
});

test.describe('Available seats', () => {
  const book = (
    request: APIRequestContext,
    user: TestUser,
    launchId: string,
    seats: number,
  ): Promise<APIResponse> =>
    request.post('/bookings', { headers: bearer(user.token), data: { launchId, seats } });

  test('a new launch has all its seats available', async ({ request }) => {
    const owner = await registerUser(request);

    const launch = await createLaunch(request, owner, { totalSeats: 4 });

    expect(launch.availableSeats).toBe(4);
  });

  test('the list and detail show the seats left after a booking', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user, { totalSeats: 4 });
    expect((await book(request, user, launch.id, 3)).status()).toBe(201);

    const detail = await (await request.get(`/launches/${launch.id}`)).json();
    const list = await (await request.get('/launches')).json();

    expect(detail.availableSeats).toBe(1);
    expect(list).toContainEqual(expect.objectContaining({ id: launch.id, availableSeats: 1 }));
  });

  test('update and status responses include availableSeats', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner, { totalSeats: 4 });
    await book(request, owner, launch.id, 1);

    const updated = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { rocket: 'Falcata 3' },
    });
    const transitioned = await request.patch(`/launches/${launch.id}/status`, {
      headers: bearer(owner.token),
      data: { status: 'confirmed' },
    });

    expect((await updated.json()).availableSeats).toBe(3);
    expect((await transitioned.json()).availableSeats).toBe(3);
  });

  test('a declined booking does not change availableSeats', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user, { totalSeats: 4, price: 500 });

    const declined = await book(request, user, launch.id, 2);
    const tooMany = await book(request, user, launch.id, 5);

    expect(declined.status()).toBe(402);
    expect(tooMany.status()).toBe(400);
    const detail = await (await request.get(`/launches/${launch.id}`)).json();
    expect(detail.availableSeats).toBe(4);
  });

  test('a fully booked launch has no seats left', async ({ request }) => {
    const user = await registerUser(request);
    const launch = await createLaunch(request, user, { totalSeats: 2 });
    expect((await book(request, user, launch.id, 2)).status()).toBe(201);

    const detail = await (await request.get(`/launches/${launch.id}`)).json();
    const further = await book(request, user, launch.id, 1);

    expect(detail.availableSeats).toBe(0);
    expect(further.status()).toBe(400);
    expect((await further.json()).message).toMatch(/^Capacity exceeded/);
  });
});

test.describe('Read-only launch fields', () => {
  test('a different userId does not change the owner', async ({ request }) => {
    const owner = await registerUser(request);
    const otherUser = await registerUser(request);
    const launch = await createLaunch(request, owner);

    const response = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { name: uniqueText('renamed'), userId: 'someone-else' },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).userId).not.toBe('someone-else');
    const ownerAgain = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { rocket: 'Still Mine' },
    });
    const otherAttempt = await request.put(`/launches/${launch.id}`, {
      headers: bearer(otherUser.token),
      data: { rocket: 'Taken' },
    });
    expect(ownerAgain.status()).toBe(200);
    expect(otherAttempt.status()).toBe(403);
  });

  test('id and createdAt sent by the client are ignored', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner);
    const before = await (await request.get(`/launches/${launch.id}`)).json();

    const response = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { id: 'launch-999', createdAt: '2000-01-01T00:00:00.000Z' },
    });

    const body = await response.json();
    expect(body.id).toBe(launch.id);
    expect(body.createdAt).toBe(before.createdAt);
  });

  test('availableSeats stays computed from totalSeats and booked seats', async ({ request }) => {
    const owner = await registerUser(request);
    const launch = await createLaunch(request, owner, { totalSeats: 4 });
    await request.post('/bookings', {
      headers: bearer(owner.token),
      data: { launchId: launch.id, seats: 1 },
    });

    const response = await request.put(`/launches/${launch.id}`, {
      headers: bearer(owner.token),
      data: { availableSeats: 999 },
    });

    expect((await response.json()).availableSeats).toBe(3);
    const detail = await (await request.get(`/launches/${launch.id}`)).json();
    expect(detail.availableSeats).toBe(3);
  });
});

test.describe('Draft visibility', () => {
  test('drafts are missing from the list, with or without search and sort', async ({ request }) => {
    const owner = await registerUser(request);
    const name = uniqueText('hidden');
    const draft = await createLaunch(request, owner, { name, status: 'draft' });

    const plain = await (await request.get('/launches')).json();
    const searched = await (await request.get('/launches', { params: { q: name } })).json();
    const sorted = await (await request.get('/launches', { params: { _sort: 'price' } })).json();
    const bySlug = await (
      await request.get('/launches', { params: { slug: name } })
    ).json();

    for (const list of [plain, searched, sorted, bySlug]) {
      expect(list.map((launch: { id: string }) => launch.id)).not.toContain(draft.id);
      expect(list.every((launch: { status: string }) => launch.status !== 'draft')).toBe(true);
    }
  });

  test('a draft responds 404 on detail', async ({ request }) => {
    const owner = await registerUser(request);
    const draft = await createLaunch(request, owner, { status: 'draft' });

    const response = await request.get(`/launches/${draft.id}`);

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Launch not found');
  });

  test('the owner can still publish a draft, which then becomes visible', async ({ request }) => {
    const owner = await registerUser(request);
    const draft = await createLaunch(request, owner, { status: 'draft' });

    const response = await request.patch(`/launches/${draft.id}/status`, {
      headers: bearer(owner.token),
      data: { status: 'published' },
    });

    expect(response.status()).toBe(200);
    expect((await request.get(`/launches/${draft.id}`)).status()).toBe(200);
  });
});
