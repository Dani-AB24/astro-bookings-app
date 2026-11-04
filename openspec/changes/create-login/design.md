# Design

## Context

`POST /users` and `POST /login` both return `{ user, accessToken }`. There is no route to fetch the current user, and the token carries only `userId` and `email`, so the username exists only in that response. Tokens last 24 hours. Validation errors arrive as `errors: [{ field, message }]`, while a wrong password has only `message`.

`user.id` in these responses is a number, produced by `parseInt` in `api/src/routes/auth.ts` and `users.ts`, while `Booking.userId` is a string such as `user-1`. The two cannot be compared.

## Goals / Non-Goals

**Goals:**
- A session that survives reloads and is available to any component.
- Forms that show the API's own validation messages.

**Non-Goals:**
- Reacting to expired tokens. No request in this change sends a token to a protected route, so `book-seats` adds this with the first one.
- Password reset, profile editing, and token refresh, which the API does not offer.

## Decisions

**Store `{ user, accessToken }` together in `localStorage`.** Saving only the token would lose the username on reload. Use one key, `astrobookings.session`, read through a small module that treats missing or invalid JSON as no session. `localStorage` is readable by scripts on the page, which is acceptable because the briefing excludes security at this stage. An `httpOnly` cookie would be the safer choice but needs API changes.

**`AuthProvider` context over that storage.** It exposes `user`, `login`, `register`, and `logout`. The API client reads the token straight from the storage module, not from React, so it needs no hooks. This is the app's only shared client state, so a state library is unnecessary.

**Clear the query cache whenever the session changes.** Otherwise one person's cached bookings could appear for the next person using the browser.

**The API decides what is valid.** Forms use `noValidate` and show `errors` by `field`, with `message` for errors without a field. Repeating the rules in the client would add a second copy to keep in step, and the API's messages are already readable. Submit buttons are disabled while a request is pending.

**`RequireAuth` route wrapper with router state.** It redirects to `/login` with the original location in router state. The login and register pages read it, and pass it to each other through their links. Router state, rather than a `?returnTo=` parameter, means the destination cannot be set by a crafted link, and needs no validation. The cost is losing the destination on a hard reload of the login page, which then falls back to the home page.

**Temporary `/bookings` page.** This change needs a protected page to test against, and it gives the layout's bookings link a destination. It says that bookings are coming, and `view-bookings` replaces it.

**Test accounts.** Tests register unique users with the shared helpers, rather than logging in as the seeded admin, so they stay independent. One test logs in with `admin@astrobookings.example` to confirm that the seeded account works from the client.

## Risks / Trade-offs

- [A stale token looks logged in until a request fails] → Accepted here, because the API has no route to check a token. `book-seats` handles the resulting 401.
- [`GET /bookings` could validate the session on load] → Rejected, as it adds a request to every page load only to learn something the next real request reveals anyway.
