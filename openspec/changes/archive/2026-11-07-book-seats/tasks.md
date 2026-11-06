# Tasks

## 1. Prepare

- [x] 1.1 Verify that `list-launches` is archived, using `openspec list --specs` to find `web-launch-browsing`. Then create a `book-seats` branch from the updated `main`, and verify that `npm test` passes in `web/` and `openspec validate book-seats --strict` passes

## 2. Access and seat selection

- [x] 2.1 Add failing tests in `web/e2e/booking.spec.ts` for the `Booking access` requirement and verify that they fail
- [x] 2.2 Add the booking section to the detail page, using `getLaunchAvailability` and passing the launch as the login return location, and verify that the tests from 2.1 pass
- [x] 2.3 Add failing tests for the `Seat selection` requirement, including asserting that no request is sent for invalid counts, and verify that they fail
- [x] 2.4 Add the form with its CSS Module, seat limits, and running total, and verify that the tests from 2.3 pass

## 3. Booking

- [x] 3.1 Add failing tests for the `Successful booking` and `Single submission` requirements and verify that they fail
- [x] 3.2 Add the booking API call and mutation, the confirmation, the query invalidation, and the disabled pending state. Verify that the tests from 3.1 pass

## 4. Failures

- [x] 4.1 Add failing tests for the `Booking failures` requirement, using `page.route()` for the 402 and capacity responses and for the unreachable service, and a real launch closed through the API for `Launch closed`. Verify that they fail
- [x] 4.2 Add the failure messages and refetching, and verify that the tests from 4.1 pass

## 5. Expired session

- [x] 5.1 Add failing tests for the `Expired session` requirement, using a tampered token in `localStorage` against the real API, and verify that they fail
- [x] 5.2 Add the 401 handler in `src/api/client.ts`, the `sessionExpired` state in `AuthProvider`, the redirect, and the login page message. Verify that the tests from 5.1 pass and that the `Login` tests from `create-login` still pass

## Workflow follow-up

- Archive this change after `create-login`, because its `web-auth` delta adds to the spec that change creates, and before starting `view-bookings`.
