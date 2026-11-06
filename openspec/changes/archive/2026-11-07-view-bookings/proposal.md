# Proposal

## Why

The briefing's final requirement is to show booking status and let customers view their bookings. Until now, the confirmation after booking is the only record a customer sees, and `/bookings` is still a temporary page.

## What Changes

- Replace the temporary `/bookings` page with the person's real bookings, newest first.
- Show each booking's launch details, seats, payment status, and launch status.
- Link each booking to its launch.
- Add loading, empty, and error states.

Cancelling bookings is not included, because the API has no route for it. A separate page for each booking is also not included, because the list already shows everything the API returns about it.

## Capabilities

### New Capabilities
- `web-booking-history`: Viewing a person's own bookings and their status in the web client.

### Modified Capabilities

None.

## Impact

- **Depends on**: `create-login` for the protected page, `list-launches` for the launch page and formatters, and `book-seats` for the 401 handling and for creating bookings through the interface.
- **Code**: replaces the temporary page in `web/src/pages/`, and adds booking types.
- **APIs**: consumes `GET /bookings`, with no API changes. `GET /bookings/:id` is not used.
