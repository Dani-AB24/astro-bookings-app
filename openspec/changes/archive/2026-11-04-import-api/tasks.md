# Tasks

## 1. Import the API

- [x] 1.1 Create an `import-api` branch from `main` and verify with `git branch --show-current`
- [x] 1.2 Export commit `68704a5c146a154f58827df8f57dee8a87e38e12` of `https://github.com/Programacion-Inteligente/activity-bookings-express` into `api/`, using `git archive` with only `src`, `db/seed/activities.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` and `README.md`. Verify that `api/` contains exactly those entries and that `specs`, `.github`, `.cursor`, `client`, `AGENTS.md`, `PRD.md`, `ADD.md`, `CHANGELOG.md` and the `db/*.json` runtime files are absent
- [x] 1.3 Commit the unmodified copy on its own and verify with `git show --stat HEAD` that it only touches `api/`
- [x] 1.4 Add `db/*.json` to `api/.gitignore`, and verify with `git check-ignore` that `api/db/users.json` is ignored and `api/db/seed/activities.json` is not
- [x] 1.5 Run `npm ci` and `npm run typecheck` in `api/`, then start `npm run dev` and verify that `GET /health` returns 200 and `GET /activities` returns the seed activities. Verify with `git status` that the run left no untracked or modified files under `api/db/`

## 2. Add the smoke test

- [x] 2.1 Add `@playwright/test` as a dev dependency and an `npm test` script (`playwright test`) in `api/`, add `test-results/` and `playwright-report/` to `api/.gitignore`, and verify `npx playwright --version` runs without downloading browsers
- [x] 2.2 Add `api/tests/support/start-test-server.ts`, which copies only `db/seed/` to the same path in a new temp directory, changes into it and then imports `src/index`, and `api/playwright.config.ts`, which starts it through `webServer` on port 3100 with `/health` as the readiness check. Verify the server starts and `GET /health` returns 200 on port 3100
- [x] 2.3 Add shared test helpers that register a uniquely named user and create an activity through the API, using a far-future date. Verify by using them in the tests from tasks 2.4 to 2.6
- [x] 2.4 Add `api/tests/auth.spec.ts` covering the health, standard error format, registration, login and authenticated endpoint requirements in `specs/booking-api/spec.md`, and verify with `npx playwright test tests/auth.spec.ts`
- [x] 2.5 Add `api/tests/activities.spec.ts` covering the public catalogue and status ownership requirements, and verify with `npx playwright test tests/activities.spec.ts`
- [x] 2.6 Add `api/tests/bookings.spec.ts` covering the booking creation and retrieval requirements, including the 400, 402 and 404 responses, and verify with `npx playwright test tests/bookings.spec.ts`
- [x] 2.7 Make the test server remove its temp directory when stopped, using Playwright's `gracefulShutdown` setting, and verify that no `api-smoke-*` directory remains after `npm test`
- [x] 2.8 Commit the smoke test on its own, before the fix, and verify with `git show --stat HEAD` that it does not touch `api/src/`
- [x] 2.9 Add regression tests for the data persistence requirement, including a restart test in `api/tests/persistence.spec.ts`, and verify they fail against the unfixed API
- [x] 2.10 Load data on first import of `data-loader` and share one `userService`, then verify that the regression tests and `npx playwright test tests/auth.spec.ts` pass. Commit the fix with its tests, and verify with `git show --stat HEAD` that it touches only the startup files and tests
- [x] 2.11 Run `npm test` twice and verify that both runs pass, that `git status` shows no changes under `api/db/`, and that any local `api/db/*.json` files are left unmodified

## 3. Update the API README

- [x] 3.1 In `api/README.md`, credit the source repo and full commit hash, replace `termsAccepted` with `terms`, remove the link to `specs/`, and document `npm test`. Verify with `grep -nE 'termsAccepted|specs/' api/README.md` finding nothing, and that `npm test` runs as documented
- [x] 3.2 Add a short section to the root `README.md` describing `api/` and pointing to `api/README.md`, leaving the rest of the file as is. Verify that the link resolves

## 4. Add the AI tooling

- [x] 4.1 Copy `coding-express-api` with its three templates to `.claude/skills/coding-express-api/`, and replace the in-memory `Map` guidance in `SKILL.md` and `service.ts` with the repository pattern used in `api/src/repositories/`. Verify with `grep -n 'in-memory\|new Map' .claude/skills/coding-express-api/*` finding nothing
- [x] 4.2 Copy `testing-playwright-e2e` to `.claude/skills/testing-playwright-e2e/`, and point its acceptance-criteria references at `openspec/specs/`. Verify that `grep -nE '(^|[^/])specs/' .claude/skills/testing-playwright-e2e/SKILL.md` finds nothing
- [x] 4.3 Add `.claude/rules/typescript.md` with the shared rules text and `paths: "**/*.ts"` frontmatter. Verify that the file exists with that frontmatter and that its body matches the source rules
- [x] 4.4 Verify that only the two chosen skills were added, using `git status --short .claude/skills`, and that no `.github/` or `.cursor/` folder exists in the repo or in `api/`

## 5. Final check

- [x] 5.1 From a clean `npm ci` in `api/`, run `npm run typecheck`, `npm test` and `openspec validate import-api --strict`, verify all three pass, and verify `git status` shows only intended changes
