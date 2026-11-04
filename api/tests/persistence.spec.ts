import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { APIRequestContext, expect, request as playwrightRequest, test } from '@playwright/test';
import { TEST_PASSWORD, bearer, createActivity, registerUser, userFields } from './support/helpers';

const API_ROOT = path.resolve(__dirname, '..');
const SEED_DIRECTORY = path.join(API_ROOT, 'db/seed');
const RESTART_TEST_PORT = 3101;

function startServer(dataDirectory: string): ChildProcess {
  return spawn(path.join(API_ROOT, 'node_modules/.bin/tsx'), [path.join(API_ROOT, 'src/index.ts')], {
    cwd: dataDirectory,
    env: { ...process.env, PORT: String(RESTART_TEST_PORT) },
    stdio: 'ignore',
  });
}

async function stopServer(server: ChildProcess): Promise<void> {
  const exited = new Promise((resolve) => server.once('exit', resolve));
  server.kill('SIGTERM');
  await exited;
}

async function waitUntilHealthy(api: APIRequestContext): Promise<void> {
  await expect(async () => {
    expect((await api.get('/health')).status()).toBe(200);
  }).toPass({ timeout: 15_000 });
}

test.describe('Data persistence', () => {
  test('creating an activity keeps the seed activities', async ({ request }) => {
    const seedFile = path.join(SEED_DIRECTORY, 'activities.json');
    const seedActivities = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
    const owner = await registerUser(request);

    await createActivity(request, owner);

    const activities = await (await request.get('/activities')).json();
    for (const seedActivity of seedActivities) {
      expect(activities).toContainEqual(seedActivity);
    }
  });

  test('users, activities and bookings survive a restart', async () => {
    const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'api-restart-'));
    fs.cpSync(SEED_DIRECTORY, path.join(dataDirectory, 'db/seed'), { recursive: true });
    const api = await playwrightRequest.newContext({
      baseURL: `http://localhost:${RESTART_TEST_PORT}`,
    });
    let server = startServer(dataDirectory);

    try {
      await waitUntilHealthy(api);
      const user = await registerUser(api);
      const activity = await createActivity(api, user);
      const booking = await api.post('/bookings', {
        headers: bearer(user.token),
        data: { activityId: activity.id, participants: 1 },
      });
      const bookingId = (await booking.json()).id;
      const activitiesBeforeRestart = await (await api.get('/activities')).json();

      await stopServer(server);
      server = startServer(dataDirectory);
      await waitUntilHealthy(api);

      const credentials = { email: user.email, password: TEST_PASSWORD };
      const login = await api.post('/login', { data: credentials });
      expect(login.status()).toBe(200);
      const token = (await login.json()).accessToken;

      const duplicate = await api.post('/users', { data: userFields({ email: user.email }) });
      expect(duplicate.status()).toBe(400);
      expect((await duplicate.json()).errors).toContainEqual(expect.objectContaining({ field: 'email' }));

      const newUser = await registerUser(api);
      expect((await api.post('/login', { data: credentials })).status()).toBe(200);

      await createActivity(api, newUser);
      const activities = await (await api.get('/activities')).json();
      for (const existingActivity of activitiesBeforeRestart) {
        expect(activities).toContainEqual(existingActivity);
      }

      const newBooking = await api.post('/bookings', {
        headers: bearer(newUser.token),
        data: { activityId: activity.id, participants: 1 },
      });
      expect(newBooking.status()).toBe(201);
      const ownBookings = await (await api.get('/bookings', { headers: bearer(token) })).json();
      expect(ownBookings.map((ownBooking: { id: string }) => ownBooking.id)).toEqual([bookingId]);
    } finally {
      await stopServer(server);
      await api.dispose();
      fs.rmSync(dataDirectory, { recursive: true, force: true });
    }
  });
});
