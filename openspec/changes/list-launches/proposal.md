# Proposal

## Why

The briefing's first requirement is to display available launches with their rocket, price, and seats. It is also what makes the app useful before anyone logs in, because the API's catalogue is public.

## What Changes

- Replace the temporary home page with a launch list that anyone can see.
- Add a launch detail page at `/launches/:id`.
- Show when a launch is full or not open for booking.
- Add loading, empty, not-found, and error states.

Search, filtering controls, and launch management are not included. The API offers `q`, but the briefing does not ask for search, and it can be added later.

## Capabilities

### New Capabilities
- `web-launch-browsing`: Viewing the launch list and launch details in the web client, including whether each launch can be booked.

### Modified Capabilities

None.

## Impact

- **Depends on**: `init-react`. It follows `create-login` only because of the agreed order, and needs nothing from it.
- **Code**: new pages and shared launch formatting in `web/src/`.
- **APIs**: consumes `GET /launches` and `GET /launches/:id`, with no API changes.
