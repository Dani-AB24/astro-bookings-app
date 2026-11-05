# AstroBookings web client

> React, TypeScript, and Vite client for the AstroBookings API

The browser app for booking seats on rocket launches. It talks directly to the API in [`../api`](../api/README.md), which is a separate npm project.

## Install

Both projects need their own dependencies. The client's end-to-end tests start the API's test server, so install `api/` even if you only work on the client.

```bash
# From the repository root
cd api && npm install && cd ..
cd web && npm install
# Download the browser for the end-to-end tests (needed once per machine)
npx playwright install chromium
```

## Run

Start the API and the client in two terminals:

```bash
# Terminal 1: the API on http://localhost:3000
cd api
npm run dev

# Terminal 2: the client on http://localhost:5173
cd web
npm run dev
```

Open http://localhost:5173. If the API is not running, every page shows a notice that the AstroBookings service cannot be reached.

## Accounts

Log in with the seeded demo account, or create your own at `/register`:

- Email: `admin@astrobookings.example`
- Password: `admin-demo-password`

The demo account owns the seed launches and has no special permissions. Pages that need an account, such as **My bookings**, send you to log in first and return you afterwards.

### Session storage

After you log in or register, the client stores your user and access token together in `localStorage` under the key `astrobookings.session`, so you stay logged in across reloads. Logging out removes it. The token lasts 24 hours, and the client does not yet notice when it expires.

Any script running on the page can read `localStorage`, so this is not safe for production. An `httpOnly` cookie would be safer, but it needs API changes, and this project leaves security out at this stage.

## API address

The client sends its requests to `VITE_API_URL`, or to `http://localhost:3000` when it is not set. Vite reads it when the dev server starts or the app is built, so restart `npm run dev` after changing it.

```bash
VITE_API_URL=http://localhost:4000 npm run dev
```

You can also put it in `web/.env.local`, which git ignores:

```bash
VITE_API_URL=http://localhost:4000
```

## Scripts

```bash
npm run dev        # start the dev server on port 5173
npm run build      # type-check and build into dist/
npm run typecheck  # type-check only
npm test           # run the end-to-end tests
```

## Tests

`npm test` runs the Playwright tests in `e2e/` in Chromium. `playwright.config.ts` starts two servers for each run:

- the API's `tests/support/start-test-server.ts` on port 3100, which uses a temporary copy of the seed data and deletes it afterwards, so your local `api/db/` files are never touched;
- the client on port 5174, pointed at that API with `VITE_API_URL=http://localhost:3100`.

These ports leave 3000 and 5173 free, so the tests can run while you develop. Ports 3100 and 5174 must be free, though, because the tests never reuse a running server.

```bash
npx playwright test e2e/app-shell.spec.ts   # one file
npx playwright test -g "Unknown pages"      # tests matching a title
```

All tests in a run share one API, so tests should create their own users and launches instead of relying on exact seed data.

## Structure

```
src/
  api/          API client, error type, query client, and hand-written API types
  auth/         stored session, AuthProvider, and the route guards for logged-in and anonymous pages
  components/   shared UI, such as the layout and form fields
  forms/        mapping API errors to form fields
  pages/        routed pages
  styles/       global.css with resets and CSS variables
e2e/            Playwright end-to-end tests
```

Components are styled with CSS Modules (`*.module.css`) next to them.
