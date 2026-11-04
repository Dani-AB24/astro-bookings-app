# Proposal

## Why

The briefing requires customers to book seats on a launch without exceeding those available. This is the app's core action, and it charges the mock gateway immediately, so failures such as stale seat counts and declined payments must be clear to the customer.

## What Changes

- Add a booking form to the launch detail page, with a seat count limited to the seats available and a running total.
- Ask anonymous visitors to log in or register first, then return them to the launch.
- Show a confirmation after booking, and refresh the seat count without a reload.
- Add specific handling for capacity errors, declined payments, and launches that have closed.
- Log people out and send them to log in when their session has expired. This is the first change with a request that can reveal one.

## Capabilities

### New Capabilities
- `web-seat-booking`: Booking seats on a launch from the web client, including the seat limits, the confirmation, and each failure.

### Modified Capabilities
- `web-auth`: Adds the behaviour for an expired or invalid session. This capability is created by `create-login`, which must be archived first.

## Impact

- **Depends on**: `create-login` for sessions and `list-launches` for the detail page and availability rule.
- **Code**: a booking form on the detail page, booking API calls, and 401 handling in `web/src/api/client.ts` and `AuthProvider`.
- **APIs**: consumes `POST /bookings`, with no API changes.
