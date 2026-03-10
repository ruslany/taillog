import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchLivePositions } from '@/lib/opensky';

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
  let openskyError = false;

  if (aircraft.length > 0) {
    try {
      liveMap = await fetchLivePositions(aircraft.map((a) => a.icao24));
    } catch {
      openskyError = true;
    }
  }

  const response = aircraft.map((a) => ({
    id: a.id,
    tailNumber: a.tailNumber,
    icao24: a.icao24,
    nickname: a.nickname,
    addedAt: a.addedAt,
    live: liveMap.get(a.icao24.toLowerCase()) ?? null,
  }));

  return NextResponse.json({ aircraft: response, openskyError });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { tailNumber, icao24, nickname } = body as {
    tailNumber: string;
    icao24: string;
    nickname?: string;
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
        nickname: nickname ?? null,
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
