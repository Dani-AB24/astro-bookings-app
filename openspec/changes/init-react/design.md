# Design

## Context

`api/` is a standalone Express project on port 3000 with open CORS, so the browser can call it directly. There is no root `package.json`. `api/tests/support/start-test-server.ts` already runs the API from a temporary copy of the seed data, which keeps tests away from local `db/` files. Each following change builds on this one, so the structure set here is what they extend.

## Goals / Non-Goals

**Goals:**
- A foundation that the four feature changes can extend without restructuring.
- One tested path from the browser to the real API.

**Non-Goals:**
- Features: auth, launches, and bookings each have their own change.
- Changes to `api/`.
- Deployment. The app runs locally through Vite.
- A shared types package between `api/` and `web/`.

## Decisions

**Vite, React, and TypeScript in `web/`.** The backend already exists and the app has no SEO needs, so Next.js would add a server layer with no benefit. Scaffold with Vite's `react-ts` template and remove its demo content.

**React Router for pages.** Later changes need real addresses, such as `/launches/:id`, and login needs to send people back to where they were.

**TanStack Query for server data.** Most client state is server data, and later changes must refresh several things after a booking. Refetching by hand with `fetch` and `useEffect` was the alternative, with fewer dependencies but repeated loading, error, and refresh code on each page. Disable retries for 4xx responses and for the health check, so errors appear promptly.

**One API client, `web/src/api/client.ts`.** It builds URLs from `VITE_API_URL`, falling back to `http://localhost:3000`, and sends and parses JSON. Any failure becomes an `ApiError` with `status`, `message`, and `errors`, matching the API's `{ message, errors }` body. Network failures and non-JSON responses also become an `ApiError`, with `status` 0 for network failures, so pages handle one error type. Adding the bearer token is left to `create-login`.

**Hand-written API types in `web/src/api/types.ts`.** Add only what the client uses, as each feature needs it. Importing from `api/src/types` would tie two separate projects together.

**CSS Modules with one global stylesheet.** Vite supports them with no dependency. `web/src/styles/global.css` holds resets and CSS variables, and each component has its own `.module.css`.

**Source layout.** `src/api/` for the client and types, `src/components/` for shared UI, `src/pages/` for routed pages, and `e2e/` for tests. Feature changes add to these rather than introducing new top-level folders.

**Playwright against the real API.** `web/playwright.config.ts` starts two servers through `webServer`:

```
Playwright --> Vite on 5174 (VITE_API_URL=http://localhost:3100)
                 |
                 v
               api/tests/support/start-test-server.ts on 3100 (cwd: ../api)
```

These ports avoid clashes with normal development on 3000 and 5173, and `reuseExistingServer` stays `false` so tests never run against a leftover server. Match the `@playwright/test` version in `api/`, and copy its `gracefulShutdown` setting so the temporary directory is removed. Tests share one server during a run, so helpers in `web/e2e/support/` create unique users and launches instead of relying on exact seed seat counts. `page.route()` is used only for responses the real API cannot easily produce, such as an unreachable service.

**Health check in the layout.** A small always-on check gives the first real client-to-API test and helps people who forgot to start the API. It only shows a failure; a healthy API shows nothing.

## Risks / Trade-offs

- [Test setup reaches into `api/tests/support/`] → Accepted, since it reuses the existing isolation. A move of that file would break the client's tests immediately and visibly.
- [Types can drift from the API] → End-to-end tests run against the real API and catch drift on the paths they cover.
- [Chromium download is large] → Accepted as part of the chosen test approach, and needed only once. The README documents the install command.

## Assumptions

- The interface is in English, like the briefing and the API.
