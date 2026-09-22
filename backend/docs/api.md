# Eventure — API Reference

All endpoints are relative to the backend base URL (`http://localhost:4000` locally). Authenticated endpoints require `Authorization: Bearer <accessToken>`.

## Auth

### `POST /auth/register`
Body: `{ name, email, password }`
→ `201 { user: {id,name,email,role}, accessToken, refreshToken }`
Errors: `400` (validation), `409` (email already registered)

### `POST /auth/login`
Body: `{ email, password }`
→ `200 { user, accessToken, refreshToken }`
Errors: `401` (invalid credentials)

### `POST /auth/refresh`
Body: `{ refreshToken }`
→ `200 { accessToken, refreshToken }` — **the old refreshToken is invalidated the moment this succeeds** (rotation). Reusing it afterward returns `401`.
Errors: `400` (missing token), `401` (invalid, expired, or already-used token)

## Users

### `GET /users/me`
Auth required. → `200 User` (full profile of the current user, minus password hash)

### `PUT /users/me`
Auth required. Body: `{ roster_visible?: boolean }`
→ `200 User` — updates the current user's own settings. Right now this only covers roster visibility (FR1.4); more profile fields land here as they're needed.

## Events

### `GET /events?category=&city=&date=`
Public. All filters optional. → `200 [Event, ...]`

### `GET /events/trending`
Public. Top 10 upcoming events by attendee count. → `200 [Event, ...]`

### `GET /events/featured`
Public. Up to 10 admin-promoted upcoming events. → `200 [Event, ...]`

### `GET /events/:id`
Public. → `200 Event` or `404`

### `POST /events`
Auth required. Body: `CreateEventDto` (title, description, venue_name, category, start_datetime, lat, lng, city required; venue_description, minimum_age, cover_image_url, join_policy optional).
→ `201 Event`

### `PUT /events/:id`
Auth required. Only the event's creator or an admin may update it. Body: any subset of `CreateEventDto` fields.
→ `200 Event` · `403` (not owner/admin) · `404`

### `DELETE /events/:id`
Auth required. Only the event's creator or an admin may delete it.
→ `204` · `403` · `404`

### `GET /events/:id/attendance/me`
Auth required. → `200 { status: "going" | "pending" | "declined" | null }`

### `POST /events/:id/attendance`
Auth required. Marks the current user "going" (upsert). → `201 { status: "going" }`

### `DELETE /events/:id/attendance`
Auth required. Removes the current user's RSVP. → `204`

### `GET /events/:id/roster`
Public. Attendees marked "going" who have `roster_visible: true`. → `200 [{id, name}, ...]`

### `GET /events/:id/save/me`
Auth required. → `200 { saved: boolean }`

### `POST /events/:id/save` / `DELETE /events/:id/save`
Auth required. Bookmark / unbookmark an event. → `201 { saved: true }` / `204`

## Real-time (Socket.IO)

- Client emits `join_event_room` with an event ID to join that event's chat room.
- Client emits `new_message` with `{ eventId, userId, body }`; the server persists it and broadcasts `new_message` (the saved row) to everyone in that room.

## Health

- `GET /health` → `{ status: "ok", time }`
- `GET /health/db` → `{ status: "ok", db: "connected" }` or a `500` with connection failure details.
