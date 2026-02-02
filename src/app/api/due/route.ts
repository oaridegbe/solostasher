import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, due_date } = await req.json();
    await prisma.card.update({
      where: { id: cardId },
      data: { due_date: due_date || null }  // Remove new Date()
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update due_date' }, { status: 500 });
  }
}