# Design

## Context

The client uses CSS Modules with one global stylesheet, as decided in `init-react`. `web/src/styles/global.css` holds the design tokens, and each component has its own `.module.css`. See proposal.md for why this change is wanted.

Current state that shapes the approach:

- Only one accent colour exists: `--color-accent: #7aa2ff`. A global `a { color: var(--color-accent) }` rule makes every link underlined blue text.
- Button styles are written four times: `.submit` in `pages/auth-form.module.css` and in `bookings/booking-form.module.css`, `.retry` in `components/load-error.module.css`, and `.logout` in `components/session-nav.module.css`.
- `<main>` is centred at `--content-width: 64rem`, but pages inside it sit on the left. The auth page is capped at `24rem`. The detail page's facts and booking section are each capped at `32rem`.
- `pages/home-page.module.css` and `pages/bookings-page.module.css` contain the same `.card`, `.name`, and `.facts` rules.
- The e2e tests find elements by role and accessible name, for example `getByRole('link', { name: 'Log in to book seats' })` and `getByRole('button', { name: 'Try again' })`.

## Goals / Non-Goals

**Goals:**

- Make orange the colour of primary actions, through one shared button style that works on both `<button>` and `<Link>`.
- Keep every element's role, accessible name, and URL, so the existing e2e tests pass unchanged.
- Remove the duplicated button and card CSS while restyling it.

**Non-Goals:**

- Changing page structure or copy, or moving elements around. For example, "All launches" stays below the booking section.
- A light theme, new fonts, icons, or responsive redesigns beyond what centring needs.
- Visual regression testing, such as screenshot comparisons.

## Decisions

### Colour tokens

Add these to `:root` in `global.css`:

```
--color-highlight:        #ff8a3d   orange, primary actions
--color-highlight-hover:  #ffa366
--color-on-highlight:     var(--color-background)   text on orange
```

`--color-accent` stays blue for secondary buttons, inline links, and focus outlines. Orange measures about 8:1 contrast against the navy background, and dark text on orange is the same, so both meet WCAG AA.

*Alternative:* replace the blue accent with orange everywhere. Rejected, because a single colour can't tell primary actions from secondary ones, which is the whole point of the change.

### Shared button classes in `components/button.module.css`

The module has a base `.button` rule for padding, radius, weight, `display: inline-flex`, no underline, the pointer cursor, and the shared `:disabled` style. Two variants build on it with `composes: button`:

- `.primary`: orange fill with dark text, and a lighter orange on hover.
- `.secondary`: transparent fill, a blue border, and light text. On hover, the border turns orange and the background tints.

Callers apply a single class, `className={buttonStyles.primary}`, to a `<button>` or a `<Link>`. Where a caller needs layout tweaks, such as `justify-self: start` on the booking submit, it joins its own module class, following the existing `${a} ${b}` pattern in `booking-form.tsx`.

The four old classes (`.submit` twice, `.retry`, `.logout`) are deleted. All disabled buttons get one look: `opacity: 0.6; cursor: not-allowed`. This drops the earlier mix of the `wait`, `progress`, and `not-allowed` cursors, which is an accepted minor change.

*Alternatives:*

- A `<ButtonLink>` React component. Rejected, because it adds props and wrapping to forward to `<Link>` when a class is enough, and it wouldn't cover `<button>`.
- Global utility classes in `global.css`. Rejected, because they go against the CSS Modules decision.

### Links stay links

Navigation actions keep their `<Link>` element and only gain the button class. Switching to `<button onClick={navigate}>` would break middle-click, open-in-new-tab, the `state` passed for return locations, and the tests' `getByRole('link')` queries.

Assignment:

| Element | Where | Variant |
|---|---|---|
| Register | header (`session-nav.tsx`) | primary |
| Log in | header | secondary |
| My bookings | header | secondary |
| Log out (button) | header | secondary |
| Log in / Register submit | `login-page.tsx`, `register-page.tsx` | primary |
| Book seats submit | `booking-form.tsx` | primary |
| Log in to book seats | `booking-section.tsx` | primary |
| View my bookings | `booking-confirmation.tsx` | secondary |
| All launches, Back to the launch list | `launch-detail-page.tsx` | secondary |
| Browse launches | `bookings-page.tsx` | secondary |
| Back to the home page | `not-found-page.tsx` | secondary |
| Try again (button) | `load-error.tsx` | secondary |

The sentence links "Create an account" and "Log in" on the auth pages stay inline text links.

### Centred page columns

Add width tokens:

```
--form-width:   30rem    login and register
--column-width: 44rem    launch detail
```

`auth-form.module.css` `.page` uses `max-width: var(--form-width); margin-inline: auto`. `launch-detail-page.module.css` `.page` does the same with `--column-width`. The `32rem` caps on `.facts` and on `booking-section.module.css` `.section` are removed, so everything fills the column. The "Launch not found" view reuses `.page`, so it is centred too.

```
+---------------------------- main 64rem ----------------------------+
|                  +------- 30rem -------+                            |
|                  | Log in              |                            |
|                  | [ form           ]  |                            |
|                  +---------------------+                            |
|          +---------------- 44rem ----------------+                  |
|          | Launch name   [marker]                |                  |
|          | [ facts ................. ]           |                  |
|          | [ booking section ....... ]           |                  |
|          | [All launches]                        |                  |
|          +---------------------------------------+                  |
+---------------------------------------------------------------------+
```

### Shared card styles and stretched title link

Move the duplicated rules into `components/card.module.css`, which exports `.card`, `.title`, and `.facts`. `home-page.tsx` and `bookings-page.tsx` use it, and page-specific rules such as `.seats` stay in the page modules.

How the title is treated:

- `1.35rem`, weight 700, colour `--color-text`.
- The link inherits the colour and has no underline. On hover or focus it gets an underline and turns orange.
- A bottom border and padding act as the divider before the facts.

The whole card is clickable through the stretched-link pattern. `.card` is `position: relative`, and the title link's `::after` covers it with `position: absolute; inset: 0`. On card hover the border turns orange, and `.card:focus-within` shows the focus outline on the card. Each card still has exactly one link, with the launch name as its accessible name.

*Alternative:* wrap the whole `<li>` content in a `<Link>`. Rejected, because the link's accessible name would become all the card text, which breaks `getByRole('link', { name: launch.name })` and makes screen readers read the whole card.

### Availability marker stays a warning, not an action

The marker keeps its amber warning colours (`#ffd98a` on `#4a3410`) and its small, flat badge shape. It stays visually separate from the saturated orange filled buttons, which are also larger and change on hover. No token changes are needed. Implementation only checks visually that the two don't look alike next to each other.

## Risks / Trade-offs

- [The stretched link covers the whole card, so any interactive element added inside a card later becomes unclickable] → Comment the pattern in `card.module.css`. A future interactive child would need `position: relative; z-index: 1`.
- [Text in a card can no longer be selected by dragging] → Accepted for a demo client.
- [Orange and the amber warning colours could be read as related] → The marker stays a small flat badge with no hover state, while buttons are filled and interactive. Check this visually during implementation.
- [Restyling misses an element, leaving a stray underlined action link] → Tasks list every element from the table above, and a manual pass covers each page.
- [Visual changes have no automated coverage] → The existing role-based e2e tests guard behaviour. One added e2e scenario checks that clicking a card outside its title opens the detail page, which guards the stretched link.

## Migration Plan

Not applicable. This is a CSS-only client change with no data or API impact. To roll back, revert the commit.
