import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { cardId, due_date } = await req.json();
    
    // Update the card due date
    await prisma.card.update({
      where: { id: cardId },
      data: { due_date: due_date || null }
    });

    // If due date is set, schedule a notification
    if (due_date) {
      // Check if there's already a pending notification for this card
      const existing = await prisma.notificationQueue.findFirst({
        where: { 
          cardId: cardId,
          status: "pending"
        }
      });

      if (existing) {
        // Update existing notification
        await prisma.notificationQueue.update({
          where: { id: existing.id },
          data: {
            dueDate: new Date(due_date),
            type: "email"
          }
        });
      } else {
        // Create new notification
        await prisma.notificationQueue.create({
          data: {
            cardId: cardId,
            dueDate: new Date(due_date),
            type: "email",
            status: "pending"
          }
        });
      }

      // Log the activity
      await prisma.activityLog.create({
        data: {
          cardId: cardId,
          action: "notification_scheduled",
          details: `Email reminder scheduled for ${due_date}`
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating due_date:", error);
    return NextResponse.json({ error: 'Failed to update due_date' }, { status: 500 });
  }
}