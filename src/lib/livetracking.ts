export interface LiveState {
  airborne: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null; // feet
  velocity: number | null; // knots
  heading: number | null;
  originCountry: string;
  lastContact: number;
}

interface AirplanesLiveAc {
  hex: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  gs?: number;
  track?: number;
  r?: string; // registration
  t?: string; // type
}

interface AirplanesLiveResponse {
  ac: AirplanesLiveAc[];
  now: number;
}

/**
 * Fetch live positions for a list of ICAO24 codes via airplanes.live.
 * Returns a map of icao24 (lowercase) → LiveState.
 */
export async function fetchLivePositions(icao24List: string[]): Promise<Map<string, LiveState>> {
  const result = new Map<string, LiveState>();
  if (icao24List.length === 0) return result;

  const responses = await Promise.all(
    icao24List.map((icao24) =>
      fetch(`https://api.airplanes.live/v2/icao/${icao24.toLowerCase()}`)
        .then((r) => (r.ok ? (r.json() as Promise<AirplanesLiveResponse>) : null))
        .catch(() => null),
    ),
  );

  for (const data of responses) {
    if (!data?.ac?.length) continue;
    const ac = data.ac[0];
    const icao24 = ac.hex.toLowerCase();
    const onGround = ac.alt_baro === 'ground';
    result.set(icao24, {
      airborne: !onGround,
      latitude: ac.lat ?? null,
      longitude: ac.lon ?? null,
      altitude: onGround || ac.alt_baro == null ? null : (ac.alt_baro as number),
      velocity: ac.gs ?? null,
      heading: ac.track != null ? Math.round(ac.track) : null,
      originCountry: ac.r ?? '',
      lastContact: Math.floor(data.now / 1000),
    });
  }

  return result;
}
