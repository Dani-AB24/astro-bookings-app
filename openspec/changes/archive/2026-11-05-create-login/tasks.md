# Tasks

## 1. Prepare

- [x] 1.1 Verify that `init-react` is archived, using `openspec list --specs` to find `web-app-shell`. Then create a `create-login` branch from the updated `main`, and verify that `npm test` passes in `web/` and `openspec validate create-login --strict` passes

## 2. Session state

- [x] 2.1 Add `src/auth/session.ts` for reading, writing, and clearing the stored session, add the auth API calls and types, and send the bearer token from `src/api/client.ts` when a session exists. Verify with `npm run typecheck`; behaviour is covered by the tests in the following groups
- [x] 2.2 Add `AuthProvider`, clearing the query cache whenever the session changes, and add a test helper that registers a unique user. Verify with `npm run typecheck`

## 3. Registration

- [x] 3.1 Add failing tests in `web/e2e/auth.spec.ts` for the `Registration` requirement and verify that they fail
- [x] 3.2 Add the `/register` page with its CSS Module and field-level errors, and verify that the tests from 3.1 pass

## 4. Login

- [x] 4.1 Add failing tests for the `Login` requirement, including a login with the seeded admin account, and verify that they fail
- [x] 4.2 Add the `/login` page and verify that the tests from 4.1 pass

## 5. Session behaviour

- [x] 5.1 Add failing tests for the `Session display`, `Session persistence`, and `Logout` requirements, including an invalid stored session, and verify that they fail
- [x] 5.2 Add the session indicator and logout to the layout, and verify that the tests from 5.1 pass

## 6. Protected pages

- [x] 6.1 Add failing tests for the `Protected pages` and `Login pages when logged in` requirements and verify that they fail
- [x] 6.2 Add `RequireAuth`, the temporary `/bookings` page, the return to the original page, and the redirect away from the login pages. Verify that the tests from 6.1 pass

## 7. Documentation

- [x] 7.1 Add the seeded demo account and the session storage note to `web/README.md`, and verify by logging in with the documented account

## Workflow follow-up

- Archive this change before starting `list-launches`.
