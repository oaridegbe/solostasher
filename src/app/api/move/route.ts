import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, newStatus } = await req.json();
    
    console.log('Moving card:', cardId, 'to status:', newStatus); // DEBUG
    
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus }
    });

    console.log('Card updated:', updatedCard.id, 'isRecurring:', updatedCard.isRecurring); // DEBUG

    if (newStatus === 'completed' && updatedCard.isRecurring) {
      console.log('Creating recurring card...'); // DEBUG
      
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
      }

      const newCard = await prisma.card.create({
        data: {
          title: updatedCard.title,
          clientEmail: updatedCard.clientEmail,
          color: updatedCard.color,
          status: 'inquiry',
          isRecurring: true,
          recurrencePattern: pattern,
          dueDate: nextDueDate,
          tags: '',
          files: '[]'
        }
      });

      console.log('New recurring card created:', newCard.id); // DEBUG
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}