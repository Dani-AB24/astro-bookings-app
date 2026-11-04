# AstroBookings 

> Express with TypeScript version for the AstroBookings system

A fictional rocket launch booking system used during training sessions and demos.

A **backend API** for offering bookings to launches by registered users

- Launches are scheduled for specific dates with pricing and a minimum and a total number of seats.
- Launch status lifecycle: draft → published -> confirmed → done or cancelled.
- A user will be identified by their email address, having a username and password.
- One user can book multiple launches, but cannot exceed the available seats.
- Users will be billed upon booking, and payments will be processed through a mock gateway.

For demo purposes:

- Security is based on simple JWT tokens.
- Data persistence is handled using JSON files 

[Git hub / Alberto Basalo Labs / Activity Bookings Express](https://github.com/AlbertoBasaloLabs/activity-bookings-express)

**Quickstart**

```bash
# Set up the project
npm install
# Run the development server
npm run dev
# Build the project
npm run build
# Run the production server
npm run start
# Type-check only
npm run typecheck
# Run the API tests (no browser download needed)
npm test
```

Runtime data is written to `db/*.json`, which git ignores. Only `db/seed/` is tracked. Passwords are stored in plain text, so do not use a real one.

If you ran the API before the rename to launches, delete your local `db/*.json` files. They use the old IDs and fields. The API starts again from `db/seed/`.

A demo account is seeded on every fresh start: `admin@astrobookings.example` / `admin-demo-password`. It has no special permissions, but it owns the seed launches.

The server listens on `http://localhost:3000` and responds with a small JSON payload. Configure the port via `PORT` env var.

**API Endpoints**

**System**
- `GET /health` - Health check endpoint

**Authentication**
- `POST /users` - Register a new user (requires: email, username, password, terms)
- `POST /login` - Login and receive JWT token (requires: email, password)

**Launches**
- `GET /launches` - List all launches (supports query parameters: `q`, `slug`, `_sort`, `_order`)
  - Query parameters:
    - `q`: Search term (searches in name, launchSite, slug)
    - `slug`: Filter by exact slug match
    - `_sort`: Field to sort by (e.g., 'id', 'name', 'date', 'price')
    - `_order`: Sort order ('asc' or 'desc', defaults to 'asc')
- `GET /launches/:id` - Get a specific launch by ID
- `POST /launches` - Create a new launch (authenticated, requires: name, price, date, duration, launchSite, minSeats, totalSeats, status)
- `PUT /launches/:id` - Update an existing launch (authenticated, owner only)
- `DELETE /launches/:id` - Delete a launch (authenticated, owner only)
- `PATCH /launches/:id/status` - Transition launch status (authenticated, owner only, requires: status)

**Bookings**
- `GET /bookings` - Get all bookings for authenticated user (supports query parameter: `launchId`)
  - Query parameters:
    - `launchId`: Filter bookings by launch ID
- `GET /bookings/:id` - Get a specific booking by ID (authenticated, owner only)
- `POST /bookings` - Create a new booking (authenticated, requires: launchId, seats)

**Source**

Copied without its git history from [Programacion-Inteligente/activity-bookings-express](https://github.com/Programacion-Inteligente/activity-bookings-express) at commit `68704a5c146a154f58827df8f57dee8a87e38e12`. That repo declares the ISC license in its `package.json`.

--- 

- **Author**: [Alberto Basalo](https://albertobasalo.dev)
- **Ai Code Academy en Español**: [AI code Academy](https://aicode.academy)
- **Socials**:
  - [X](https://x.com/albertobasalo)
  - [LinkedIn](https://www.linkedin.com/in/albertobasalo/)
  - [GitHub](https://github.com/albertobasalo)
