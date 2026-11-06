# Tasks

Run commands from `web/`. Each group ends with `npm run typecheck` and `npm test` passing, so a regression is caught in the group that caused it.

## 1. Tokens and shared button style

- [x] 1.1 Add `--color-highlight`, `--color-highlight-hover`, `--color-on-highlight`, `--form-width`, and `--column-width` to `:root` in `src/styles/global.css`, as listed in design.md. Verify that `npm run build` succeeds.
- [x] 1.2 Create `src/components/button.module.css` with a base `.button` rule and `.primary` and `.secondary` variants that use `composes: button`. Include hover, `:focus-visible` (blue outline), and `:disabled` (`opacity: 0.6; cursor: not-allowed`) states, plus `display: inline-flex` and `text-decoration: none` so the classes work on links. Verify that `npm run typecheck` accepts imports of `buttonStyles.primary` and `buttonStyles.secondary`.

## 2. Apply buttons to existing buttons and action links

- [x] 2.1 Header (`session-nav.tsx`): Register becomes primary, while Log in, My bookings, and the Log out button become secondary. Delete `.logout` from `session-nav.module.css`. Verify that `npx playwright test e2e/auth.spec.ts` passes.
- [x] 2.2 Auth pages (`login-page.tsx`, `register-page.tsx`): the submit buttons become primary. Delete `.submit` from `auth-form.module.css`. Keep the "Create an account" and "Log in" sentence links as text links. Verify that `npx playwright test e2e/auth.spec.ts` passes.
- [x] 2.3 Booking (`booking-form.tsx`, `booking-section.tsx`, `booking-confirmation.tsx`): the Book submit and "Log in to book seats" become primary, and "View my bookings" becomes secondary. Replace `.submit` in `booking-form.module.css` with a layout-only class that keeps `justify-self: start`. Verify that `npx playwright test e2e/booking.spec.ts` passes.
- [x] 2.4 Navigation links (`launch-detail-page.tsx`: "All launches" and "Back to the launch list"; `bookings-page.tsx`: "Browse launches"; `not-found-page.tsx`: "Back to the home page") become secondary. Verify that `npx playwright test e2e/launches.spec.ts e2e/bookings.spec.ts` passes.
- [x] 2.5 Load error (`load-error.tsx`): "Try again" becomes secondary. Delete `.retry` from `load-error.module.css`. Verify that the "Try again" tests in `e2e/launches.spec.ts` and `e2e/bookings.spec.ts` pass.
- [x] 2.6 Check that no button styles are left duplicated: `grep -rn "\.submit\|\.retry\|\.logout" src` should return nothing.

## 3. Centred page columns

- [x] 3.1 In `auth-form.module.css`, set `.page` to `max-width: var(--form-width); margin-inline: auto`. Verify with `npm run dev` that the login and register forms are centred and wider than before.
- [x] 3.2 In `launch-detail-page.module.css`, set `.page` to `max-width: var(--column-width); margin-inline: auto`, and remove `max-width: 32rem` from `.facts` and from `.section` in `booking-section.module.css`. Verify with `npm run dev` that the detail page, its booking form, and the "Launch not found" view are centred, with the facts and booking section the same width. Then run `npx playwright test e2e/launches.spec.ts e2e/booking.spec.ts`.

## 4. Shared cards with distinct, clickable titles

- [x] 4.1 Add a failing e2e test to `e2e/launches.spec.ts`, under "Launch list", for the "selects a launch" scenario. It clicks the Orbital Sunrise card on its rocket fact, outside the title, and expects the URL `/launches/launch-2`. Add a matching test to `e2e/bookings.spec.ts` for "Open the launch", clicking a booking card's Seats fact. Verify that both fail before 4.2.
- [x] 4.2 Create `src/components/card.module.css` with `.card` (`position: relative`, orange border on hover, outline on `:focus-within`), `.title` (1.35rem, weight 700, light colour, bottom border divider, link without underline that becomes underlined and orange on hover or focus, and a link `::after` with `position: absolute; inset: 0`), and `.facts`. Add a comment explaining the stretched-link pattern. Verify that `npm run build` succeeds.
- [x] 4.3 Move `home-page.tsx` and `bookings-page.tsx` onto `card.module.css`, and delete the duplicated `.card`, `.name`, and `.facts` rules from their page modules, keeping `.seats`. Verify that the tests from 4.1 now pass and that `npx playwright test e2e/launches.spec.ts e2e/bookings.spec.ts` passes.

## 5. Integration check

- [x] 5.1 Run `npm run typecheck`, `npm run build`, and `npm test` in `web/`, and confirm all three pass.
- [x] 5.2 Do a manual visual pass with the API running (`npm run dev` in `api/` and `web/`), logged out and then logged in as the demo account. Cover home, launch detail (bookable, full, and not open), login, register, bookings (empty and with bookings), and the not-found page. Confirm the following: no action link is still underlined text; orange appears only on primary actions and hover accents; the "Full" and "Not open for booking" markers don't look like buttons; and keyboard focus is visible on cards and buttons.

## Workflow follow-up

- Work on a branch named `refresh-web-styling`.
- Archive the change with `/opsx:archive` after review.
