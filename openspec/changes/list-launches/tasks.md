# Tasks

## 1. Prepare

- [ ] 1.1 Verify that `create-login` is archived, using `openspec list --specs` to find `web-auth`. Then create a `list-launches` branch from the updated `main`, and verify that `npm test` passes in `web/` and `openspec validate list-launches --strict` passes

## 2. Shared launch code

- [ ] 2.1 Add the launch types, the launch API calls, `getLaunchAvailability`, the formatters, and test helpers that create launches and book seats through the API. Verify with `npm run typecheck`; behaviour is covered by the tests in the following groups

## 3. Launch list

- [ ] 3.1 Add failing tests in `web/e2e/launches.spec.ts` for the `Launch list` and `Finished launches hidden from the list` requirements and verify that they fail
- [ ] 3.2 Replace the temporary home page with the launch list and its CSS Module, and verify that the tests from 3.1 pass

## 4. Launch detail

- [ ] 4.1 Add failing tests for the `Launch detail` requirement and verify that they fail
- [ ] 4.2 Add the `/launches/:id` page and its not-found state, and verify that the tests from 4.1 pass

## 5. Availability and page states

- [ ] 5.1 Add failing tests for the `Launch availability` requirement on both pages, including a full launch whose status is still `published`, and verify that they fail
- [ ] 5.2 Show the availability markers on both pages, and verify that the tests from 5.1 pass
- [ ] 5.3 Add failing tests for the `Launch page states` requirement using `page.route()`, then add the loading, error with retry, and empty states. Verify that the tests pass

## Workflow follow-up

- Archive this change before starting `book-seats`, which adds its form to the detail page.
