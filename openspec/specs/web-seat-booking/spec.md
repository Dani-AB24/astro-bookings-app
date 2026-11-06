# web-seat-booking Specification

## Purpose

Defines how customers book seats on a launch from the AstroBookings web client, and what they see when a booking fails.

## Requirements

### Requirement: Booking access
The launch detail page SHALL offer booking only for launches that are `published` with seats available, and SHALL ask anonymous visitors to log in first.

#### Scenario: Logged-in person on a bookable launch
- **WHEN** a logged-in person opens a `published` launch with seats available
- **THEN** the page shows the booking form

#### Scenario: Anonymous visitor
- **WHEN** an anonymous visitor opens a `published` launch with seats available
- **THEN** the page shows a link to log in instead of the form, and logging in returns them to that launch

#### Scenario: Launch that cannot be booked
- **WHEN** anyone opens a launch that is full or not `published`
- **THEN** the page shows no booking form

### Requirement: Seat selection
The booking form SHALL accept a whole number of seats from 1 up to the seats available, starting at 1, and SHALL show the total price for the selected seats.

#### Scenario: Total price
- **WHEN** a person selects 2 seats on a launch priced at 89999
- **THEN** the form shows a total of $179,998

#### Scenario: Too many seats
- **WHEN** a person enters more seats than are available
- **THEN** the form explains the limit, cannot be submitted, and sends no request

#### Scenario: Invalid seat count
- **WHEN** a person enters 0, a fraction, or nothing
- **THEN** the form cannot be submitted and sends no request

#### Scenario: Launch minimum not applied
- **WHEN** a person books 1 seat on a launch whose `minSeats` is 2
- **THEN** the form allows it

### Requirement: Successful booking
When a booking succeeds, the client SHALL show a confirmation with the seats and payment status and a link to the person's bookings, and SHALL update the seats available without a page reload.

#### Scenario: Book seats
- **WHEN** a person books 2 seats on a launch with 4 available
- **THEN** the page confirms 2 seats with a payment status of paid, links to their bookings, and shows 2 seats available

#### Scenario: Book the last seats
- **WHEN** a person books all the remaining seats
- **THEN** the page confirms the booking, marks the launch as full, and shows no booking form

### Requirement: Single submission
The booking form SHALL NOT send a second request while one is pending.

#### Scenario: Repeated click
- **WHEN** a person selects the booking button twice quickly
- **THEN** only one booking is created

### Requirement: Booking failures
When a booking fails, the client SHALL show the reason, SHALL NOT show a confirmation, and SHALL keep the person on the launch page.

#### Scenario: Capacity exceeded
- **WHEN** the API responds 400 with a `message` starting `Capacity exceeded`
- **THEN** the page shows that message and updates the seats available

#### Scenario: Payment declined
- **WHEN** the API responds 402
- **THEN** the page says that the payment was declined and no booking was made, and the person can try again

#### Scenario: Launch closed
- **WHEN** the API responds 400 with the `message` `Launch is not open for booking`
- **THEN** the page shows that message and updates the launch's status

#### Scenario: Service unreachable
- **WHEN** the booking request cannot reach the API
- **THEN** the page says that the booking could not be completed, and the person can try again
