import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json([{
      id: 'default',
      title: 'My Deals',
      cards: cards,
      _count: { cards: cards.length }
    }]);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Use type assertion to bypass strict checking
    const createData: any = {
      title: title,
      status: 'inquiry',
      color: '#3b82f6',
      tags: '',
      files: '[]',
      isRecurring: false
    };

    const card = await prisma.card.create({ data: createData });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}