import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/boards/[id] - Get board with cards
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: params.id },
      include: {
        cards: {
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
        },
        tags: true
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

// PATCH /api/boards/[id] - Update board
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await request.json();

    const board = await prisma.board.update({
      where: { id: params.id },
      data: { title }
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

// DELETE /api/boards/[id] - Delete board
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.board.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}