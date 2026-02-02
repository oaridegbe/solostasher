import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, due_date } = await req.json();
    await prisma.card.update({
      where: { id: cardId },
      data: { dueDate: due_date ? new Date(due_date) : null }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update due date' }, { status: 500 });
  }
}