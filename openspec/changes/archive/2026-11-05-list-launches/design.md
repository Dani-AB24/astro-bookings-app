# Design

## Context

`GET /launches` returns every non-draft launch, so it includes `confirmed`, `sold-out`, `done`, and `cancelled` as well as `published`. The API never sets `sold-out` by itself, so a full launch can still be `published`. Prices are numbers with no currency, dates are ISO strings, and `duration` is in minutes. The seed data has three published launches and one draft.

## Goals / Non-Goals

**Goals:**
- One shared rule for whether a launch can be booked, which `book-seats` reuses.

**Non-Goals:**
- The booking form, which `book-seats` adds to the detail page.
- Search, filter controls, and pagination. The seed catalogue is small.
- Showing `minSeats`. It is not enforced per booking, and its meaning for customers is unclear.

## Decisions

**Derive availability in one helper.** `getLaunchAvailability(launch)` returns `full` when `availableSeats` is 0, otherwise `bookable` when the status is `published`, otherwise `not-open`. Reading `status === 'sold-out'` alone would miss full launches, because the API never sets it.

**Hide `done` and `cancelled` in the client.** The briefing asks for available launches, and these can never be booked. `confirmed` and `sold-out` stay visible, marked as unavailable, because they are still upcoming. Filtering only to `published` was the alternative, but it would make launches vanish as soon as they are confirmed. The detail page shows any launch the API returns, so links from a person's bookings keep working once a launch is cancelled.

**Sort through the API.** Request `GET /launches?_sort=date&_order=asc` rather than sorting again in the client. A test confirms the order.

**Query keys `['launches']` and `['launches', id]`.** `book-seats` invalidates these after a booking.

**Shared formatters in `src/utils/format.ts`.** Use a fixed `en-US` locale so that output matches the interface language and tests are predictable. Dates show in the browser's time zone, with the zone named, because launches are global events. Durations convert to the largest sensible units, so 10080 minutes shows as `7 days`.

**Show prices in US dollars.** The API has no currency, so this is an assumption. It is isolated in one formatter and easy to change.

**Tests.** Seed launches cover the anonymous list. Launches in other states are created through the API using helpers based on `api/tests/support/helpers.ts`. A full launch comes from booking all seats of a new launch, rather than from mocks. Failures and the empty list use `page.route()`, because the real API cannot easily produce them.

## Risks / Trade-offs

- [Launches created by tests appear in the list during a run] → Tests assert on specific launches rather than exact list contents, and each run starts from fresh seed data.
- [A launch's availability changes while a page is open] → Refetching on window focus, TanStack Query's default, limits this. The booking flow handles the remaining cases.
