import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/boards/[id] - Return all cards (virtual board)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Return virtual board with cards
    return NextResponse.json({
      id: id,
      title: 'My Deals',
      cards: cards.map((card: any) => ({
        id: card.id,
        title: card.title,
        description: null,
        position: 0,
        priority: 'medium',
        dueDate: card.due_date,
        color: card.color,
        clientEmail: card.client_email,
        columnId: card.status,
        cardTags: [],
        values: [],
        _count: {
          comments: 0,
          files: 0
        }
      })),
      tags: []
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

// PATCH /api/boards/[id] - Update board (no-op for virtual board)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ id: id, title: 'My Deals' });
}

// DELETE /api/boards/[id] - Delete all cards (virtual board delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.card.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cards:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}