import { prisma } from '@/lib/prisma';
import { FlightRoute } from '@/types/aircraft';

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchFlightRoute(callsign: string): Promise<FlightRoute | null> {
  const date = todayUTC();

  const cached = await prisma.flightRouteCache.findUnique({
    where: { callsign_date: { callsign, date } },
  });

  if (cached) {
    return {
      origin: cached.originIata ? { iata: cached.originIata, name: cached.originName! } : null,
      destination: cached.destinationIata
        ? { iata: cached.destinationIata, name: cached.destinationName! }
        : null,
    };
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({ access_key: apiKey, flight_icao: callsign });
  const res = await fetch(`http://api.aviationstack.com/v1/flights?${params.toString()}`);
  if (!res.ok) {
    if (res.status === 429) {
      console.info('[AviationStack] Monthly quota exceeded');
    } else {
      console.error(`[AviationStack] Request failed: ${res.status}`);
    }
    return null;
  }

  const data = await res.json();
  const flight = data?.data?.[0];

  const route: FlightRoute = flight
    ? {
        origin: flight.departure?.iata
          ? { iata: flight.departure.iata, name: flight.departure.airport }
          : null,
        destination: flight.arrival?.iata
          ? { iata: flight.arrival.iata, name: flight.arrival.airport }
          : null,
      }
    : { origin: null, destination: null };

  // Cache even null/empty results so repeated polls don't re-hit the API
  await prisma.flightRouteCache.create({
    data: {
      callsign,
      date,
      originIata: route.origin?.iata ?? null,
      originName: route.origin?.name ?? null,
      destinationIata: route.destination?.iata ?? null,
      destinationName: route.destination?.name ?? null,
    },
  });

  return flight ? route : null;
}
