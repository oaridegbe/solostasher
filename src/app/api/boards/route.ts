import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/boards - Get all boards
export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(req: NextRequest) {
  try {
    const { title, userId } = await req.json();

    if (!title || !userId) {
      return NextResponse.json({ error: 'Title and userId are required' }, { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        title,
        userId
      }
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}