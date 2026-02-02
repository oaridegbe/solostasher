import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, tags } = await req.json();
    await prisma.card.update({
      where: { id: cardId },
      data: { tags }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}