# Design

## Context

See `proposal.md` for motivation and `specs/booking-api/spec.md` for the contract. The rename touches about 400 lines across 20 files in `api/`. Three things in the current code decide how it must be done:

- **Errors are matched by text.** Routes compare messages thrown by services, such as `error.message === 'Activity not found'`. The compiler cannot catch a half-renamed message, but the API tests can.
- **Runtime paths and IDs are strings.** `data-loader` names `db/activities.json`, and services build `activity-${id}`. Neither is checked by the compiler.
- **The field list is not one-to-one with words.** `maxParticipants` becomes `totalSeats` rather than `maxSeats`, so a single search-and-replace on "participants" would produce the wrong name.

## Goals / Non-Goals

**Goals:**
- Leave no `activit` or `participant` in API code, tests, seed data or docs, except links to the source repo.
- Keep behaviour identical, so that any test failure points at a mistake in the rename.

**Non-Goals:**
- New fields, new rules or launch-themed seed content, which belong to `extend-launch-api`.
- Refactoring, including the validation duplication and default exports.
- Renaming `name`, `slug`, `date`, `duration`, `price` or the status values. They already read correctly.
- Compatibility aliases for the old routes or fields. No client exists yet.
- Editing the archived `import-api` change, which is a historical record.

## Decisions

### Rename with an ordered script, then read the diff
Move files with `git mv`, and apply one ordered replacement list across `api/src`, `api/tests`, `api/db/seed` and `api/README.md`. The specific names go first: `maxParticipants` to `totalSeats`, `MaxParticipants` to `TotalSeats`, `minParticipants` to `minSeats`, `activityId` to `launchId`, and `location` to `launchSite`. Generic words follow, with article fixes such as "an activity" to "a launch". Error text changes in the same pass, so services and routes cannot disagree.

Hand-editing about 400 lines was rejected as more error-prone, and an editor rename was rejected because it would miss strings.

### Update tests and code together, and treat assertions as frozen
Tests get the same replacements as the code and nothing else. A passing run then shows that behaviour survived, because expected status codes and logic are unchanged. If a test fails, fix the rename and do not relax the test.

Only one test is added: old routes and fields no longer work, which is the one behaviour this change sets out to remove.

### Commit the rename on its own
Keep the rename in a single commit with no other changes, so `extend-launch-api` starts from a clean, vocabulary-only step that is easy to review or revert.

### Reset local data instead of migrating it
Rename the seed file to `db/seed/launches.json` and tell developers to delete local `db/*.json` files. These are git-ignored demo files, and a migration script would be thrown away immediately.

The tests start from a temp copy of the seed, so they do not need this reset.

## Risks / Trade-offs

- [A string is missed, such as a message or a file path] → A final `grep` for `activit` and `participant`, plus the API tests that assert exact messages.
- [OpenSpec refuses scenario renames inside a `MODIFIED` requirement, so 7 scenario titles keep the old words until archive] → `tasks.md` lists them for renaming in the main spec straight after archiving.
- [Stale local data files make the API start with old records] → `api/README.md` documents deleting them, and `db/activities.json` is simply no longer read.
- [Not every message is asserted by tests, such as `You can only update your own activities`] → The scripted pass covers them, and the final `grep` proves no old word survives.
