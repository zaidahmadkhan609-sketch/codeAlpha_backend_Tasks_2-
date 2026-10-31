# Task 2 — Event Registration System

## Features
- Create and list events, including capacity and registration counts.
- Register attendees for events; prevents duplicate email registrations and overbooking.
- View one event and registrations for a user.
- Cancel a registration.
- SQLite tables: `events` and `registrations` with foreign-key constraints.

## Run
Install Node.js 18+, then:
```bash
cp .env.example .env
npm install
npm start
```
API default: `http://localhost:3002`.

## API examples
Create event:
```bash
curl -X POST http://localhost:3002/api/events -H "Content-Type: application/json" \
-d '{"title":"Tech Meetup","description":"Backend talks","location":"Peshawar","event_date":"2026-11-20T15:00:00","capacity":100}'
```
Register:
```bash
curl -X POST http://localhost:3002/api/events/1/register -H "Content-Type: application/json" \
-d '{"full_name":"Ali Khan","email":"ali@example.com"}'
```
Other endpoints: `GET /api/events`, `GET /api/events/:id`, `GET /api/users/:email/registrations`, `DELETE /api/registrations/:id`.

No organizer authentication is included in this learning version; add authentication and role checks before production.
