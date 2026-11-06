# Proposal

## Why

The web client works, but it looks flat. Every navigation action is underlined blue text, so "Log in", "Register", or "Log in to book seats" read like prose instead of things to press. The forms and the launch detail page sit narrow against the left edge of a wide page. Launch card titles barely stand out from the facts below them. With a single blue accent, nothing tells people which action matters most.

## What Changes

- Add an orange highlight colour and use it for primary calls to action. Blue stays for secondary actions, inline text links, and focus rings.
- Give the client one shared button style with `primary` (orange) and `secondary` (outlined) variants. It replaces the four separate button styles in the auth form, booking form, load error, and session nav.
- Style navigation links that act as actions like buttons. They stay real links, so their role, URL, and keyboard behaviour don't change:
  - Primary: Register in the header, Log in to book seats, the Log in and Register form submits, and the Book seats submit.
  - Secondary: Log in and My bookings in the header, All launches, Back to the launch list, Back to the home page, Browse launches, View my bookings, Try again, and Log out.
  - Links inside sentences, such as "Create an account" and "Log in" on the auth pages, stay text links.
- Centre the login and register pages and widen their form, to about 30rem.
- Centre the launch detail page in a wider column, about 44rem, that the facts, booking section, and back link all fill.
- Make card titles easier to tell apart on the launch list and the bookings page: larger and bolder, light rather than blue, underlined only on hover or focus, and separated from the facts by a divider.
- Make the whole launch card and booking card clickable, by stretching the title link over the card. Each card still has a single link.
- Keep the availability marker ("Full", "Not open for booking") visually distinct from the orange call-to-action colour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This change is purely visual. The existing specs already describe opening a launch by "selecting" it in the launch list and the booking list, and a clickable card still meets that. This change sets `skip_specs: true`.

## Impact

- **Code**: `web/src/styles/global.css` (new colour and width tokens), a new `web/src/components/button.module.css`, and the CSS Modules and class names in the session nav, load error, auth pages, launch detail page, booking section, booking form, booking confirmation, home page, bookings page, and not-found page.
- **Tests**: the existing e2e tests locate elements by role and accessible name, and both stay the same, so the tests should pass unchanged.
- **API, dependencies**: none.
