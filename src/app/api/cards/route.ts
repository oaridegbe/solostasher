import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/cards?boardId=xxx - Get cards for a board
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    const cards = await prisma.card.findMany({
      where: { boardId },
      include: {
        cardTags: {
          include: {
            tag: true
          }
        },
        values: true,
        _count: {
          select: { comments: true, files: true }
        }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST /api/cards - Create a new card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      boardId, 
      columnId, 
      position,
      priority = 'medium',
      dueDate,
      color = '#3b82f6',
      clientEmail
    } = body;

    if (!title || !boardId || !columnId) {
      return NextResponse.json({ 
        error: 'Title, boardId, and columnId are required' 
      }, { status: 400 });
    }

    const card = await prisma.card.create({
      data: {
        title,
        description,
        boardId,
        columnId,
        position,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        color,
        clientEmail
      },
      include: {
        cardTags: {
          include: {
            tag: true
          }
        },
        values: true
      }
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

// PATCH /api/cards - Bulk update card positions (for drag & drop)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { 
      items: Array<{ id: string; position: number; columnId: string }> 
    };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }

    // Update all cards in a transaction
    await prisma.$transaction(
      items.map(item => 
        prisma.card.update({
          where: { id: item.id },
          data: { 
            position: item.position,
            columnId: item.columnId
          }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cards:', error);
    return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 });
  }
}