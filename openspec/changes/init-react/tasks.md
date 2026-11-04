# Tasks

## 1. Prepare

- [ ] 1.1 Create an `init-react` branch from the updated `main`, and verify that `npm test` passes in `api/` and `openspec validate init-react --strict` passes

## 2. Scaffold

- [ ] 2.1 Scaffold `web/` with Vite's `react-ts` template, remove the demo content, and add `react-router-dom` and `@tanstack/react-query`. Verify that `npm run build` passes in `web/`
- [ ] 2.2 Add `dev`, `build`, `typecheck`, and `test` scripts and ignore `test-results/` and `playwright-report/` in `web/.gitignore`. Verify that `npm run typecheck` passes and `git status` lists no generated files

## 3. Test setup

- [ ] 3.1 Add `@playwright/test`, matching the version in `api/`, and `web/playwright.config.ts` with the two servers from design.md. Verify that a trivial test loading `/` passes with `npm test`, and that no `api-smoke-*` temporary directory is left behind afterwards

## 4. Layout and pages

- [ ] 4.1 Add failing tests in `web/e2e/app-shell.spec.ts` for the `Shared layout` and `Unknown pages` requirements, and verify that they fail
- [ ] 4.2 Add `src/styles/global.css`, the router, the layout, a temporary home page, and the not-found page, each with its CSS Module, and verify that the tests from 4.1 pass

## 5. API client

- [ ] 5.1 Add failing tests for the `API availability notice` requirement, using `page.route()` to abort `/health` for the failure case and asserting the healthy case gets a 200 from the test API on port 3100. Verify that they fail
- [ ] 5.2 Add `src/api/client.ts` with `ApiError` and the `VITE_API_URL` fallback, add the query client, and add the notice to the layout. Verify that the tests from 5.1 pass, which also confirms the `Configured address` scenario, and confirm the `Default address` scenario by running `npm run dev` with the API on port 3000 and seeing no notice

## 6. Documentation

- [ ] 6.1 Add `web/README.md` covering installing both projects, the Chromium install, running both servers, `VITE_API_URL`, and the tests, and link it from the root `README.md`. Verify by following the README from a clean clone

## Workflow follow-up

- Archive this change before starting `create-login`, which builds on it.
