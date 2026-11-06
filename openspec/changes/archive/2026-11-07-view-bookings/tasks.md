# Tasks

## 1. Prepare

- [x] 1.1 Verify that `book-seats` is archived, using `openspec list --specs` to find `web-seat-booking`. Then create a `view-bookings` branch from the updated `main`, and verify that `npm test` passes in `web/` and `openspec validate view-bookings --strict` passes

## 2. Booking list

- [x] 2.1 Add failing tests in `web/e2e/bookings.spec.ts` for the `Booking list` and `Own bookings only` requirements, and update the `create-login` tests that expect the temporary page text. Verify that the new tests fail
- [x] 2.2 Replace the temporary `/bookings` page with the list and its CSS Module, using the query key `['bookings']` and sorting newest first. Verify that the tests from 2.1 and the `Protected pages` tests pass

## 3. Status

- [x] 3.1 Add failing tests for the `Booking status` requirement, using `page.route()` for `pending` and `refunded` and a real status change for the cancelled launch, and verify that they fail
- [x] 3.2 Add the status labels and reuse the launch labels from the launch pages, and verify that the tests from 3.1 pass

## 4. Page states

- [x] 4.1 Add failing tests for the `Booking page states` requirement, using `page.route()` for the server error and a tampered token for the expired session, and verify that they fail
- [x] 4.2 Add the loading, empty, and error with retry states, and verify that the tests from 4.1 pass

## 5. Final checks

- [x] 5.1 Walk through the briefing against a running API and client: browse launches, register, book seats, and view the booking and its status. Verify that each briefing requirement works, and that `npm test` and `npm run build` pass in `web/`
- [x] 5.2 Add the customer flow and the known deleted-launch limitation to `web/README.md`, and verify that the README matches the walkthrough from 5.1

## Workflow follow-up

- Archive this change to complete the client.
- Consider a separate API change for the deleted-launch failure described in design.md.
