import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, email, color, tags, due_date, files, status, is_recurring } = body;
    
    const card = await prisma.card.create({
      data: {
        title,
        clientEmail: email,
        color: color || '#3b82f6',
        tags: tags || '',
        dueDate: due_date ? new Date(due_date) : null,
        files: files || '[]',
        status: status || 'inquiry',
        isRecurring: is_recurring || false,
      }
    });
    
    await prisma.activityLog.create({
      data: {
        cardId: card.id,
        action: 'Card created'
      }
    });
    
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}