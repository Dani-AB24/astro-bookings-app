import * as fs from 'fs';
import * as path from 'path';
import { expect, test } from '@playwright/test';

interface SeedLaunch {
  id: string;
  rocket: string;
  price: number;
  totalSeats: number;
  status: string;
}

const seedFile = path.resolve(__dirname, '../db/seed/launches.json');
const seedLaunches: SeedLaunch[] = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));

test.describe('Seed launches', () => {
  test('every seed launch has a rocket and at least one is a draft', () => {
    for (const launch of seedLaunches) {
      expect(typeof launch.rocket).toBe('string');
      expect(launch.rocket.trim()).not.toBe('');
    }
    expect(seedLaunches.some((launch) => launch.status === 'draft')).toBe(true);
  });

  test('the public catalogue shows published seed launches with rocket and availableSeats, and no draft', async ({
    request,
  }) => {
    const launches = await (await request.get('/launches')).json();

    for (const seed of seedLaunches.filter((launch) => launch.status === 'published')) {
      expect(launches).toContainEqual(
        expect.objectContaining({ id: seed.id, rocket: seed.rocket, availableSeats: expect.any(Number) }),
      );
    }
    for (const seed of seedLaunches.filter((launch) => launch.status === 'draft')) {
      expect(launches.map((launch: { id: string }) => launch.id)).not.toContain(seed.id);
    }
  });

  test('no seat count of a seed launch is declined by the mock payment gateway', () => {
    for (const launch of seedLaunches) {
      for (let seats = 1; seats <= launch.totalSeats; seats++) {
        expect((launch.price * seats) % 1000, `${launch.id} with ${seats} seats`).not.toBe(0);
      }
    }
  });
});
