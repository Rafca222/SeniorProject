# Eventure

Discover, join, and connect at local events across Lebanon. CSC 490 senior project.

## Structure

```
backend/    Node.js + Express API, PostgreSQL (via Supabase), Socket.IO chat
frontend/   React + Vite + Tailwind
```

## Prerequisites

- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project (Postgres database)
- A [Google Maps](https://console.cloud.google.com/google/maps-apis) JavaScript API key
- A free [Groq](https://console.groq.com) API key

## First-time setup

1. **Database.** Create a Supabase project. In the SQL Editor, paste and run `backend/schema.sql` once.
2. **Backend.**
   ```bash
   cd backend
   cp .env.example .env      # fill in DATABASE_URL, JWT secrets, etc.
   npm install
   npm run dev                # runs on http://localhost:4000
   ```
   Generate strong JWT secrets with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Frontend.**
   ```bash
   cd frontend
   cp .env.example .env      # fill in VITE_API_URL and VITE_GOOGLE_MAPS_KEY
   npm install
   npm run dev                # runs on http://localhost:5173
   ```
4. **Verify.**
   - `http://localhost:4000/health` → `{"status":"ok", ...}`
   - `http://localhost:4000/health/db` → `{"status":"ok","db":"connected"}` (confirms Supabase is wired up correctly)
   - `http://localhost:5173` → loads the Eventure directory page

## What's already built

- `POST /auth/register`, `/auth/login`, `/auth/refresh` — real bcrypt hashing + JWT access/refresh tokens
- `GET /events` (with `category`/`city`/`date` filters), `GET /events/:id`, `POST /events`
- `GET /events/trending`, `GET /events/featured`
- `POST`/`DELETE /events/:id/attendance` — "I'm Going" toggle
- `GET /events/:id/roster` — respects each user's opt-in `roster_visible` setting
- `POST`/`DELETE /events/:id/save` — bookmark an event
- Socket.IO: `join_event_room` / `new_message`, persisted to the `messages` table
- Frontend: directory page pulling live data from the API, login, and registration

## What you build next

Follow `Eventure_Execution_Plan.md` week by week: maps view, category/date filters in the UI, chat UI, event-creation form, recommendations, and the rest of the roadmap.

## Deployment (Week 2 onward)

- **Frontend →** [Vercel](https://vercel.com): import the repo, set root directory to `frontend`, add the `VITE_*` env vars.
- **Backend →** [Render](https://render.com): new Web Service, root directory `backend`, build command `npm install`, start command `npm start`, add the env vars from `.env.example`.
- **Database →** already hosted on Supabase — no separate deploy step.
