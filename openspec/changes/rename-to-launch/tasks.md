# Tasks

## 1. Prepare

- [x] 1.1 Create a `rename-to-launch` branch from `main`, and verify with `git branch --show-current` and a passing `npm test` in `api/` that the starting point is green

## 2. Rename

- [x] 2.1 With `git mv`, rename `src/routes/activities.ts`, `src/services/activity.service.ts`, `src/types/activity.ts`, `tests/activities.spec.ts` and `db/seed/activities.json` to their `launches` or `launch` names under `api/`, and verify with `git status` that they show as renames
- [x] 2.2 Apply the ordered replacements from `design.md` across `api/src`, `api/tests` and `api/db/seed`, including imports, types, classes, IDs, the `db/launches.json` paths, error messages, validation messages and log text. Verify that `npm run typecheck` passes
- [x] 2.3 Set the `GET /` message to `AstroBookings API`, rename the package to `astro-bookings-api` in `package.json` and `package-lock.json`, and verify that `npm ci` and `npm test` still work
- [x] 2.4 Read the test diff and verify that only vocabulary changed: no status code, assertion logic or test was altered or removed. Then verify with `npm test` that all existing tests pass

## 3. Lock in the new vocabulary

- [x] 3.1 Add tests for the `Launch vocabulary` requirement to `api/tests/launches.spec.ts`, and verify with `npx playwright test tests/launches.spec.ts`
- [x] 3.2 Update `api/README.md` to the launch and seat vocabulary, keeping the source links, and add a note to delete old local `db/*.json` files. Verify that the commands and endpoints it lists match `src/`
- [x] 3.3 Verify that `grep -rniE 'activit|participant' api/src api/db/seed api/package.json api/package-lock.json` finds nothing, and that the same search in `api/tests` and `api/README.md` finds only the vocabulary test and the source links

## 4. Final check

- [x] 4.1 From a clean `npm ci`, run `npm run typecheck`, `npm test` twice and `openspec validate rename-to-launch --strict`, start the API with no local `db/*.json` files, and verify that all checks pass and `GET /launches` returns the 4 seed launches
- [x] 4.2 Commit the rename on its own, and verify with `git show --stat HEAD` that it only touches `api/` and the OpenSpec change

## Workflow follow-up

- Archive this change before starting `extend-launch-api`, whose spec delta builds on these renamed requirements.
- OpenSpec does not let a `MODIFIED` requirement rename its scenarios, so the delta keeps 7 old scenario titles. Right after archiving, rename them in `openspec/specs/booking-api/spec.md`: `New activity beside seed data` to `New launch beside seed data`, `Admin manages a seed activity` to `Admin manages a seed launch`, `Registered user and seed activities` to `Registered user and seed launches`, `List activities` to `List launches`, `Read one activity` to `Read one launch`, `Another user's activity` to `Another user's launch`, and `Unknown activity` to `Unknown launch` in both requirements that use it.
- Then check `openspec validate booking-api --type spec --strict` and that the spec no longer contains `activit` or `participant` outside the `Launch vocabulary` requirement.
