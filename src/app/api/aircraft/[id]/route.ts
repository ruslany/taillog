import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const aircraft = await prisma.aircraft.findUnique({ where: { id } });

  if (!aircraft) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (aircraft.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { nickname } = (await req.json()) as { nickname?: string };
  const updated = await prisma.aircraft.update({
    where: { id },
    data: { nickname: nickname?.trim() || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const aircraft = await prisma.aircraft.findUnique({ where: { id } });

  if (!aircraft) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (aircraft.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.aircraft.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
