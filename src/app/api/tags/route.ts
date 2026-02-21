import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, tagIds } = await req.json();

    const tagNames = tagIds?.join(', ') || '';
    
    await prisma.card.update({
      where: { id: cardId },
      data: { tags: tagNames } as any
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}