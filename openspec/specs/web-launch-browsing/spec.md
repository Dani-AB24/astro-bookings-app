# web-launch-browsing Specification

## Purpose

Defines how visitors see the launches on offer in the AstroBookings web client, and whether each one can be booked.

## Requirements

### Requirement: Launch list
The home page SHALL list launches without requiring an account, soonest first, each showing its name, rocket, price per seat, date, launch site, and available seats.

#### Scenario: Anonymous visitor
- **WHEN** an anonymous visitor opens `/` on a freshly started API
- **THEN** the page lists the published seed launches with those details, soonest first, and no draft launch

#### Scenario: Open a launch
- **WHEN** a visitor selects a launch in the list
- **THEN** the client shows that launch's detail page

### Requirement: Finished launches hidden from the list
The launch list SHALL NOT include launches whose status is `done` or `cancelled`.

#### Scenario: Cancelled launch
- **WHEN** a launch has the status `cancelled`
- **THEN** it does not appear in the list

### Requirement: Launch detail
The client SHALL show a launch at `/launches/:id` without requiring an account, with its name, rocket, price per seat, date, duration, launch site, status, and available and total seats.

#### Scenario: Existing launch
- **WHEN** a visitor opens the address of a published launch
- **THEN** the page shows those details, with the duration in readable units rather than minutes

#### Scenario: Unknown launch
- **WHEN** a visitor opens `/launches/does-not-exist`
- **THEN** the page says that the launch was not found and offers a link to the launch list

#### Scenario: Finished launch by address
- **WHEN** a visitor opens the address of a `cancelled` launch
- **THEN** the page shows the launch with its status

### Requirement: Launch availability
The list and detail pages SHALL mark a launch as full when `availableSeats` is 0, whatever its status, and as not open for booking when its status is not `published`.

#### Scenario: Published launch with seats
- **WHEN** a launch is `published` with seats remaining
- **THEN** it shows how many seats are available, and no full or not-open marker

#### Scenario: Full launch still published
- **WHEN** a launch has the status `published` and `availableSeats` of 0
- **THEN** it is marked as full

#### Scenario: Launch not open
- **WHEN** a launch has the status `confirmed` with seats remaining
- **THEN** it is marked as not open for booking

### Requirement: Launch page states
The launch pages SHALL show a loading state while waiting for data, and SHALL show an error with a way to retry when the data cannot be loaded.

#### Scenario: Request fails
- **WHEN** the launch list request fails
- **THEN** the page shows an error and a retry control

#### Scenario: Retry succeeds
- **WHEN** the visitor retries and the request succeeds
- **THEN** the page shows the launches

#### Scenario: No launches
- **WHEN** the API returns no launches to show
- **THEN** the page says that there are no launches available
