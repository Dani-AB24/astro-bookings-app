# Proposal

## Why

The briefing asks the client to show each launch's rocket and the seats available, and to stop customers exceeding them. The API exposes neither a rocket nor the seats left, and it accepts bookings on launches that are not open. This change gives the React client the data and rules it needs.

## What Changes

- Add a required `rocket` text field to launches.
- Add a computed, read-only `availableSeats` to every launch response. The calculation already exists for booking checks but is not exposed.
- **BREAKING**: creating a launch without `rocket` is rejected.
- **BREAKING**: only `published` launches can be booked, and `seats` must be a whole number.
- **BREAKING**: draft launches are hidden from the public list, search and detail routes.
- Include `rocket` in the launch details of booking responses.
- Make `PUT /launches/:id` update only editable fields. It currently merges the whole request body, so a client can overwrite `userId` and take over a launch.
- Replace the seed data with launch-themed content whose prices can never trigger the mock payment decline.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `booking-api`: The launch catalogue hides drafts and returns `rocket` and `availableSeats`, booking creation adds the published-only and whole-seat rules, and persistence wording accounts for computed fields. New requirements cover rockets, available seats, read-only fields and seed launches.

## Impact

- **Prerequisite**: `rename-to-launch` must be implemented and archived first, because this delta targets its renamed requirements. Until then, `openspec validate` is expected to report them as missing.
- **API**: breaking for launch creators and bookers, but no client exists yet.
- **Code**: `api/src/routes/launches.ts`, `api/src/routes/bookings.ts`, the launch and booking services and types, `api/db/seed/launches.json`, `api/tests/` and `api/README.md`.
- **Local data**: stored launches without `rocket` would break the contract, so local `api/db/*.json` files must be deleted.
- **Dependencies**: none.
