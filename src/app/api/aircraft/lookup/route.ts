import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tail = searchParams.get('tail')?.toUpperCase();

  if (!tail) {
    return NextResponse.json({ error: 'tail parameter is required' }, { status: 400 });
  }

  const res = await fetch(`https://hexdb.io/reg-hex?reg=${encodeURIComponent(tail)}`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Lookup service unavailable' }, { status: 502 });
  }

  const icao24 = (await res.text()).trim().toLowerCase();

  if (!icao24) {
    return NextResponse.json({ error: 'Tail number not found' }, { status: 404 });
  }

  return NextResponse.json({ icao24 });
}
