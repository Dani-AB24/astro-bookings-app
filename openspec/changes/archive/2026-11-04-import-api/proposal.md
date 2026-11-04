# Proposal

## Why

The AstroBookings client needs a backend that exposes launches, rockets and available seats, which the sample API does not offer yet. Extending that API requires its code in this repo, under one OpenSpec root, and it has no automated tests to catch regressions, so a safety net must be in place before the rename and extensions that follow.

## What Changes

- Copy the sample API (`activity-bookings-express`, commit `68704a5`) into `api/` as a plain copy, without its git history.
- Import only `src/`, `db/seed/activities.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` and `README.md`.
- Do not import `specs/`, `.github/`, `.cursor/`, `AGENTS.md`, `PRD.md`, `ADD.md`, `CHANGELOG.md` or `client/`. That excludes the role agents, prompts, commands and the other 8 skills.
- Do not import the runtime data files `db/activities.json`, `db/bookings.json`, `db/payments.json` and `db/users.json`, and add them to `api/.gitignore`. The source's demo user and its plaintext password stay out of this repo.
- Add two of the API repo's skills to `.claude/skills/`: `coding-express-api` and `testing-playwright-e2e`, corrected where they no longer match this project.
- Add the API repo's TypeScript rules to `.claude/rules/`.
- Update `api/README.md`: credit the source repo and commit, replace `termsAccepted` with the real `terms` field, and remove the link to the excluded `specs/` folder.
- Add a Playwright request-level smoke test that records the API's current behaviour, including the error responses the rename could silently break.
- Fix two startup defects the smoke test exposed: a newly registered user cannot log in, and new records overwrite existing ones because services read their data before it is loaded.

Apart from those fixes, the API's behaviour does not change in this change. Renaming to `Launch`, the new fields and booking rules, and the React client are separate follow-up changes: `rename-to-launch`, `extend-launch-api` and `web-client`.

## Capabilities

### New Capabilities
- `booking-api`: The HTTP contract of the bookings backend, covering health, registration and login, public catalogue browsing, booking creation and retrieval, and the error format. This change captures the baseline, using the API's current vocabulary; later changes modify it.

### Modified Capabilities

None. No specs exist yet.

## Impact

- **Code**: adds `api/` and `.claude/rules/`, and two skills under `.claude/skills/`. No existing application code is affected, because this repo has none yet.
- **Dependencies**: adds `@playwright/test` as a dev dependency of `api/`. Tests use its HTTP client only, so no browser download is needed.
- **Tooling**: adds an `npm test` script in `api/`.
- **Attribution**: the source commit recorded in `api/README.md` becomes the only link to the original repo. That repo has no `LICENSE` file and declares `ISC` only in `package.json`.
