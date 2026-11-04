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
Error responses from the auth, launch and booking endpoints SHALL use the body `{ message, errors }`, where `errors` is a list of `{ field, message }` entries and is empty for non-validation errors.

#### Scenario: Validation error
- **WHEN** a client sends `POST /users` with an invalid email
- **THEN** the API responds 400 with `message` set to `Validation failed` and an `errors` entry whose `field` is `email`

#### Scenario: Non-validation error
- **WHEN** a client sends `GET /launches/does-not-exist`
- **THEN** the API responds 404 with `message` set to `Launch not found` and an empty `errors` list

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
The API SHALL keep existing users, launches and bookings when new records are created and across restarts, and SHALL give each new record an unused ID.

#### Scenario: New launch beside seed data
- **WHEN** a user creates a launch on a freshly started API
- **THEN** every non-draft launch that existed before is still returned, with its stored fields unchanged

#### Scenario: Login after restart
- **WHEN** the API restarts and a previously registered user sends `POST /login` with valid credentials
- **THEN** the API responds 200 with `user` and `accessToken`

#### Scenario: Email still taken after restart
- **WHEN** the API restarts and a client registers an email that is already registered
- **THEN** the API responds 400 with an `errors` entry whose `field` is `email`

#### Scenario: New records after restart
- **WHEN** the API restarts and users, launches and bookings are created
- **THEN** the records that existed before the restart are still returned, with their stored fields unchanged

### Requirement: Seeded admin user
On a fresh start with no saved user data, the API SHALL provide a demo user named `admin` with the email `admin@astrobookings.example`. This user SHALL own the seed launches and SHALL have no permissions beyond those of any other user.

#### Scenario: Admin login on a fresh start
- **WHEN** a client sends `POST /login` with the admin's email and demo password on a fresh start
- **THEN** the API responds 200 with `user`, whose `username` is `admin`, and `accessToken`

#### Scenario: Admin manages a seed launch
- **WHEN** the admin sends `PATCH /launches/:id/status` with an invalid status transition for a seed launch
- **THEN** the API responds 400 because the transition is invalid, not 403

#### Scenario: Registered user and seed launches
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
The API SHALL let any client read the list of non-draft launches and individual non-draft launches without authentication.

#### Scenario: List launches
- **WHEN** a client sends `GET /launches` without a token
- **THEN** the API responds 200 with an array of launches, each including `rocket` and `availableSeats`

#### Scenario: Search and sort
- **WHEN** a client sends `GET /launches` with `q`, or with `_sort` and `_order`
- **THEN** the API responds 200 with only the matching launches, in the requested order

#### Scenario: Read one launch
- **WHEN** a client sends `GET /launches/:id` for an existing non-draft launch
- **THEN** the API responds 200 with that launch, including `rocket` and `availableSeats`

#### Scenario: Draft hidden from the list
- **WHEN** a client sends `GET /launches`, with or without `q`, `slug` or `_sort`
- **THEN** the response contains no launch whose `status` is `draft`

#### Scenario: Draft hidden from detail
- **WHEN** a client sends `GET /launches/:id` for a draft launch
- **THEN** the API responds 404 with `message` set to `Launch not found`

### Requirement: Launch status ownership
Only the user who created a launch SHALL be able to change its status.

#### Scenario: Another user's launch
- **WHEN** a user sends `PATCH /launches/:id/status` for a launch created by a different user
- **THEN** the API responds 403

#### Scenario: Unknown launch
- **WHEN** a user sends `PATCH /launches/:id/status` for a launch that does not exist
- **THEN** the API responds 404

### Requirement: Booking creation
The API SHALL create a booking for an authenticated user from `launchId` and a whole number of `seats`, on `published` launches only, charging the mock payment gateway for `price` multiplied by `seats`.

#### Scenario: Successful booking
- **WHEN** an authenticated user books a launch within its remaining capacity
- **THEN** the API responds 201 with the booking, and its `paymentStatus` is `paid`

#### Scenario: Invalid request
- **WHEN** an authenticated user sends `POST /bookings` with `seats` below 1
- **THEN** the API responds 400 with an `errors` entry whose `field` is `seats`

#### Scenario: Capacity exceeded
- **WHEN** an authenticated user requests more seats than the launch has remaining
- **THEN** the API responds 400 with a `message` starting `Capacity exceeded` that states the available and requested counts

#### Scenario: Unknown launch
- **WHEN** an authenticated user books a `launchId` that does not exist
- **THEN** the API responds 404 with `message` set to `Launch not found`

#### Scenario: Payment declined
- **WHEN** the total charge for a booking is divisible by 1000
- **THEN** the API responds 402 with `message` set to `Payment could not be processed`, and no booking is created

#### Scenario: Fractional seats
- **WHEN** an authenticated user sends `POST /bookings` with `seats` set to `1.5`
- **THEN** the API responds 400 with an `errors` entry whose `field` is `seats`

#### Scenario: Launch not published
- **WHEN** an authenticated user books a launch whose `status` is not `published`
- **THEN** the API responds 400 with `message` set to `Launch is not open for booking`, and no booking is created

### Requirement: Booking retrieval
The API SHALL return an authenticated user's own bookings, each including its payment status and launch details, and SHALL NOT reveal other users' bookings.

#### Scenario: List own bookings
- **WHEN** an authenticated user sends `GET /bookings`
- **THEN** the API responds 200 with only that user's bookings, each including `paymentStatus` and `launch`, whose details include `rocket`

#### Scenario: Another user's booking
- **WHEN** an authenticated user sends `GET /bookings/:id` for a booking owned by a different user
- **THEN** the API responds 404 with `message` set to `Booking not found`

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

### Requirement: Launch rocket
Every launch SHALL name its rocket in a non-empty `rocket` text field, required on creation and editable on update.

#### Scenario: Create with a rocket
- **WHEN** a user creates a launch with `rocket`
- **THEN** the API responds 201 with that `rocket`

#### Scenario: Create without a rocket
- **WHEN** a user creates a launch without `rocket`
- **THEN** the API responds 400 with an `errors` entry whose `field` is `rocket`

#### Scenario: Update the rocket
- **WHEN** the owner sends `PUT /launches/:id` with a new `rocket`
- **THEN** the API responds 200 with the new `rocket`

#### Scenario: Update to an empty rocket
- **WHEN** the owner sends `PUT /launches/:id` with an empty `rocket`
- **THEN** the API responds 400 with an `errors` entry whose `field` is `rocket`

### Requirement: Available seats
Every launch response SHALL include `availableSeats`, computed as `totalSeats` minus all seats booked on that launch, and never below zero.

#### Scenario: New launch
- **WHEN** a user creates a launch with `totalSeats` of 4
- **THEN** the response has `availableSeats` of 4

#### Scenario: After a booking
- **WHEN** a user books 3 seats on a launch with 4 available
- **THEN** reading that launch returns `availableSeats` of 1

#### Scenario: Declined booking
- **WHEN** a booking is rejected for capacity or payment
- **THEN** `availableSeats` for that launch does not change

#### Scenario: Fully booked
- **WHEN** every seat on a launch has been booked
- **THEN** `availableSeats` is 0, and a further booking responds 400 with a `message` starting `Capacity exceeded`

### Requirement: Read-only launch fields
Updating a launch SHALL change only its editable fields, and SHALL ignore client values for `id`, `userId`, `createdAt` and `availableSeats`.

#### Scenario: Attempted ownership change
- **WHEN** the owner sends `PUT /launches/:id` with a different `userId`
- **THEN** the launch keeps its original owner, and the original owner can still change it

#### Scenario: Attempted seat override
- **WHEN** the owner sends `PUT /launches/:id` with `availableSeats` set to 999
- **THEN** `availableSeats` stays computed from `totalSeats` and booked seats

### Requirement: Seed launches
On a fresh start with no saved launch data, the API SHALL offer fictional launches with rockets, at least one of them a draft, whose prices are never declined by the mock payment gateway at any seat count they allow.

#### Scenario: Public seed catalogue
- **WHEN** a client sends `GET /launches` on a fresh start
- **THEN** the response includes the published seed launches, each with `rocket` and `availableSeats`, and no draft

#### Scenario: Bookable at every seat count
- **WHEN** a user books from 1 up to `totalSeats` seats on a published seed launch
- **THEN** the total charge is never divisible by 1000
