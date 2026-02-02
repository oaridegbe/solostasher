import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { cardId, dueDate, email, slackWebhook } = await req.json();
    
    await prisma.notificationQueue.upsert({
      where: { cardId },
      update: {
        dueDate: new Date(dueDate),
        email: email || null,
        slackWebhook: slackWebhook || null,
        status: 'pending'
      },
      create: {
        cardId,
        dueDate: new Date(dueDate),
        email: email || null,
        slackWebhook: slackWebhook || null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to schedule notification' }, { status: 500 });
  }
}