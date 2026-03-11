# TailLog

A personal aircraft fleet tracker with live ADS-B positions, built with Next.js.

## Features

- **Fleet management** — add aircraft by tail number; ICAO24 hex codes are resolved automatically via [hexdb.io](https://hexdb.io)
- **Live positions** — dashboard polls [airplanes.live](https://airplanes.live) every 30 seconds for real-time ADS-B data
- **Flight routes** — airborne aircraft with an active callsign show origin/destination via AviationStack (results cached in the database by callsign + date)
- **Aircraft photos** — fetched and displayed per aircraft
- **Interactive map** — Leaflet map with animated plane markers and heading indicators
- **Google OAuth** — sign in with Google; optional email allowlist for access control

## Tech stack

- [Next.js](https://nextjs.org) 15 (App Router)
- [Prisma](https://prisma.io) with PostgreSQL ([Neon](https://neon.tech) serverless compatible)
- [NextAuth v5](https://authjs.dev) — Google OAuth
- [React-Leaflet](https://react-leaflet.js.org) — map
- [shadcn/ui](https://ui.shadcn.com) — UI components

## Getting started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. Neon)
- A Google OAuth app ([console.cloud.google.com](https://console.cloud.google.com))

### Environment variables

Create a `.env.local` file:

```env
NEONDB_DATABASE_URL=postgresql://...   # or DATABASE_URL
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...                        # generate with: npx auth secret
ALLOWED_EMAILS=you@example.com         # optional; empty = allow all
AVIATIONSTACK_API_KEY=...              # optional; enables flight route lookup
```

### Install and run

```bash
npm install
npx prisma migrate dev   # create database tables
npm run dev              # start development server at http://localhost:3000
```

## Development commands

```bash
npm run dev          # Start development server
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
```

After changing `prisma/schema.prisma`, run `npx prisma migrate dev` then `npm run build`.
