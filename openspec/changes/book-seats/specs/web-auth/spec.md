# Spec Delta

## ADDED Requirements

### Requirement: Expired session
When the API responds 401 to a request that carried the person's token, the client SHALL log them out, say that their session has expired, and show the login page, returning them to their page after logging in.

#### Scenario: Token rejected while booking
- **WHEN** a person whose token is no longer valid submits a booking
- **THEN** they are logged out, the login page says that their session has expired, and logging in returns them to the launch

#### Scenario: Failed login is not an expired session
- **WHEN** a person submits a wrong password on the login page
- **THEN** the page shows `Invalid email or password`, with no message about an expired session
