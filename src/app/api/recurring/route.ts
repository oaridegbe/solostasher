import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force dynamic rendering - prevents static generation error
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, isRecurring, pattern } = await req.json();

    await prisma.card.update({
      where: { id: cardId },
      data: {
        isRecurring,
        recurrencePattern: isRecurring ? pattern : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recurring:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}