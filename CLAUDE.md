# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
```

Schema changes require `npx prisma migrate dev` followed by `npm run build` (which runs `prisma generate`).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEONDB_DATABASE_URL` or `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `AUTH_SECRET` | Yes | NextAuth secret |
| `ALLOWED_EMAILS` | No | Comma-separated email allowlist; empty = allow all |
| `AVIATIONSTACK_API_KEY` | No | Flight route lookup (cached in DB) |

## Architecture

**TailLog** is a Next.js 16 app (App Router) for tracking a personal fleet of aircraft with live ADS-B positions.

### Data flow

1. User adds an aircraft by tail number → `GET /api/aircraft/lookup?tail=N12345` resolves it to an ICAO24 hex code via [hexdb.io](https://hexdb.io), then `POST /api/aircraft` stores it in Postgres via Prisma.
2. Dashboard polls `GET /api/aircraft` every 30 seconds. The API handler:
   - Fetches all user aircraft from DB
   - Calls `fetchLivePositions()` (airplanes.live API, one request per aircraft) to get real-time ADS-B data
   - For airborne aircraft with a callsign, calls `fetchFlightRoute()` which queries AviationStack and caches results in the `FlightRouteCache` table (keyed by callsign + UTC date)
3. Dashboard renders a two-panel layout: `AircraftList` (sidebar) + `FleetMap` (Leaflet map). Mobile uses `MobileTabs` to switch between the two views.

### Key files

- `src/lib/livetracking.ts` — fetches live ADS-B positions from airplanes.live
- `src/lib/aviationstack.ts` — fetches flight routes from AviationStack with DB caching
- `src/lib/auth.ts` — NextAuth v5 config (Google provider + PrismaAdapter + email allowlist)
- `src/lib/prisma.ts` — singleton Prisma client using `@prisma/adapter-pg` (Neon serverless compatible)
- `src/types/aircraft.ts` — shared `AircraftWithLive` type used across API and frontend

### Database

Prisma schema lives in `prisma/schema.prisma`. Generated client outputs to `src/generated/prisma/` (not the default location). Models: `User`, `Account`, `Session`, `VerificationToken` (NextAuth), `Aircraft`, `FlightRouteCache`.

### Auth

NextAuth v5 (beta) with Google OAuth. Only the `session` callback is customized (to expose `user.id`). Access control is enforced in every API route by checking `session.user.id`.

### Map

`src/components/map.tsx` uses React-Leaflet and is loaded with `dynamic(..., { ssr: false })` to avoid SSR issues with Leaflet's browser-only globals.
