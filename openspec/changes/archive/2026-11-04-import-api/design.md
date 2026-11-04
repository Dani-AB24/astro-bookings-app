# Design

## Context

See `proposal.md` for motivation and scope, and `specs/booking-api/spec.md` for the behaviour being recorded.

This repo currently holds only docs and OpenSpec setup. The source API is an Express and TypeScript app with no tests; `npm run typecheck` is its only automated check. Four things about it shape this design:

- **Errors are matched by text.** Routes compare `error.message` strings thrown by services, such as `Activity not found`. The compiler cannot catch a mismatch, so a partial rename can turn a 404 into a 400.
- **Data paths are relative to the working directory.** Repositories read and write `db/*.json`, and every write goes to those files.
- **Payment failure is deterministic.** The mock gateway declines any charge divisible by 1000.
- **Startup is wired incorrectly.** Found by the smoke test: services are created before the data loads, and the users and login routes each hold a separate `UserService` with its own email index.

## Goals / Non-Goals

**Goals:**
- Bring the API in with only the agreed files.
- Leave a passing test suite that the `rename-to-launch` change can rely on.
- Keep the imported code reviewable as an unmodified copy of the source.

**Non-Goals:**
- Fixing API behaviour beyond the startup defects, including known gaps such as bookable draft activities and fractional `participants`. The smoke test records current behaviour only where the spec lists it, and these gaps belong to `extend-launch-api`.
- Renaming anything, including the `activity-bookings-express` package name.
- A root workspace or a single command to start `api/` and `web/`. There is no `web/` yet.
- Exhaustive API test coverage.

## Decisions

### Copy from an allowlist of paths
Export commit `68704a5c146a154f58827df8f57dee8a87e38e12` with `git archive`, naming only the paths to import.

An allowlist means a file nobody considered stays out by default. Copying everything and deleting exclusions would fail in the opposite direction. `git subtree` was rejected because it would bring in all the excluded files, and filtering history first needs an extra tool for history nobody asked to keep.

`client/` can be dropped safely, because nothing in `src/` or `tsconfig.json` refers to it.

### Track only the seed data
Import `db/seed/activities.json` and ignore `db/*.json`, which the API creates and rewrites at runtime. This keeps a plaintext demo password out of the repo and stops ordinary dev runs from dirtying the working tree. The ignore rule does not match the seed file, because it lives in `db/seed/`.

From the code, the repositories treat a missing data file as empty and create it on first write, so the API should start with seed activities and no users. Task 1.5 checks this. The trade-off is that there is no ready-made login, so a user must register first.

### Commit the verbatim copy on its own
The first commit contains the copied files unmodified, and every edit follows in later commits. This keeps "what came from upstream" separable from "what we changed" once the source history is gone.

### Test over HTTP with Playwright's request client
Use `@playwright/test` and its `request` fixture, without launching a browser. This tests status codes and bodies through the real stack, so it does not depend on internal names and survives the rename with only vocabulary edits. It also matches the imported `testing-playwright-e2e` skill. A unit-test runner was rejected because it would have to import the classes the rename is about to change.

### Run the test server against a throwaway copy of the data
Playwright starts `api/tests/support/start-test-server.ts` through its `webServer` setting on port 3100. The script copies only `db/seed/` to the same path in a new temp directory, changes into it, and only then imports `src/index`.

The data paths are relative, so this needs no change to application code, test runs cannot touch local `db/` files, and each run starts from the same data regardless of any local dev data. Adding a configurable data path was rejected because it would change application code in a change meant to preserve it.

### Tests create their own data
Each test registers a uniquely named user and creates any activity it needs through the API, using a far-future date. The 402 test creates an activity priced at 500 and books 2 seats, and the capacity test creates one with a small `maxParticipants`. Tests therefore do not depend on the seed data, which `extend-launch-api` will replace.

### Treat the smoke test as a record of behaviour
The test describes what the API does now. If a run shows the API differing from `specs/booking-api/spec.md`, correct the spec and the test to match the API, and report the difference. The startup fix below is the only exception, agreed because recording those defects would make broken login the specified behaviour.

### Fix the startup defects in their own commit
Load the data when `data-loader` is first imported, instead of from `index.ts` after the routes have been imported. Any service that imports a repository then sees loaded data, without changing how routes are wired. Export one shared `userService`, so that registration and login use the same email index.

Commit the smoke test first, then the fix with its regression tests, so the fix stays separately reviewable. Rebuilding the index on every lookup was rejected because it leaves the duplicated instances in place.

A restart test starts its own server process twice on one temp directory, because the shared Playwright server cannot be restarted during a run.

### Adapt the imported AI tooling to this repo
- Skills go in `.claude/skills/<name>/`. `coding-express-api` keeps its `controller.ts`, `service.ts` and `types.ts` templates.
- In `coding-express-api`, replace the in-memory `Map` guidance, in both `SKILL.md` and the `service.ts` template, with the repository pattern the API uses.
- In `testing-playwright-e2e`, point the acceptance-criteria references at `openspec/specs/` instead of the excluded `specs/` folder.
- The two copies of the TypeScript rules differ only in their frontmatter. Use the shared body in `.claude/rules/typescript.md`, with `paths: "**/*.ts"` as the frontmatter.
- The rules apply to new code. Existing code that departs from them, such as `export default router`, is left alone here.

## Risks / Trade-offs

- [The API stores passwords in plaintext in the now-ignored `db/users.json`] → Accepted as a demo limitation, since the briefing rules out production use. Local files stay out of git, but users should not register with a real password.
- [Source history is lost] → The README records the source repo and full commit hash.
- [The smoke test covers only part of the API] → It targets the error paths the rename can silently break, and `rename-to-launch` should also run `npm run typecheck`.
- [`npm run typecheck` does not cover `tests/`, because `tsconfig.json` includes only `src/`] → Accepted. Playwright runs the tests directly, so a broken test fails when run.
