# Spec Delta

## Purpose

Defines how customers see their own bookings and each booking's status in the AstroBookings web client.

## ADDED Requirements

### Requirement: Booking list
The `/bookings` page SHALL list the logged-in person's bookings, newest first, each showing the launch name, rocket, launch date, launch site, seats, and the date it was booked.

#### Scenario: Person with bookings
- **WHEN** a person who has made two bookings opens `/bookings`
- **THEN** both are listed with those details, the newest first

#### Scenario: New booking
- **WHEN** a person books seats and follows the confirmation's link to their bookings
- **THEN** the new booking is listed without a page reload

#### Scenario: Open the launch
- **WHEN** a person selects the launch of a listed booking
- **THEN** the client shows that launch's detail page

### Requirement: Booking status
Each listed booking SHALL show its payment status and its launch's status in readable words, including for every payment status the API defines.

#### Scenario: Paid booking
- **WHEN** a booking has the `paymentStatus` `paid`
- **THEN** it shows as paid

#### Scenario: Other payment statuses
- **WHEN** a booking has the `paymentStatus` `pending` or `refunded`
- **THEN** it shows as pending or refunded respectively

#### Scenario: Launch cancelled after booking
- **WHEN** the launch of a booking is cancelled
- **THEN** the booking shows the launch as cancelled

### Requirement: Own bookings only
A person SHALL see only their own bookings, including when several people use the same browser.

#### Scenario: Change of person
- **WHEN** a person with bookings logs out and another person with none logs in and opens `/bookings`
- **THEN** none of the first person's bookings are shown

### Requirement: Booking page states
The `/bookings` page SHALL show a loading state while waiting, an empty state when there are no bookings, and an error with a way to retry when they cannot be loaded.

#### Scenario: No bookings
- **WHEN** a person with no bookings opens `/bookings`
- **THEN** the page says that they have no bookings and links to the launch list

#### Scenario: Request fails
- **WHEN** the bookings request fails with a server error
- **THEN** the page shows an error and a retry control, without logging the person out

#### Scenario: Session expired
- **WHEN** the bookings request responds 401
- **THEN** the person is logged out and sent to log in, and returns to `/bookings` afterwards
