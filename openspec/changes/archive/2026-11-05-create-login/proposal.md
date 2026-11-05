# Proposal

## Why

Booking and viewing bookings both need an access token, and the client from `init-react` has no way to get one. Registration is included so each person has their own bookings, rather than everyone sharing the seeded admin account.

## What Changes

- Add a registration page that uses `POST /users`, including the required terms checkbox.
- Add a login page that uses `POST /login`.
- Keep people logged in across page reloads, and let them log out.
- Show the logged-in username in the layout.
- Send people to log in when they open a page that needs an account, then return them to it.
- Add a temporary protected "My bookings" page, which `view-bookings` replaces.
- Add the bearer token to API requests.

## Capabilities

### New Capabilities
- `web-auth`: Registering, logging in, logging out, staying logged in, and protecting pages in the web client.

### Modified Capabilities

None.

## Impact

- **Depends on**: `init-react`.
- **Code**: new pages and auth state in `web/src/`, a token added in `web/src/api/client.ts`, and a session indicator in the layout.
- **APIs**: consumes `POST /users` and `POST /login`, with no API changes.
- **Security**: the token is kept in browser storage, which any script on the page could read. The briefing excludes security from this stage.
