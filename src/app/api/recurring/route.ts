import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, is_recurring, recurrence_pattern } = await req.json();
    
    await prisma.card.update({
      where: { id: cardId },
      data: {
        isRecurring: is_recurring,
        recurrencePattern: recurrence_pattern
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recurring settings' }, { status: 500 });
  }
}