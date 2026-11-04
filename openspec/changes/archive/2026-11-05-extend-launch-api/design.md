# Design

## Context

See `proposal.md` for motivation and `specs/booking-api/spec.md` for the contract. Names below assume `rename-to-launch` has been archived.

Current code that shapes this design:

- `BookingService.calculateAvailableCapacity()` already computes the seats left. `BookingService` depends on the launch service, so the launch service cannot call it without a cycle.
- `routes/launches.ts` and `routes/bookings.ts` each create their own service instances.
- `update()` spreads the raw request body into the stored launch, so any field can be overwritten, including `userId`.
- The mock gateway declines a total divisible by 1000, and the total is `price` multiplied by `seats`.

## Goals / Non-Goals

**Goals:**
- Give the client everything the briefing needs from one launch response.
- Close the ways around the seat rule that the client could not fix on its own.

**Non-Goals:**
- A rocket entity or rocket endpoints. A text field is all the briefing needs.
- Searching by rocket: `q` keeps searching name, launch site and slug.
- Rejecting past dates at booking time: a past launch that is still `published` stays bookable. Lifecycle status remains the only gate, as agreed.
- Setting the `sold-out` status automatically. Clients use `availableSeats === 0`.
- Cancelling bookings, or checking `totalSeats` against seats already booked on update.
- A way for owners to read their own drafts through `GET`. No UI needs it yet, and create, update and status responses still return them.

## Decisions

### Compute `availableSeats` in the routes
A small `toLaunchResponse` helper in `routes/launches.ts` adds `availableSeats` to every launch the route returns: list, detail, create, update and status change. It calls `bookingService.calculateAvailableCapacity()`.

Keeping it out of the stored record means it cannot go stale, and keeping it out of the launch service avoids a dependency cycle. Storing a counter was rejected because every booking would have to keep it in step.

### Share service instances
Export one `launchService` and one `bookingService` from their service files, as `userService` already does, and use them from both routes. Two instances of a service with a private ID counter is the pattern that caused the login defect, and the launches route now needs the booking service as well.

### Copy only editable fields on update
`update()` builds its changes from an explicit list of `UpdateLaunchRequest` fields, now including `rocket`, instead of spreading the request body. This stops a client storing `availableSeats`, and also closes the existing hole where `PUT` could overwrite `userId`, `id` or `createdAt`.

Rejecting unknown fields with a 400 was rejected as a stricter contract than the client needs.

### Hide drafts at the public routes
`GET /launches` filters out `draft` launches, including with `q`, `slug` and `_sort`, and `GET /launches/:id` responds 404 for a draft. The filtering sits in the route, because the service's `getById` must still find drafts for `PUT`, `DELETE`, `PATCH` and booking checks.

The earlier agreement named the public list only. Detail is included because `launch-4` is a guessable ID, which would otherwise defeat the hiding.

### Check booking rules in a fixed order
`create()` checks that the launch exists, then that it is `published`, then capacity, then payment. A draft therefore responds `Launch is not open for booking` with status 400, and not with a capacity or payment error. The route matches that message explicitly, like its other errors. `validateCreate` uses `Number.isInteger` for `seats`.

### Seed prices that end in 9
A price like `249500` is not divisible by 1000, but 2 seats total `499000`, and that booking would be declined. A price ending in 1, 3, 7 or 9 shares no factor with 1000, so a total is only divisible by 1000 at 1000 seats, far above any seed launch's capacity.

| ID | Name | Rocket | Launch site | Price | Seats (min-total) | Status |
|---|---|---|---|---|---|---|
| `launch-1` | Lunar Flyby Alpha | Aurora Heavy | Cape Meridian Spaceport | 249999 | 2-6 | `published` |
| `launch-2` | Orbital Sunrise | Falcata 3 | Tierra Alta Launch Complex | 89999 | 1-4 | `published` |
| `launch-3` | Mars Transfer Pioneer | Helios Prime | Cape Meridian Spaceport | 1249999 | 1-2 | `published` |
| `launch-4` | Station Resupply Crew | Aurora Heavy | Tierra Alta Launch Complex | 59999 | 1-8 | `draft` |

All names are fictional, dates are in 2027, and all four keep `userId` set to `user-1`, so the seeded admin still owns them.

### Adjust the existing tests to the new contract
Only where the contract changes: `createLaunch` sends `rocket`, and the seed persistence test compares non-draft seed launches using `objectContaining`, because responses now add `availableSeats`. The status codes of existing scenarios stay as they are.

## Risks / Trade-offs

- [`availableSeats` can be out of date by the time a booking is sent] → The server still checks capacity on every booking, and the client handles the 400.
- [Published past launches can still be booked] → Accepted and listed as a non-goal. It can be added later without changing this design.
- [Scanning all bookings for each launch in the list] → Accepted for demo data held in memory.
- [Stale local data lacks `rocket`] → `api/README.md` documents deleting local `db/*.json` files.
