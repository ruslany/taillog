# Taillog — Execution Stages

Each stage is self-contained and ends with a working, testable state. Complete and verify each stage before moving to the next. Start each Claude Code session by referencing both `requirements.md` and this file, telling it which stage you are on.

---

## Stage 1 — Project Scaffolding & Configuration

Goal: a running Next.js app with all dependencies installed and environment wired up, but no features yet.

- Init Next.js 14 app with App Router and TypeScript: `npx create-next-app@latest myfleet --typescript --tailwind --app`
- Install and init shadcn/ui: `npx shadcn@latest init`
- Install next-themes: `npm install next-themes`
- Install NextAuth v5: `npm install next-auth@beta`
- Install Prisma and Neon driver: `npm install prisma @prisma/client @neondatabase/serverless`
- Install react-leaflet and types: `npm install react-leaflet leaflet && npm install -D @types/leaflet`
- Add `darkMode: "class"` to `tailwind.config.ts`
- Create `.env.local` with all required variable keys (values empty for now — just the keys as a checklist)
- Set up `lib/prisma.ts` singleton
- Verify the app runs on localhost with `npm run dev` — default Next.js home page is fine at this point

**Checkpoint:** `npm run dev` starts without errors.

---

## Stage 2 — Database Schema & Migrations

Goal: Prisma schema defined and applied to your local Postgres instance, database ready to accept data.

- Make sure PostgreSQL is running locally (via Homebrew, Postgres.app, or Docker)
- Create the local database: `createdb myfleet` (or `psql -c "CREATE DATABASE myfleet;"`)
- Set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myfleet` in `.env.local` — adjust username/password to match your local Postgres setup
- Configure `prisma/schema.prisma` with:
  - `provider = "postgresql"` in the datasource block
  - Full NextAuth v5 Prisma adapter models (`User`, `Account`, `Session`, `VerificationToken`)
  - Custom `Aircraft` model as specified in requirements
- Run `npx prisma migrate dev --name init` to apply the schema to local Postgres
- Run `npx prisma generate` to generate the client
- Open Prisma Studio (`npx prisma studio`) to confirm tables exist

**Checkpoint:** All tables visible in Prisma Studio with correct columns.

---

## Stage 3 — Authentication

Goal: users can sign in with Google and are redirected to the dashboard. Unauthenticated users cannot access protected routes.

- Create a Google OAuth app in Google Cloud Console, obtain `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, add to `.env.local`
- Set `AUTH_SECRET` (generate with `npx auth secret`) and `NEXTAUTH_URL` in `.env.local`
- Create `lib/auth.ts` with NextAuth v5 config using Google provider and Prisma adapter
- Create `app/api/auth/[...nextauth]/route.ts` handler
- Create the landing page `app/page.tsx`: centered layout with app name, tagline, and "Sign in with Google" button. Redirect to `/dashboard` if already signed in.
- Create a placeholder `app/dashboard/page.tsx` that just shows "Welcome, [user name]" — protected, redirects to `/` if no session
- Add route protection via NextAuth middleware (`middleware.ts`) — protect `/dashboard` and `/api/aircraft/*` routes
- Wrap root layout in `ThemeProvider` from next-themes

**Checkpoint:** Clicking "Sign in with Google" completes OAuth flow, creates a user row in the DB, and lands on the dashboard placeholder. Visiting `/dashboard` without a session redirects to `/`.

---

## Stage 4 — Navbar & Theme Toggle

Goal: persistent navbar across all authenticated pages with sign-out and theme switching.

- Create `components/navbar.tsx`:
  - App name/logo on the left
  - Theme toggle button (cycles light → dark → system) using `useTheme` from next-themes and lucide-react icons (`Sun`, `Moon`, `Monitor`)
  - User avatar (from Google profile image) using shadcn `Avatar`
  - Sign-out button (icon only on mobile, icon + text on desktop)
- Install required shadcn components: `npx shadcn@latest add avatar button dropdown-menu`
- Add navbar to the dashboard layout `app/dashboard/layout.tsx`

**Checkpoint:** Navbar renders on the dashboard. Theme toggle cycles through modes and persists on page refresh. Sign-out returns to landing page.

---

## Stage 5 — Aircraft CRUD API Routes

Goal: API routes to list, add, and delete aircraft, backed by the database. No UI yet.

- Create `app/api/aircraft/route.ts`:
  - `GET` — return all aircraft for the current user
  - `POST` — add an aircraft (accepts `tailNumber`, `icao24`, `nickname`). Return `409` on duplicate.
- Create `app/api/aircraft/[id]/route.ts`:
  - `DELETE` — delete aircraft by ID, verify ownership, return `403` if mismatch
- Create `app/api/aircraft/lookup/route.ts`:
  - `GET ?tail=N12345` — resolve tail number to ICAO24 via OpenSky metadata API. Return `404` if not found.
  - Add `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` to `.env.local` from your OpenSky account
- Create `lib/opensky.ts`:
  - OAuth2 token fetch using client credentials flow
  - In-memory token cache with expiry check
  - `fetchLivePositions(icao24List)` utility function
- All routes must return `401` if no session

**Checkpoint:** Test all routes with a REST client (curl or Postman). Add an aircraft, list it, delete it. Verify the lookup route resolves a real tail number to an ICAO24 code.

---

## Stage 6 — Aircraft List UI

Goal: the left panel of the dashboard is functional — users can add and delete aircraft from the UI.

- Install shadcn components: `npx shadcn@latest add card badge input label separator alert tooltip`
- Create `components/add-aircraft-form.tsx`:
  - Tail number input (auto-uppercases) and optional nickname input
  - On submit: calls `/api/aircraft/lookup` then `/api/aircraft` (POST)
  - Shows inline error messages for not-found and duplicate cases
  - Loading state disables the submit button during requests
- Create `components/aircraft-item.tsx`:
  - Displays tail number, nickname, and airborne/on-ground status badge
  - Delete button with `window.confirm` before calling `DELETE /api/aircraft/[id]`
  - Placeholder for photo thumbnail (grey box for now — photo comes in Stage 8)
- Create `components/aircraft-list.tsx`:
  - Renders the list of aircraft items
  - Shows an empty state message if the list is empty
  - Polls `GET /api/aircraft` every 30 seconds to refresh live status badges
- Wire up the dashboard page with the list panel on the left and a placeholder grey box for the map on the right
- Desktop: side-by-side layout. Mobile: tabbed layout using shadcn `Tabs` with "My Fleet" and "Map" tabs.
- Create `components/mobile-tabs.tsx` for the tab switcher

**Checkpoint:** Add a real aircraft by tail number, see it appear in the list with a live status badge. Delete it. Verify the 30-second polling updates the badge.

---

## Stage 7 — Map

Goal: the Leaflet map renders on the right panel and shows live plane markers for airborne aircraft.

- Create `components/map.tsx` as a client component, dynamically imported with `ssr: false`
- Configure two tile layers:
  - Light mode: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
  - Dark mode: CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
  - Switch reactively based on `useTheme`
- Create `components/plane-marker.tsx`:
  - Custom plane SVG icon rotated to match the aircraft heading
  - On click: open a Leaflet popup showing tail number, nickname, altitude, speed, heading, origin country, last updated
  - Popup `maxWidth` set to 240px
- Map defaults: zoom level 3, centered on 30°N, 10°E
- Clicking an airborne aircraft in the list panel pans the map to its position and opens its popup
- Aircraft not tracked by OpenSky are not shown on the map
- Wire the map into the dashboard replacing the grey placeholder

**Checkpoint:** Airborne aircraft from your list appear as rotated plane icons on the map. Clicking a marker shows the popup. Clicking an item in the list pans to it. Dark mode switches the tile layer.

---

## Stage 8 — Aircraft Photos

Goal: real aircraft photos appear on cards and in map popups.

- Create `app/api/aircraft/[icao24]/photo/route.ts`:
  - Calls `https://airport-data.com/api/ac_thumb.json?m={icao24}`
  - Returns first image URL and photographer name, or nulls if none found
  - Uses `next: { revalidate: 86400 }` for 24-hour caching
- Create `components/aircraft-photo.tsx`:
  - Accepts `icao24`, `size: "thumb" | "full"`, fetches from the photo API route
  - `thumb`: 72×48px, used in aircraft cards
  - `full`: 200×130px, used in map popups
  - Shows photographer credit as small muted text below
  - Falls back to a generic plane SVG icon if no photo available
- Integrate into `aircraft-item.tsx` (thumb) and `plane-marker.tsx` popup (full)

**Checkpoint:** Aircraft cards show a real photo thumbnail on the left. Map popups show a larger photo at the top. Both fall back gracefully to the plane icon when no photo is available.

---

## Stage 9 — Polish & Edge Cases

Goal: the app handles all error states gracefully and is production-ready.

- Add the "Live tracking unavailable" `Alert` banner when OpenSky returns an error
- Ensure all forms have proper loading spinners and disabled states during requests
- Add `not-found.tsx` and `error.tsx` boundary pages
- Audit all components for mobile responsiveness:
  - Touch targets minimum 48px
  - Full-width inputs on mobile
  - Map fills full available viewport height on mobile
- Verify Leaflet touch gestures work (pinch-to-zoom, drag)
- Audit dark mode across all components — check cards, badges, popups, forms, navbar
- Add a favicon and page title (`MyFleet`) in root layout metadata

**Checkpoint:** Walk through the full user journey on both desktop and a mobile viewport in both light and dark modes. All edge cases (empty list, OpenSky down, no photo, duplicate aircraft) handled gracefully.

---

## Stage 10 — Deployment

Goal: the app is live on Vercel backed by a Neon production database.

- Push the project to a GitHub repository
- Create a new project on [neon.tech](https://neon.tech) and copy the pooled and direct connection strings
- Create a new Vercel project linked to the GitHub repo
- Add all production environment variables to Vercel's dashboard (see requirements — use Neon connection strings, not the local Postgres URL)
- Update `NEXTAUTH_URL` to the production Vercel URL
- Add the production Vercel URL to the allowed redirect URIs in your Google Cloud OAuth app
- Run `prisma migrate deploy` against the Neon database using `DATABASE_URL_UNPOOLED`: `DATABASE_URL=<neon-direct-url> npx prisma migrate deploy`
- Deploy on Vercel and verify the full sign-in flow works on the live URL

**Checkpoint:** App is live. Sign in with Google, add an aircraft, see it on the map. Share the URL with yourself on mobile and verify the mobile layout.
