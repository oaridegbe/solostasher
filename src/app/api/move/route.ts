import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, newStatus } = await req.json();
    
    console.log('=== MOVE CARD DEBUG ===');
    console.log('cardId:', cardId);
    console.log('newStatus:', newStatus);
    
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus }
    });

    console.log('Card updated:', updatedCard.id);
    console.log('isRecurring:', updatedCard.isRecurring);
    console.log('recurrencePattern:', updatedCard.recurrencePattern);

    if (newStatus === 'completed' && updatedCard.isRecurring) {
      console.log('>>> Creating recurring card <<<');
      
      const pattern = updatedCard.recurrencePattern || 'monthly';
      
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
        }
        
        nextDueDate = nextDate.toISOString();
        console.log('Next due date:', nextDueDate);
      }

      try {
        const newCard = await prisma.card.create({
          data: {
            title: updatedCard.title,
            clientEmail: updatedCard.clientEmail,
            color: updatedCard.color,
            status: 'inquiry',
            isRecurring: true,
            recurrencePattern: pattern,
            dueDate: nextDueDate,
            tags: updatedCard.tags || '',
            files: updatedCard.files || '[]'
          }
        });
        console.log('>>> SUCCESS: New card created:', newCard.id);
      } catch (createError) {
        console.error('>>> ERROR creating card:', createError);
      }
    } else {
      console.log('>>> SKIPPED: Not completed or not recurring');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}