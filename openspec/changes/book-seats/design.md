# Design

## Context

`POST /bookings` takes `{ launchId, seats }` and charges immediately. It returns the booking with `paymentStatus` but without the `launch` details that the GET routes include. Failures use different shapes: `seats` validation has `errors`, capacity and closed launches have only `message` with status 400, a declined payment is 402, and an unknown launch is 404. A failed booking changes nothing. `minSeats` is not checked per booking. The API has no idempotency key, so a repeated request creates and charges a second booking.

## Goals / Non-Goals

**Goals:**
- Stop bookings over the limit in the form, and handle the API's refusal when the form's information was stale.
- Reuse the session and availability code from earlier changes.

**Non-Goals:**
- Cancelling bookings, as the API has no route for it.
- Real-time seat updates.
- A separate payment step. The mock gateway needs no card details.

## Decisions

**Check seat limits in the form, unlike the login forms.** `create-login` leaves validation to the API, but here the briefing explicitly requires not exceeding the seats, and a check saves a failed charge attempt. The API remains the final authority, since the count can be stale. The input keeps its raw text, so an empty field or a fraction can be detected rather than being coerced into a number.

**No separate confirmation dialog.** The button states the seats and total, for example "Book 2 seats for $179,998", so the charge is clear at the moment of clicking. A dialog would add a step that a mock payment does not justify.

**Use a mutation, and disable the button while pending.** With no idempotency key, the disabled state is what prevents double charges from the client.

**After any response that may have changed seats, invalidate `['launches']`.** Invalidating that prefix also covers `['launches', id]`. Do it on success, and on 400 responses, whose cause may be stale data. Also invalidate `['bookings']` on success so that `view-bookings` starts fresh. The returned booking has no `launch` details, but the page already has them, so no extra request is needed for the confirmation.

**Map failures by status, and show the API's `message`.** 402 gets client text that adds "no booking was made", because the API's `Payment could not be processed` does not say so. Other responses show the API's `message`, and network failures show a generic message. Seats errors from the API appear beside the input. Matching on `Capacity exceeded` is not needed, because every 400 shows its message and refetches.

**Handle 401 in the client, only for requests that carried a token.** `client.ts` calls a handler registered by `AuthProvider`, which clears the session and sets a `sessionExpired` flag. A component in the layout sees the flag and navigates to `/login` with the current location in router state, because the launch page is public and `RequireAuth` would not redirect from it. Only reacting when a token was sent means a wrong password on `POST /login`, also a 401, is not treated as an expired session. Handling this in each page was rejected, since `view-bookings` needs the same behaviour.

**Tests use the real API by default.** Success, the last seats, closed launches, and full launches run against launches created by the helpers. As agreed, the 402 and stale capacity responses use `page.route()`. An expired session uses a tampered token in `localStorage`, which the real API rejects with 401.

## Risks / Trade-offs

- [Two tabs or a slow double click could still double-book] → The disabled button covers the same page, and an API idempotency key would be needed for full protection. This is acceptable for a mock payment.
- [Mocked 402 responses could drift from the API] → The API's own tests cover the real 402, and the status is in the `booking-api` spec.
- [A person loses the seat count they entered when redirected to log in] → Accepted, as it is rare and simple to re-enter.
