import { Metar } from '@/types/aircraft';

// In-memory cache to avoid hammering aviationweather.gov on every poll
const cache = new Map<string, { data: Metar; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // METARs update hourly; refresh every 30 min

export async function fetchMetar(icao: string): Promise<Metar | null> {
  const now = Date.now();
  const cached = cache.get(icao);
  if (cached && cached.expiresAt > now) return cached.data;

  try {
    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const obs = data?.[0];
    if (!obs) return null;

    // Derive ceiling from cloud layers (lowest BKN or OVC)
    let ceiling: number | null = null;
    if (Array.isArray(obs.clouds)) {
      for (const layer of obs.clouds as { cover: string; base: number }[]) {
        if (layer.cover === 'BKN' || layer.cover === 'OVC') {
          if (ceiling === null || layer.base < ceiling) ceiling = layer.base;
        }
      }
    }

    const metar: Metar = {
      flightCategory: obs.flightCategory ?? null,
      windDir: obs.wdir ?? null,
      windSpeed: obs.wspd ?? null,
      visibility: obs.visib != null ? Number(obs.visib) : null,
      ceiling,
      temp: obs.temp ?? null,
      altimeter: obs.altim ?? null,
      rawOb: obs.rawOb ?? null,
    };

    cache.set(icao, { data: metar, expiresAt: now + CACHE_TTL_MS });
    return metar;
  } catch {
    return null;
  }
}
