import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.notificationQueue.findMany({
      where: {
        status: 'pending',
        dueDate: { lte: new Date() }
      },
      include: { card: true }
    });

    for (const notification of notifications) {
      if (notification.email) {
        await sendEmail(notification.email, notification.card.title);
      }
      
      if (notification.slackWebhook) {
        await fetch(notification.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔔 Reminder: "${notification.card.title}" is due!`
          })
        });
      }
      
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: { status: 'sent' }
      });
    }

    return NextResponse.json({ processed: notifications.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

async function sendEmail(to: string, cardTitle: string) {
  console.log(`Sending email to ${to} for card: ${cardTitle}`);
}