import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, files } = await req.json();
    await prisma.card.update({
      where: { id: cardId },
      data: { files }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update files' }, { status: 500 });
  }
}