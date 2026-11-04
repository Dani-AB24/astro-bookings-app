# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AstroBookings is a fictional rocket launch booking system for a spec-driven development course. It is for demos and training, so it has no production security or real database.

- `api/`: the Express and TypeScript backend. It is a standalone npm project.
- `web/`: the planned React client, which does not exist until the `init-react` change is applied. It will also be a standalone npm project, and there is no root `package.json` or workspace.
- `openspec/`: specs and planned changes.

## Commands

Run these from `api/`:

```bash
npm install
npm run dev                                  # start on port 3000, or PORT if set
npm run typecheck
npm run build
npm test                                     # all Playwright API tests, no browser download
npx playwright test tests/bookings.spec.ts   # one file
npx playwright test -g "remaining capacity"  # tests matching a title
```

There is no linter configured.

The demo account is `admin@astrobookings.example` / `admin-demo-password`. It owns the seed launches and has no special permissions.

## Spec-driven workflow

Behaviour changes go through OpenSpec:

1. `/opsx:explore` to think a change through.
2. `/opsx:propose` to create its proposal, specs, design, and tasks.
3. `/opsx:apply` to implement it.
4. `/opsx:archive` to merge its delta specs into `openspec/specs/`.

`openspec/specs/booking-api/spec.md` is the API's contract, so check it before changing API behaviour, and update it through a change.

### Planned client changes

The client is planned as five changes in `openspec/changes/`. Apply and archive them in this order, because each builds on the ones before it:

1. `init-react`
2. `create-login`
3. `list-launches`
4. `book-seats`
5. `view-bookings`

Their `design.md` files hold the client's stack and architecture decisions. Past changes used one branch per change, named after the change.

## API architecture

Requests flow in one direction: `routes/` handle HTTP and error mapping, `services/` hold business rules and validation, and `repositories/` store data.

- **Shared instances**: repositories are created in `utils/data-loader.ts`. `launchService`, `userService`, and `bookingService` are exported as shared instances from their service files, and routes must use those rather than creating their own, because services keep their own ID counters.
- **Persistence**: `JsonRepository` keeps a `Map` in memory and writes to `db/*.json`. On load it merges `db/seed/`, with saved data taking precedence. Paths are relative to the working directory. Only `db/seed/` is tracked by git.
- **Errors**: services throw an `Error`, and each route maps its `message` text to a status code. Changing a service's error message can therefore change the HTTP response. Response bodies use `{ message, errors: [{ field, message }] }`.
- **Computed fields**: `availableSeats` is never stored. `toLaunchResponse` in `routes/launches.ts` adds it to launch responses.
- **Payments**: `POST /bookings` charges `MockPaymentGateway` immediately, and it declines any total divisible by 1000. Seed launch prices must never produce such a total, as the `Seed launches` requirement states.

## API behaviour that is easy to get wrong

- The API never sets `sold-out` itself, so a full launch can still be `published`. Use `availableSeats` to tell whether a launch is full.
- `minSeats` is not checked per booking.
- `POST /bookings` returns the booking without `launch`, while the GET routes include it, even though `api/README.md` suggests otherwise.
- `user.id` in auth responses is a number, while `booking.userId` and stored user IDs are strings such as `user-1`.
- There is no route to fetch the current user, and bookings cannot be cancelled.
- Deleting a launch that has bookings makes `GET /bookings` respond 500 for the people who booked it.

## Tests

`api/playwright.config.ts` starts `tests/support/start-test-server.ts` on port 3100. It runs the API from a temporary copy of the seed data, so tests never touch local `db/` files. All tests in a run share that server, so create unique users and launches with `tests/support/helpers.ts` rather than relying on exact seed state.

Past changes wrote failing tests first, with each test tied to a spec requirement.

## Conventions

- TypeScript rules are in `.claude/rules/typescript.md`.
- The `coding-express-api` and `testing-playwright-e2e` skills cover API endpoints and API tests, and `react-best-practices` covers the client.
