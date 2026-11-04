# Design

## Context

`GET /bookings` returns only the caller's bookings, each with `paymentStatus` and a `launch` object holding the launch's current name, rocket, price, date, duration, site, and status. `paymentStatus` can be `pending`, `paid`, or `refunded`. New bookings are always `paid`, as a declined payment creates no booking.

`enrichBookingWithLaunch` in `api/src/services/booking.service.ts` throws when a booking's launch no longer exists, and `DELETE /launches/:id` does not check for bookings. So if an owner deletes a launch that has bookings, `GET /bookings` responds 500 for every person who booked it, for their whole list.

## Goals / Non-Goals

**Goals:**
- Show what the customer has booked and what state it is in.

**Non-Goals:**
- Cancelling bookings, as the API has no route for it.
- Fixing the deleted-launch failure in the API. See Risks.

## Decisions

**List page only, with no `/bookings/:id` page.** The list has every field the API returns, so a detail page would repeat it. Each booking links to its launch for more information. It is simple to add later if bookings gain more details.

**Do not show a total paid.** The response includes the launch's current `price`, not the amount charged, so `price × seats` would be wrong after an owner changes the price. Showing an unreliable payment figure is worse than leaving it out. A correct total needs the API to return the charged amount.

**Sort by `createdAt` in the client.** `GET /bookings` has no sort parameters.

**Query key `['bookings']`.** `book-seats` already invalidates it after a booking, and `AuthProvider` clears the cache when the session changes, which provides the `Own bookings only` behaviour across people.

**Status labels in one place.** Map payment statuses to Paid, Pending, and Refunded. Map launch statuses to Open for booking, Confirmed, Sold out, Completed, Cancelled, and Draft. Show an unknown value as-is so that a future API status stays visible instead of breaking the page. Use the same launch status labels as the launch pages.

**Tests.** Real bookings are made through the API helpers. A cancelled launch uses a real status change by its owner. `pending` and `refunded` use `page.route()`, because nothing in the API currently produces them for a new booking. The server error also uses `page.route()`. A session expiring uses a tampered token.

## Risks / Trade-offs

- [One deleted launch makes the whole list fail with a 500] → The client can only show the retry state. The fix belongs in the API, either keeping or blocking the deletion, and is a separate follow-up change that this one does not block.
- [Booking details show the launch's current data, not data from the time of booking] → Accepted, since a changed date or status is what a customer needs to see.
