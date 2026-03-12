import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchLivePositions } from '@/lib/livetracking';
import { fetchFlightRoute } from '@/lib/aviationstack';
import { fetchMetar } from '@/lib/metar';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const aircraft = await prisma.aircraft.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: 'desc' },
  });

  let liveMap = new Map();
  let liveError = false;

  if (aircraft.length > 0) {
    try {
      liveMap = await fetchLivePositions(aircraft.map((a) => a.icao24));
    } catch (err) {
      console.error('[livetracking] fetchLivePositions failed:', err);
      liveError = true;
    }
  }

  const response = await Promise.all(
    aircraft.map(async (a) => {
      const live = liveMap.get(a.icao24.toLowerCase()) ?? null;
      let route = live?.airborne && live.callsign ? await fetchFlightRoute(live.callsign) : null;
      if (route?.destination?.iata) {
        const airport = await prisma.airport.findUnique({
          where: { iata: route.destination.iata },
          select: { latitude: true, longitude: true, icao: true },
        });
        if (airport) {
          const metar = airport.icao ? await fetchMetar(airport.icao) : null;
          route = {
            ...route,
            destination: {
              ...route.destination,
              latitude: airport.latitude,
              longitude: airport.longitude,
              metar,
            },
          };
        }
      }
      return {
        id: a.id,
        tailNumber: a.tailNumber,
        icao24: a.icao24,
        notes: a.notes,
        addedAt: a.addedAt,
        live,
        route,
      };
    }),
  );

  return NextResponse.json({ aircraft: response, liveError });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { tailNumber, icao24, notes } = body as {
    tailNumber: string;
    icao24: string;
    notes?: string;
  };

  if (!tailNumber || !icao24) {
    return NextResponse.json({ error: 'tailNumber and icao24 are required' }, { status: 400 });
  }

  try {
    const aircraft = await prisma.aircraft.create({
      data: {
        userId: session.user.id,
        tailNumber: tailNumber.toUpperCase(),
        icao24: icao24.toLowerCase(),
        notes: notes ?? null,
      },
    });
    return NextResponse.json(aircraft, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: "You've already added this aircraft." }, { status: 409 });
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
