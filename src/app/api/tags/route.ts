import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevents static generation error
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { cardId, tagIds } = await req.json();

    // Remove existing tags
    await prisma.cardTag.deleteMany({
      where: { cardId: cardId }
    });

    // Add new tags
    if (tagIds && tagIds.length > 0) {
      await prisma.cardTag.createMany({
        data: tagIds.map((tagId: string) => ({
          cardId: cardId,
          tagId: tagId
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}