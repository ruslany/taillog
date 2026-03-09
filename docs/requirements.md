# Taillog — Requirements Document

A personal web app to track the real-world aircraft you've flown on, showing their live positions on a map.

---

## Tech Stack

| Layer      | Choice                                                   |
| ---------- | -------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                                  |
| Auth       | NextAuth.js v5 with Google OAuth provider                |
| Database   | Local PostgreSQL (dev) + Neon serverless Postgres (prod) |
| ORM        | Prisma 7                                                 |
| Map        | Leaflet.js via react-leaflet                             |
| Styling    | Tailwind CSS + shadcn/ui + next-themes                   |
| Deployment | Vercel                                                   |

---

## UI Component Library

Use **shadcn/ui** throughout the app. Initialize it with `npx shadcn@latest init` during project setup. Use shadcn components as the default choice for all common UI elements:

- `Button` — all buttons including sign-in, add aircraft, delete
- `Input` — all text inputs in forms
- `Label` — form field labels
- `Badge` — airborne / on-ground status indicators
- `Card`, `CardHeader`, `CardContent` — aircraft list items and panel containers
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — mobile tab switcher
- `Separator` — visual dividers in the list panel
- `Avatar` — user profile picture in the navbar (from Google OAuth)
- `Tooltip` — hover labels on icon buttons (e.g. delete button)
- `Alert` — the "Live tracking unavailable" banner when OpenSky is down

Install components individually as needed with `npx shadcn@latest add <component>`. Do not install the full component set at once.

---

- NextAuth.js v5 configured with the Google OAuth provider
- Prisma adapter for NextAuth so users and sessions are persisted in Neon Postgres
- All routes except the landing/sign-in page are protected — unauthenticated users are redirected to `/` (sign-in page)
- No public or anonymous access to any data or map functionality
- Sign-out clears the session and redirects to the landing page

---

## Database Schema

Use Prisma with the following models. The NextAuth Prisma adapter requires `User`, `Account`, `Session`, and `VerificationToken` — include those in full per the adapter docs. Add the following custom model:

```prisma
model Aircraft {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tailNumber  String           // e.g. "N12345" — user-visible registration
  icao24      String           // 6-char hex code used to query OpenSky, e.g. "a1b2c3"
  nickname    String?          // optional friendly label, e.g. "My UA flight to Tokyo"
  addedAt     DateTime @default(now())

  @@unique([userId, icao24])   // prevent duplicate aircraft per user
}
```

---

## Environment Variables

Use two separate env files — `.env.local` for local development and Vercel's environment variables dashboard for production. Never commit either file to git.

**`.env.local` (local development):**

```
# NextAuth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myfleet

# OpenSky Network
OPENSKY_CLIENT_ID=
OPENSKY_CLIENT_SECRET=
```

**Production (Vercel environment variables dashboard):**

```
# NextAuth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=                  # your Vercel production URL

# Neon (serverless Postgres)
DATABASE_URL=                  # Neon pooled connection string
DATABASE_URL_UNPOOLED=         # Neon direct connection string (for Prisma migrations)

# OpenSky Network
OPENSKY_CLIENT_ID=
OPENSKY_CLIENT_SECRET=
```

The Prisma `schema.prisma` datasource uses `env("DATABASE_URL")` throughout — this works for both local Postgres and Neon without any code changes. The `DATABASE_URL_UNPOOLED` variable is only needed in production for running `prisma migrate deploy` against Neon directly.

OpenSky credentials are **only used server-side** (in API routes). They must never be exposed to the client.

---

## Pages & Routes

### `/` — Landing / Sign-in Page

- Simple centered page with app name, a one-line description, and a "Sign in with Google" button
- If the user is already signed in, redirect to `/dashboard`
- Fully responsive — looks good on both mobile and desktop

### `/dashboard` — Main App Page (protected)

- Protected: redirect to `/` if not authenticated
- **Desktop layout** (md breakpoint and above): side-by-side split — left panel (~35%) for the aircraft list and form, right panel (~65%) for the map. Both panels are always visible.
- **Mobile layout** (below md breakpoint): full-screen tabbed interface with two tabs — "My Fleet" (list + form) and "Map". The active tab takes the full viewport height. Tab bar is fixed at the top below the nav.
- Map panel height: on desktop use full viewport height minus the navbar. On mobile, use the full remaining viewport height so the map doesn't feel cramped.

---

## Aircraft List Panel

### Add Aircraft Form

- Two inputs:
  - **Tail Number** (required): text input, e.g. `N12345`. Uppercase automatically.
  - **Nickname** (optional): free text, e.g. "United flight to Tokyo"
- On submit, the app calls the lookup API (see below) to resolve the tail number to an ICAO24 hex code, then saves the aircraft to the database
- If the tail number cannot be resolved to an ICAO24 code, show an inline error: _"Tail number not found in aircraft database. Please check and try again."_
- If the tail number is a duplicate for this user, show: _"You've already added this aircraft."_

### Aircraft List

- Shows all aircraft the user has added, sorted by `addedAt` descending (most recent first)
- Each item displays:
  - Tail number (bold)
  - Nickname (if set, shown below tail number in gray)
  - Live status badge: **Airborne** (green) or **On Ground / Not Tracked** (gray), based on current OpenSky data
  - A delete button (trash icon) with a confirmation prompt before removing
- Clicking an aircraft item that is currently airborne pans the map to that aircraft's position and opens its popup

---

## Map Panel

- Rendered using `react-leaflet` with OpenStreetMap tiles
- Dynamically imported (`next/dynamic` with `ssr: false`) to avoid SSR issues with Leaflet
- Default view: world view (zoom level ~3, centered on 30°N, 10°E)
- For each airborne aircraft in the user's list, show a custom plane icon marker at its current lat/lng, rotated to match its heading
- Clicking a marker opens a popup showing:
  - Tail number and nickname
  - Altitude (feet)
  - Ground speed (knots)
  - Heading (degrees)
  - Origin country
  - Last updated timestamp
- Aircraft that are not currently tracked by OpenSky (on ground, out of coverage, etc.) are not shown on the map but are still shown in the list with a gray badge
- The map auto-refreshes every 30 seconds by re-fetching live positions

---

## Aircraft Photos

Use the **airport-data.com** thumbnail API to fetch photos of each aircraft. It is free, requires no API key, and accepts the ICAO24 hex code directly — which is already stored in the DB.

Request format:

```
https://airport-data.com/api/ac_thumb.json?m={icao24}
```

**Do not store photo URLs in the database.** Since the `icao24` is already persisted, the photo URL can always be derived on demand. The browser's HTTP cache will handle repeat requests efficiently.

**Fetching approach:** Each aircraft card fetches its photo client-side via a Next.js API proxy route `/api/aircraft/[icao24]/photo`. This route calls airport-data.com server-side and returns the first image URL. Set `next: { revalidate: 86400 }` on the fetch call (24-hour cache) so repeated renders within a day don't hit airport-data.com at all.

**Display — two placements:**

1. **Aircraft card in the list panel** — show a small thumbnail (72×48px, rounded corners) on the left edge of each card, with the tail number, nickname, and status badge to the right. This is the primary placement since the list is always visible.

2. **Leaflet map popup** — show a larger photo (200×130px, rounded corners) at the top of the popup, above the flight stats (altitude, speed, heading, etc). This makes the popup feel like a rich flight card.

Use a single `aircraft-photo.tsx` component for both placements. It should accept a `size` prop (`"thumb"` | `"full"`) to render the appropriate dimensions, keeping photo-fetching and fallback logic in one place.

In both placements:

- Always display the photographer's name as a small muted caption below the photo (it is included in the API response and crediting is good etiquette)
- If the API returns no photo (`count: 0`) or the request fails, fall back to a generic plane SVG icon — do not show a broken image element

---

## API Routes

All API routes require an authenticated session. Return `401` if no session is present.

### `GET /api/aircraft/[icao24]/photo`

Proxies a photo lookup to airport-data.com for the given ICAO24 code. Returns the first available thumbnail URL and photographer credit, or `null` if none found. Uses Next.js fetch caching with a 24-hour revalidation window so airport-data.com is not hit on every render.

Response shape:

```json
{
  "imageUrl": "https://airport-data.com/images/aircraft/thumbnails/000/582/582407.jpg",
  "photographer": "Jan Ittensammer"
}
```

Returns `{ "imageUrl": null, "photographer": null }` if no photo is available.

### `GET /api/aircraft`

Returns all aircraft saved by the current user, each with its current live data from OpenSky appended.

Response shape per aircraft:

```json
{
  "id": "cuid",
  "tailNumber": "N12345",
  "icao24": "a1b2c3",
  "nickname": "United to Tokyo",
  "addedAt": "2025-01-01T00:00:00Z",
  "live": {
    "airborne": true,
    "latitude": 35.6,
    "longitude": 139.7,
    "altitude": 35000,
    "velocity": 480,
    "heading": 275,
    "originCountry": "United States",
    "lastContact": 1710000000
  }
}
```

If the aircraft is not currently tracked by OpenSky, `live` is `null`.

### `POST /api/aircraft`

Adds an aircraft to the current user's list.

Request body:

```json
{ "tailNumber": "N12345", "icao24": "a1b2c3", "nickname": "optional" }
```

Returns the created `Aircraft` record or a `409` if it's a duplicate.

### `DELETE /api/aircraft/[id]`

Deletes the aircraft with the given ID, only if it belongs to the current user. Returns `403` if it belongs to another user.

### `GET /api/aircraft/lookup?tail=N12345`

Resolves a tail number to an ICAO24 hex code using the OpenSky aircraft metadata API:
`https://opensky-network.org/api/metadata/aircraft/registration/{tail}`

- Returns `{ "icao24": "a1b2c3" }` on success
- Returns `404` if not found
- This endpoint authenticates to OpenSky using `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` via OAuth2 client credentials flow

### OpenSky Live Position Fetching (internal utility, not a route)

Create a server-side utility function `fetchLivePositions(icao24List: string[])` that:

- Calls `https://opensky-network.org/api/states/all` with `icao24` filter params
- Authenticates using the OAuth2 bearer token obtained from OpenSky's token endpoint
- Returns a map of `icao24 → live state`
- Called internally by `GET /api/aircraft` — never called from the client

---

## OpenSky Integration Notes

- OpenSky uses **ICAO 24-bit addresses** (6-char hex, e.g. `a1b2c3`) to identify aircraft, not tail numbers
- Tail number → ICAO24 resolution happens once at add-time via the lookup API and is stored in the DB
- OpenSky OAuth2 token endpoint: `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`
- Use `grant_type=client_credentials` with `client_id` and `client_secret` from env vars
- Cache the bearer token in memory (it's valid for several minutes) to avoid re-authenticating on every request
- Rate limits: registered users get 4,000 API credits/day; each `/states/all` call costs credits proportional to the number of aircraft returned — filtering by `icao24` keeps costs low

---

## Error Handling & Edge Cases

- If OpenSky is unreachable or returns an error, the aircraft list still loads but all `live` fields are `null`. Show a subtle banner: _"Live tracking unavailable — OpenSky may be down."_
- If a tail number resolves to an ICAO24 but OpenSky has no current data for it, show the aircraft in the list with a gray "Not Tracked" badge
- Prisma/DB errors should be caught and return a `500` with a generic message; do not leak stack traces
- All forms should have loading states and disable submit buttons while requests are in-flight

---

## Project Structure

```
/app
  /                    # Landing / sign-in page
  /dashboard           # Main protected page
  /api
    /auth/[...nextauth]  # NextAuth handler
    /aircraft
      route.ts           # GET (list), POST (add)
      /[id]/route.ts     # DELETE
      /lookup/route.ts   # GET tail → icao24 lookup
/components
  aircraft-list.tsx
  add-aircraft-form.tsx
  aircraft-item.tsx
  map.tsx              # dynamically imported, client component
  plane-marker.tsx
  mobile-tabs.tsx      # tab switcher shown only on mobile (md:hidden)
  aircraft-photo.tsx   # thumbnail with photographer credit + fallback icon
/lib
  prisma.ts            # Prisma client singleton
  opensky.ts           # OpenSky auth + fetchLivePositions utility
  auth.ts              # NextAuth config
/prisma
  schema.prisma
```

---

## Mobile Rendering Requirements

- Use Tailwind responsive prefixes throughout (`sm:`, `md:`, `lg:`) — never hardcode pixel widths
- The add-aircraft form inputs and buttons must be full-width on mobile (`w-full`)
- Aircraft list items must be touch-friendly — minimum 48px tap target height
- The map must fill the full available height on mobile so it doesn't feel like a small widget. Use `h-[calc(100vh-Xrem)]` accounting for the navbar and tab bar heights.
- The Leaflet map must handle touch gestures (pinch-to-zoom, drag) — these work by default but ensure `dragging` and `touchZoom` are not disabled
- Popups on the map must be readable on small screens — set a `maxWidth` of 240px on Leaflet popups
- The delete confirmation prompt should use a `window.confirm` dialog on mobile (acceptable for a personal app) rather than an inline popover that may be hard to dismiss on small screens
- Navbar on mobile: show only the app logo/name and a sign-out icon button (no text labels)

---

## Dark / Light / System Theme Support

Use **`next-themes`** for theme management. It integrates seamlessly with Tailwind's `darkMode: "class"` strategy and shadcn/ui, which is already built around this pattern.

**Setup:**

- Add `darkMode: "class"` to `tailwind.config.ts`
- Wrap the app in a `ThemeProvider` from `next-themes` in the root layout, with `attribute="class"`, `defaultTheme="system"`, and `enableSystem={true}`
- shadcn/ui components will automatically respond to the theme class — no extra work needed for them

**Theme toggle:**

- Add a theme toggle button to the navbar
- Use a shadcn `Button` with a sun/moon/monitor icon from `lucide-react`
- Cycle through `light → dark → system` on each click, or use a small dropdown with all three options
- Persist the user's choice across sessions (next-themes handles this via localStorage automatically)

**Leaflet map theming:**

- In light mode use the standard OpenStreetMap tile layer
- In dark mode use the CartoDB Dark Matter tile layer: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Switch tile layers reactively when the theme changes using the `useTheme` hook from next-themes

**General guidance:**

- Use Tailwind `dark:` variants for any custom styles not covered by shadcn components
- Ensure text contrast meets readability standards in both modes
- The status badges (Airborne / On Ground), aircraft cards, and map popups should all look polished in both themes

---

## Out of Scope (for now)

- Historical flight path replay
- Push notifications for takeoff/landing
- Mobile native app
- Sharing your fleet publicly with other users
- Multiple users on the same account
