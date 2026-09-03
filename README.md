# Assalam School Portal — Frontend

A separate Next.js project. It never touches your database directly,
it calls your existing Express server (`server.js`) over the network,
exactly the way your old `admin.html`/`exam.html` pages already do.

## Setup

```
npm install
cp .env.local.example .env.local
```

Open `.env.local` and confirm `NEXT_PUBLIC_API_BASE_URL` points at
your running Express server (defaults to `http://localhost:5000`).

## Running it

Two servers run side by side during development:

```
# Terminal 1 — your existing backend, unchanged
cd C:\assalam-cbt-server-main
node server.js

# Terminal 2 — this new frontend
cd assalam-frontend
npm run dev
```

Then open `http://localhost:3000`.

## What's actually built in this pass

- **Landing / portal selection page** (`/`) — pulls your real school
  name, motto, address, and phone from `/api/meta` live.
- **Admin login** (`/admin/login`) — calls your real
  `POST /api/admin/login`, sets the same session cookie your old
  admin panel uses.
- **Admin dashboard overview** (`/admin/dashboard`) — real student,
  teacher, and class counts, pulled live from your existing
  `/api/admin/classes`, `/api/admin/teachers`, and
  `/api/class/:id/students` endpoints.
- **Teacher / Exam / Parent portals** — placeholder screens for now,
  styled consistently, not broken links, just not built out yet.

## Design system

Defined in `tailwind.config.ts` and `app/globals.css`:

- **Colors:** `ink`, `indigo` (the school's own navy), `gold`
  (antique gold, matches the real ID card border), `parchment`
  (warm paper background), `sage`, `clay`.
- **Type:** Fraunces (display headings), IBM Plex Sans (UI/body),
  IBM Plex Mono (IDs, dates, scores).
- **Signature motif:** the perforated "ticket stub" edge on the
  portal-selection cards (see `.ticket-notch` in `globals.css`),
  echoing the exam admission slips and ID cards this software
  already produces.

## What's next

Everything past the dashboard overview, the actual Students,
Teachers, Classes & Subjects, Attendance, Report Sheets, and School
Settings screens, plus the real Teacher, Exam, and Parent portals,
still needs building. This first pass focused on getting the
foundation (design system, API client, layout shell) genuinely
solid, so every screen after this one can be built quickly and stay
consistent, rather than rushing all of them at once.

## One thing to know before deploying this for real

Right now the session cookie is set with `sameSite: "lax"`, which
works for local development since `localhost:3000` and
`localhost:5000` count as the same site. If you ever deploy the
frontend and backend to two different real domains, that cookie
setting will need to change to `sameSite: "none"` with `secure: true`
in `server.js`, otherwise login won't persist across requests.
