import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevents static generation error
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, dueDate } = await req.json();

    await prisma.card.update({
      where: { id: cardId },
      data: { dueDate: dueDate || null }
    });

    if (dueDate) {
      // Schedule notification logic here
      console.log('Due date set:', dueDate);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating dueDate:", error);
    return NextResponse.json({ error: 'Failed to update dueDate' }, { status: 500 });
  }
}