import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, dueDate, email } = await req.json();

    const notification = await prisma.notificationQueue.upsert({
      where: {
        id: `${cardId}-due`
      },
      update: {
        dueDate: new Date(dueDate),
        type: email ? "email" : "notification"
      } as any,
      create: {
        id: `${cardId}-due`,
        cardId: cardId,
        dueDate: new Date(dueDate),
        type: email ? "email" : "notification",
        status: 'pending'
      } as any
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json({ error: 'Failed to schedule notification' }, { status: 500 });
  }
}