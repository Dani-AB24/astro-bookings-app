# booking-api Specification

## Purpose

Defines the HTTP contract of the bookings backend that clients rely on, so that later renames and extensions can be checked against known behaviour.

## Requirements

### Requirement: Service health
The API SHALL report that it is running without requiring authentication.

#### Scenario: Health check
- **WHEN** a client sends `GET /health`
- **THEN** the API responds 200 with `{ "status": "ok" }`

### Requirement: Standard error format
Error responses from the auth, activity and booking endpoints SHALL use the body `{ message, errors }`, where `errors` is a list of `{ field, message }` entries and is empty for non-validation errors.

#### Scenario: Validation error
- **WHEN** a client sends `POST /users` with an invalid email
- **THEN** the API responds 400 with `message` set to `Validation failed` and an `errors` entry whose `field` is `email`

#### Scenario: Non-validation error
- **WHEN** a client sends `GET /activities/does-not-exist`
- **THEN** the API responds 404 with `message` set to `Activity not found` and an empty `errors` list

### Requirement: User registration
The API SHALL register a user from `username`, `email`, `password` of at least 6 characters, and `terms` set to `true`, and SHALL return the user with an access token.

#### Scenario: Successful registration
- **WHEN** a client sends `POST /users` with valid fields and an unused email
- **THEN** the API responds 201 with `user` and `accessToken`

#### Scenario: Terms not accepted
- **WHEN** a client sends `POST /users` without `terms` set to `true`
- **THEN** the API responds 400 with an `errors` entry whose `field` is `terms`

#### Scenario: Email already registered
- **WHEN** a client sends `POST /users` with an email that is already registered
- **THEN** the API responds 400 with an `errors` entry whose `field` is `email`

### Requirement: User login
The API SHALL exchange a valid email and password for the user and an access token.

#### Scenario: Valid credentials
- **WHEN** a client sends `POST /login` with a registered email and its password
- **THEN** the API responds 200 with `user` and `accessToken`

#### Scenario: Wrong password
- **WHEN** a client sends `POST /login` with a registered email and a wrong password
- **THEN** the API responds 401 with `message` set to `Invalid email or password`

### Requirement: Data persistence
The API SHALL keep existing users, activities and bookings when new records are created and across restarts, and SHALL give each new record an unused ID.

#### Scenario: New activity beside seed data
- **WHEN** a user creates an activity on a freshly started API
- **THEN** every activity that existed before is still returned, unchanged

#### Scenario: Login after restart
- **WHEN** the API restarts and a previously registered user sends `POST /login` with valid credentials
- **THEN** the API responds 200 with `user` and `accessToken`

#### Scenario: Email still taken after restart
- **WHEN** the API restarts and a client registers an email that is already registered
- **THEN** the API responds 400 with an `errors` entry whose `field` is `email`

#### Scenario: New records after restart
- **WHEN** the API restarts and users, activities and bookings are created
- **THEN** the records that existed before the restart are still returned, unchanged

### Requirement: Authenticated endpoints
Booking endpoints and activity changes SHALL require a valid access token sent as `Authorization: Bearer <token>`.

#### Scenario: Missing token
- **WHEN** a client sends `GET /bookings` without a token
- **THEN** the API responds 401

#### Scenario: Invalid token
- **WHEN** a client sends `GET /bookings` with a malformed token
- **THEN** the API responds 401

### Requirement: Public activity catalogue
The API SHALL let any client read the activity list and individual activities without authentication.

#### Scenario: List activities
- **WHEN** a client sends `GET /activities` without a token
- **THEN** the API responds 200 with an array of activities

#### Scenario: Search and sort
- **WHEN** a client sends `GET /activities` with `q`, or with `_sort` and `_order`
- **THEN** the API responds 200 with only the matching activities, in the requested order

#### Scenario: Read one activity
- **WHEN** a client sends `GET /activities/:id` for an existing activity
- **THEN** the API responds 200 with that activity

### Requirement: Activity status ownership
Only the user who created an activity SHALL be able to change its status.

#### Scenario: Another user's activity
- **WHEN** a user sends `PATCH /activities/:id/status` for an activity created by a different user
- **THEN** the API responds 403

#### Scenario: Unknown activity
- **WHEN** a user sends `PATCH /activities/:id/status` for an activity that does not exist
- **THEN** the API responds 404

### Requirement: Booking creation
The API SHALL create a booking for an authenticated user from `activityId` and `participants`, charging the mock payment gateway for `price` multiplied by `participants`.

#### Scenario: Successful booking
- **WHEN** an authenticated user books an activity within its remaining capacity
- **THEN** the API responds 201 with the booking, and its `paymentStatus` is `paid`

#### Scenario: Invalid request
- **WHEN** an authenticated user sends `POST /bookings` with `participants` below 1
- **THEN** the API responds 400 with an `errors` entry whose `field` is `participants`

#### Scenario: Capacity exceeded
- **WHEN** an authenticated user requests more participants than the activity has remaining
- **THEN** the API responds 400 with a `message` starting `Capacity exceeded` that states the available and requested counts

#### Scenario: Unknown activity
- **WHEN** an authenticated user books an `activityId` that does not exist
- **THEN** the API responds 404 with `message` set to `Activity not found`

#### Scenario: Payment declined
- **WHEN** the total charge for a booking is divisible by 1000
- **THEN** the API responds 402 with `message` set to `Payment could not be processed`, and no booking is created

### Requirement: Booking retrieval
The API SHALL return an authenticated user's own bookings, each including its payment status and activity details, and SHALL NOT reveal other users' bookings.

#### Scenario: List own bookings
- **WHEN** an authenticated user sends `GET /bookings`
- **THEN** the API responds 200 with only that user's bookings, each including `paymentStatus` and `activity`

#### Scenario: Another user's booking
- **WHEN** an authenticated user sends `GET /bookings/:id` for a booking owned by a different user
- **THEN** the API responds 404 with `message` set to `Booking not found`
