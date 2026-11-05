# Spec Delta

## Purpose

Defines how people create an account, log in, stay logged in, and log out in the AstroBookings web client.

## ADDED Requirements

### Requirement: Registration
The client SHALL offer a registration page at `/register` with username, email, password, and terms acceptance, and SHALL log the person in when registration succeeds.

#### Scenario: Successful registration
- **WHEN** a visitor submits valid details with the terms accepted
- **THEN** the person is logged in and sees the home page with their username

#### Scenario: Terms not accepted
- **WHEN** a visitor submits the form without accepting the terms
- **THEN** the error from the API is shown beside the terms checkbox, and the person is not logged in

#### Scenario: Email already registered
- **WHEN** a visitor submits an email that is already registered
- **THEN** the error from the API is shown beside the email field

#### Scenario: Invalid fields
- **WHEN** a visitor submits an invalid email and a password under 6 characters
- **THEN** each error from the API is shown beside its own field, and the entered username and email are kept

### Requirement: Login
The client SHALL offer a login page at `/login` with email and password, and SHALL log the person in when the credentials are valid.

#### Scenario: Valid credentials
- **WHEN** a registered person submits their email and password
- **THEN** the person is logged in and sees the home page with their username

#### Scenario: Wrong password
- **WHEN** a person submits a wrong password
- **THEN** the page shows `Invalid email or password`, and the person is not logged in

#### Scenario: Missing fields
- **WHEN** a person submits the form with an empty email
- **THEN** the error from the API is shown beside the email field

### Requirement: Session display
The layout SHALL show links to log in and register to anonymous visitors, and SHALL show the username, a link to their bookings, and a way to log out to logged-in people.

#### Scenario: Anonymous visitor
- **WHEN** an anonymous visitor opens any page
- **THEN** the layout shows links to log in and register, and no username

#### Scenario: Logged-in person
- **WHEN** a logged-in person opens any page
- **THEN** the layout shows their username, a link to their bookings, and a way to log out

### Requirement: Session persistence
The client SHALL keep a person logged in, including their username, when the page is reloaded.

#### Scenario: Reload
- **WHEN** a logged-in person reloads the page
- **THEN** they are still logged in and their username is still shown

#### Scenario: Unreadable stored session
- **WHEN** the stored session cannot be read
- **THEN** the client treats the visitor as anonymous and does not crash

### Requirement: Logout
The client SHALL let a logged-in person log out, which SHALL remove their stored session and return them to the home page.

#### Scenario: Log out
- **WHEN** a logged-in person logs out
- **THEN** they see the home page as an anonymous visitor, and remain anonymous after a reload

### Requirement: Protected pages
The client SHALL send anonymous visitors who open a page that needs an account to the login page, and SHALL return them to that page after they log in or register.

#### Scenario: Open a protected page
- **WHEN** an anonymous visitor opens `/bookings`
- **THEN** the client shows the login page

#### Scenario: Return after login
- **WHEN** that visitor then logs in
- **THEN** the client shows `/bookings`

#### Scenario: Return after registration
- **WHEN** that visitor instead follows the link to register and completes registration
- **THEN** the client shows `/bookings`

### Requirement: Login pages when logged in
The client SHALL NOT show the login or registration page to a person who is already logged in.

#### Scenario: Already logged in
- **WHEN** a logged-in person opens `/login` or `/register`
- **THEN** the client shows the home page
