import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: icao24 } = await params;

  try {
    const res = await fetch(
      `https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(icao24)}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) {
      return NextResponse.json({ url: null, photographer: null });
    }
    const data = await res.json();
    const first = data?.photos?.[0];
    return NextResponse.json({
      url: first?.thumbnail?.src ?? null,
      photographer: first?.photographer ?? null,
    });
  } catch {
    return NextResponse.json({ url: null, photographer: null });
  }
}
