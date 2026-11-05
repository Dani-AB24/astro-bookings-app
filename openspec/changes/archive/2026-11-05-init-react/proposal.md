# Proposal

## Why

The briefing asks for a frontend that consumes the AstroBookings API, and the repository only contains the API. The later client changes (`create-login`, `list-launches`, `book-seats`, `view-bookings`) all need a running React app, a way to call the API, and an end-to-end test setup, so this change provides them first.

## What Changes

- Add a React app in a new `web/` folder, next to `api/`.
- Add a shared layout, a temporary home page, and a not-found page.
- Add one API client that all later changes use, including a configurable API address and a consistent error type.
- Show a notice when the API cannot be reached, which also proves the client and API are connected.
- Add Playwright end-to-end tests that run the app against the real API on temporary data.
- Document how to run the app and its tests.

No API code changes. CORS is already open in `api/src/index.ts`.

## Capabilities

### New Capabilities
- `web-app-shell`: The layout, navigation, not-found page, API address, and API availability notice that every client page relies on.

### Modified Capabilities

None.

## Impact

- **New code**: `web/`, a separate npm project. The repository has no root `package.json`, so no workspace is introduced.
- **New dependencies**: React, React Router, TanStack Query, Vite, TypeScript, and Playwright. Running the tests downloads Chromium.
- **Existing code**: `api/` is unchanged, but the client's tests start `api/tests/support/start-test-server.ts`, so they need `npm install` in `api/` as well.
- **Docs**: a new `web/README.md`, and a link from the root `README.md`.
