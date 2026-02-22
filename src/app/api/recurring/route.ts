import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { cardId, newStatus } = await request.json();
    
    // Update the card status
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus }
    });

    // If moving to completed and card is recurring, create next occurrence
    if (newStatus === 'completed' && updatedCard.isRecurring) {
      const pattern = updatedCard.recurrencePattern || 'monthly';
      
      // Calculate next due date
      let nextDueDate: Date | null = null;
      if (updatedCard.dueDate) {
        const currentDue = new Date(updatedCard.dueDate);
        nextDueDate = new Date(currentDue);
        
        switch (pattern) {
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
          default:
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
      }

      // Create new recurring deal
      const newCard = await prisma.card.create({
        data: {
          title: updatedCard.title,
          clientEmail: updatedCard.clientEmail,
          color: updatedCard.color,
          tags: updatedCard.tags,
          files: updatedCard.files,
          isRecurring: true,
          recurrencePattern: pattern,
          dueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
          status: 'inquiry',
          currency: updatedCard.currency,
          value: updatedCard.value
        }
      });

      // Log the activity
      await prisma.activityLog.create({
        data: {
          cardId: newCard.id,
          action: 'recurring_created',
          details: `Auto-created from completed deal. Pattern: ${pattern}`
        }
      });
    }

    // Log the move activity
    await prisma.activityLog.create({
      data: {
        cardId: cardId,
        action: 'status_changed',
        details: `Moved to ${newStatus}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}