import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: { cardId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { text, author } = body;
    
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          cardId: params.id,
          text,
          author: author || 'User'
        }
      }),
      prisma.activityLog.create({
        data: {
          cardId: params.id,
          action: `Comment added by ${author || 'User'}`
        }
      })
    ]);
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}