import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, newStatus } = await req.json();
    
    // Get the current card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus }
    });

    // If moving to completed and card is recurring, create next occurrence
    if (newStatus === 'completed' && updatedCard.isRecurring) {
      const pattern = updatedCard.recurrencePattern || 'monthly';
      
      // Calculate next due date
      let nextDueDate: string | null = null;
      if (updatedCard.dueDate) {
        const currentDue = new Date(updatedCard.dueDate);
        const nextDate = new Date(currentDue);
        
        switch (pattern) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        nextDueDate = nextDate.toISOString();
      }

      // Create new recurring deal
      const createData: any = {
        title: updatedCard.title,
        clientEmail: updatedCard.clientEmail,
        color: updatedCard.color,
        status: 'inquiry',
        priority: 'medium',
        isRecurring: true,
        recurrencePattern: pattern,
        dueDate: nextDueDate,
        tags: '',
        files: '[]'
      };

      await prisma.card.create({
        data: createData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}