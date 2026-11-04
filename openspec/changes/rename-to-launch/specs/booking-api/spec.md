# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Public activity catalogue`
- TO: `### Requirement: Public launch catalogue`

- FROM: `### Requirement: Activity status ownership`
- TO: `### Requirement: Launch status ownership`

## MODIFIED Requirements

### Requirement: Standard error format
Error responses from the auth, launch and booking endpoints SHALL use the body `{ message, errors }`, where `errors` is a list of `{ field, message }` entries and is empty for non-validation errors.

#### Scenario: Validation error
- **WHEN** a client sends `POST /users` with an invalid email
- **THEN** the API responds 400 with `message` set to `Validation failed` and an `errors` entry whose `field` is `email`

#### Scenario: Non-validation error
- **WHEN** a client sends `GET /launches/does-not-exist`
- **THEN** the API responds 404 with `message` set to `Launch not found` and an empty `errors` list

### Requirement: Data persistence
The API SHALL keep existing users, launches and bookings when new records are created and across restarts, and SHALL give each new record an unused ID.

#### Scenario: New activity beside seed data
- **WHEN** a user creates a launch on a freshly started API
- **THEN** every launch that existed before is still returned, unchanged

#### Scenario: Login after restart
- **WHEN** the API restarts and a previously registered user sends `POST /login` with valid credentials
- **THEN** the API responds 200 with `user` and `accessToken`

#### Scenario: Email still taken after restart
- **WHEN** the API restarts and a client registers an email that is already registered
- **THEN** the API responds 400 with an `errors` entry whose `field` is `email`

#### Scenario: New records after restart
- **WHEN** the API restarts and users, launches and bookings are created
- **THEN** the records that existed before the restart are still returned, unchanged

### Requirement: Seeded admin user
On a fresh start with no saved user data, the API SHALL provide a demo user named `admin` with the email `admin@astrobookings.example`. This user SHALL own the seed launches and SHALL have no permissions beyond those of any other user.

#### Scenario: Admin login on a fresh start
- **WHEN** a client sends `POST /login` with the admin's email and demo password on a fresh start
- **THEN** the API responds 200 with `user`, whose `username` is `admin`, and `accessToken`

#### Scenario: Admin manages a seed activity
- **WHEN** the admin sends `PATCH /launches/:id/status` with an invalid status transition for a seed launch
- **THEN** the API responds 400 because the transition is invalid, not 403

#### Scenario: Registered user and seed activities
- **WHEN** a newly registered user sends `PATCH /launches/:id/status` for a seed launch
- **THEN** the API responds 403

### Requirement: Authenticated endpoints
Booking endpoints and launch changes SHALL require a valid access token sent as `Authorization: Bearer <token>`.

#### Scenario: Missing token
- **WHEN** a client sends `GET /bookings` without a token
- **THEN** the API responds 401

#### Scenario: Invalid token
- **WHEN** a client sends `GET /bookings` with a malformed token
- **THEN** the API responds 401

### Requirement: Public launch catalogue
The API SHALL let any client read the launch list and individual launches without authentication.

#### Scenario: List activities
- **WHEN** a client sends `GET /launches` without a token
- **THEN** the API responds 200 with an array of launches

#### Scenario: Search and sort
- **WHEN** a client sends `GET /launches` with `q`, or with `_sort` and `_order`
- **THEN** the API responds 200 with only the matching launches, in the requested order

#### Scenario: Read one activity
- **WHEN** a client sends `GET /launches/:id` for an existing launch
- **THEN** the API responds 200 with that launch

### Requirement: Launch status ownership
Only the user who created a launch SHALL be able to change its status.

#### Scenario: Another user's activity
- **WHEN** a user sends `PATCH /launches/:id/status` for a launch created by a different user
- **THEN** the API responds 403

#### Scenario: Unknown activity
- **WHEN** a user sends `PATCH /launches/:id/status` for a launch that does not exist
- **THEN** the API responds 404

### Requirement: Booking creation
The API SHALL create a booking for an authenticated user from `launchId` and `seats`, charging the mock payment gateway for `price` multiplied by `seats`.

#### Scenario: Successful booking
- **WHEN** an authenticated user books a launch within its remaining capacity
- **THEN** the API responds 201 with the booking, and its `paymentStatus` is `paid`

#### Scenario: Invalid request
- **WHEN** an authenticated user sends `POST /bookings` with `seats` below 1
- **THEN** the API responds 400 with an `errors` entry whose `field` is `seats`

#### Scenario: Capacity exceeded
- **WHEN** an authenticated user requests more seats than the launch has remaining
- **THEN** the API responds 400 with a `message` starting `Capacity exceeded` that states the available and requested counts

#### Scenario: Unknown activity
- **WHEN** an authenticated user books a `launchId` that does not exist
- **THEN** the API responds 404 with `message` set to `Launch not found`

#### Scenario: Payment declined
- **WHEN** the total charge for a booking is divisible by 1000
- **THEN** the API responds 402 with `message` set to `Payment could not be processed`, and no booking is created

### Requirement: Booking retrieval
The API SHALL return an authenticated user's own bookings, each including its payment status and launch details, and SHALL NOT reveal other users' bookings.

#### Scenario: List own bookings
- **WHEN** an authenticated user sends `GET /bookings`
- **THEN** the API responds 200 with only that user's bookings, each including `paymentStatus` and `launch`

#### Scenario: Another user's booking
- **WHEN** an authenticated user sends `GET /bookings/:id` for a booking owned by a different user
- **THEN** the API responds 404 with `message` set to `Booking not found`

## ADDED Requirements

### Requirement: Launch vocabulary
The API SHALL expose launches under `/launches` and SHALL NOT serve the previous `/activities` routes or accept the previous booking field names.

#### Scenario: Previous route
- **WHEN** a client sends `GET /activities`
- **THEN** the API responds 404

#### Scenario: Previous booking fields
- **WHEN** an authenticated user sends `POST /bookings` with `activityId` and `participants`
- **THEN** the API responds 400 with `errors` entries whose `field` values are `launchId` and `seats`

#### Scenario: Launch fields
- **WHEN** a client reads a launch
- **THEN** it has `totalSeats`, `minSeats` and `launchSite`, and does not have `maxParticipants`, `minParticipants` or `location`
