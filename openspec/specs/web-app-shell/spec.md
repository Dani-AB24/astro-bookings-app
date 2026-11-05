# web-app-shell Specification

## Purpose

Defines the page frame and API connection that every page of the AstroBookings web client relies on.

## Requirements

### Requirement: Shared layout
Every page of the client SHALL show the AstroBookings name as a link to the home page.

#### Scenario: Home page
- **WHEN** a visitor opens `/`
- **THEN** the page shows the AstroBookings name

#### Scenario: Return home
- **WHEN** a visitor on any other page selects the AstroBookings name
- **THEN** the client shows the home page

### Requirement: Unknown pages
The client SHALL show a not-found page with a link to the home page for any address it does not recognise.

#### Scenario: Unknown address
- **WHEN** a visitor opens `/does-not-exist`
- **THEN** the page says that it was not found, inside the shared layout, and offers a link to the home page

### Requirement: API address
The client SHALL send its API requests to an address set at build or start time, and SHALL use `http://localhost:3000` when none is set.

#### Scenario: Configured address
- **WHEN** the client is started with an API address configured
- **THEN** its requests go to that address

#### Scenario: Default address
- **WHEN** the client is started without an API address configured
- **THEN** its requests go to `http://localhost:3000`

### Requirement: API availability notice
The client SHALL check `GET /health` when it loads, and SHALL show a notice on every page while the API cannot be reached.

#### Scenario: API running
- **WHEN** the client loads and `GET /health` responds 200
- **THEN** no notice is shown

#### Scenario: API not reachable
- **WHEN** the client loads and the `GET /health` request fails
- **THEN** a notice says that the AstroBookings service cannot be reached, and the rest of the page still renders
