const TOKEN_ENDPOINT =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.OPENSKY_CLIENT_ID!,
    client_secret: process.env.OPENSKY_CLIENT_SECRET!,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenSky token request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  cachedToken = data.access_token as string;
  // Expire 60 seconds early to be safe (token is valid for 30 min = 1800s)
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export interface LiveState {
  airborne: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null; // meters → converted to feet by caller
  velocity: number | null; // m/s → converted to knots by caller
  heading: number | null;
  originCountry: string;
  lastContact: number;
}

/**
 * Fetch live positions for a list of ICAO24 codes.
 * Returns a map of icao24 (lowercase) → LiveState.
 * Returns an empty map if OpenSky is unreachable.
 */
export async function fetchLivePositions(icao24List: string[]): Promise<Map<string, LiveState>> {
  const result = new Map<string, LiveState>();
  if (icao24List.length === 0) return result;

  const token = await getAccessToken();

  const params = new URLSearchParams();
  for (const code of icao24List) {
    params.append('icao24', code.toLowerCase());
  }

  const res = await fetch(`https://opensky-network.org/api/states/all?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenSky states/all failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  if (!data.states) return result;

  for (const s of data.states as unknown[][]) {
    // OpenSky state vector indices:
    // 0: icao24, 1: callsign, 2: origin_country, 3: time_position,
    // 4: last_contact, 5: longitude, 6: latitude, 7: baro_altitude,
    // 8: on_ground, 9: velocity, 10: true_track, 11: vertical_rate,
    // 12: sensors, 13: geo_altitude, 14: squawk, 15: spi, 16: position_source
    const icao24 = (s[0] as string).toLowerCase();
    result.set(icao24, {
      airborne: !(s[8] as boolean),
      latitude: s[6] as number | null,
      longitude: s[5] as number | null,
      altitude: s[7] != null ? Math.round((s[7] as number) * 3.28084) : null,
      velocity: s[9] != null ? Math.round((s[9] as number) * 1.94384) : null,
      heading: s[10] != null ? Math.round(s[10] as number) : null,
      originCountry: s[2] as string,
      lastContact: s[4] as number,
    });
  }

  return result;
}
