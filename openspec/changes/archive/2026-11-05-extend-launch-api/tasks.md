# Tasks

## 1. Prepare

- [x] 1.1 Verify that `rename-to-launch` is archived, using `openspec list --specs` and a search of `openspec/specs/booking-api/spec.md` for `Public launch catalogue`. Then create an `extend-launch-api` branch from the updated `main`, and verify that `npm test` passes in `api/` and `openspec validate extend-launch-api --strict` reports no missing requirements

## 2. Rocket

- [x] 2.1 Add failing tests for the `Launch rocket` requirement to `api/tests/launches.spec.ts`, send `rocket` from the `createLaunch` helper, and verify that the new tests fail
- [x] 2.2 Add `rocket` to the launch types, creation, update validation and the launch details of booking responses, and verify with `npx playwright test tests/launches.spec.ts` and a test that a booking's `launch` includes `rocket`

## 3. Available seats and shared services

- [x] 3.1 Export shared `launchService` and `bookingService` instances from their service files and use them from both routes, and verify that `npm test` still passes
- [x] 3.2 Add failing tests for the `Available seats` requirement, then add `toLaunchResponse` to every launch returned by `routes/launches.ts`, and verify that they pass, including the `Declined booking` and `Fully booked` scenarios

## 4. Read-only fields

- [x] 4.1 Add failing tests for the `Read-only launch fields` requirement, then make `update()` copy only editable fields, and verify that they pass, including that a different `userId` does not change ownership

## 5. Booking rules

- [x] 5.1 Add failing tests for the `Fractional seats` and `Launch not published` scenarios to `api/tests/bookings.spec.ts`, covering at least `draft` and `cancelled` launches. Implement whole-seat validation and the published check, placed before capacity and payment, and match the new message in `routes/bookings.ts`. Verify with `npx playwright test tests/bookings.spec.ts`

## 6. Draft visibility

- [x] 6.1 Add failing tests for the `Draft hidden from the list` and `Draft hidden from detail` scenarios, then filter drafts in `GET /launches` and `GET /launches/:id`. Verify that they pass, and that the owner can still publish a draft with `PATCH /launches/:id/status`

## 7. Seed data and docs

- [x] 7.1 Replace `api/db/seed/launches.json` with the launches in `design.md`, keeping `userId` as `user-1`, and update the seed persistence test to compare non-draft launches with `objectContaining`. Verify with `npx playwright test tests/persistence.spec.ts tests/auth.spec.ts`, including the admin ownership tests
- [x] 7.2 Add tests for the `Seed launches` requirement, including that `price` multiplied by every seat count up to `totalSeats` is not divisible by 1000 for all seed launches, and verify that they pass
- [x] 7.3 Update `api/README.md` with `rocket`, `availableSeats`, the booking rules and draft visibility, and repeat the note about deleting old local `db/*.json` files. Verify that the listed fields match `src/types/`

## 8. Final check

- [x] 8.1 From a clean `npm ci`, run `npm run typecheck`, `npm test` twice and `openspec validate extend-launch-api --strict`. Start the API with no local `db/*.json` files, log in as the admin, and book seats on `launch-1` through the API. Verify that all checks pass, that the booking returns 201 and that `availableSeats` drops by the seats booked
