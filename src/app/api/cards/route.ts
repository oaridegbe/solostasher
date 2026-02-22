import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      email, 
      color, 
      tags, 
      due_date, 
      files,
      status,
      value,
      currency
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const createData: any = {
      title,
      clientEmail: email || null,
      color: color || '#3b82f6',
      tags: tags || '',
      dueDate: due_date || null,
      files: files || '[]',
      status: status || 'inquiry',
      value: value ? parseFloat(value) : 0,
      currency: currency || 'USD',
      isRecurring: false
    };

    const card = await prisma.card.create({ data: createData });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { 
      items: Array<{ id: string; position: number; columnId: string }> 
    };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }

    for (const item of items) {
      await prisma.card.update({
        where: { id: item.id },
        data: { status: item.columnId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cards:', error);
    return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 });
  }
}