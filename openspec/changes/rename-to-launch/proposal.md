# Proposal

## Why

The API speaks about activities and participants, while the product is AstroBookings, which sells seats on rocket launches. Renaming now gives the API, the coming features and the React client one vocabulary, before any client depends on the old names.

## What Changes

- **BREAKING**: `/activities` becomes `/launches`, and activity IDs change from `activity-N` to `launch-N`.
- **BREAKING**: request and response fields change:
  - `maxParticipants` becomes `totalSeats`
  - `minParticipants` becomes `minSeats`
  - `location` becomes `launchSite`
  - `activityId` becomes `launchId`
  - `participants` becomes `seats`
  - the `activity` object in booking responses becomes `launch`
- **BREAKING**: error messages and validation field names use the new words, for example `Launch not found`.
- Rename the matching source files, types, classes, tests, data files and docs, and rename the package to `astro-bookings-api`.
- Change only the IDs and field names of the seed data. Launch-themed content comes with `extend-launch-api`.

Behaviour does not otherwise change: the same requests get the same status codes and the same logic applies. New fields and booking rules belong to `extend-launch-api`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `booking-api`: Every requirement that mentions activities, participants or `activityId` is restated in launch and seat vocabulary, and the old route and field names stop working.

## Impact

- **API**: breaking for any client. None exists yet, because `web-client` comes later.
- **Code**: `api/src/`, `api/tests/`, `api/db/seed/`, `api/README.md`, `api/package.json` and `api/package-lock.json`.
- **Local data**: any local `api/db/*.json` files use the old IDs and fields, and must be deleted. They are git-ignored demo data.
- **Dependencies**: none.
