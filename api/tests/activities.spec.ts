import { expect, test } from '@playwright/test';
import { bearer, createActivity, registerUser, uniqueText } from './support/helpers';

test.describe('Public activity catalogue', () => {
  test('the list is readable without a token', async ({ request }) => {
    const owner = await registerUser(request);
    const activity = await createActivity(request, owner);

    const response = await request.get('/activities');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toContainEqual(expect.objectContaining({ id: activity.id }));
  });

  test('q returns only matching activities', async ({ request }) => {
    const owner = await registerUser(request);
    const name = uniqueText('searchable');
    const match = await createActivity(request, owner, { name });
    await createActivity(request, owner);

    const response = await request.get('/activities', { params: { q: name } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.map((activity: { id: string }) => activity.id)).toEqual([match.id]);
  });

  test('_sort and _order control the order', async ({ request }) => {
    const owner = await registerUser(request);
    await createActivity(request, owner, { price: 11 });
    await createActivity(request, owner, { price: 99 });

    const ascending = await request.get('/activities', { params: { _sort: 'price', _order: 'asc' } });
    const descending = await request.get('/activities', { params: { _sort: 'price', _order: 'desc' } });

    const pricesOf = async (response: typeof ascending): Promise<number[]> =>
      (await response.json()).map((activity: { price: number }) => activity.price);
    const ascendingPrices = await pricesOf(ascending);
    expect(ascendingPrices).toEqual([...ascendingPrices].sort((a, b) => a - b));
    const descendingPrices = await pricesOf(descending);
    expect(descendingPrices).toEqual([...descendingPrices].sort((a, b) => b - a));
  });

  test('one activity is readable without a token', async ({ request }) => {
    const owner = await registerUser(request);
    const activity = await createActivity(request, owner);

    const response = await request.get(`/activities/${activity.id}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).id).toBe(activity.id);
  });
});

test.describe('Activity status ownership', () => {
  test("another user's activity cannot change status", async ({ request }) => {
    const owner = await registerUser(request);
    const otherUser = await registerUser(request);
    const activity = await createActivity(request, owner);

    const response = await request.patch(`/activities/${activity.id}/status`, {
      headers: bearer(otherUser.token),
      data: { status: 'confirmed' },
    });

    expect(response.status()).toBe(403);
  });

  test('an unknown activity responds 404', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.patch('/activities/does-not-exist/status', {
      headers: bearer(user.token),
      data: { status: 'confirmed' },
    });

    expect(response.status()).toBe(404);
  });
});
