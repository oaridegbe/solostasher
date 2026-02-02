import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, newStatus } = await req.json();
    
    await prisma.$transaction([
      prisma.card.update({
        where: { id: cardId },
        data: { status: newStatus }
      }),
      prisma.activityLog.create({
        data: {
          cardId,
          action: `Moved to ${newStatus}`
        }
      })
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}