import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { value, currency } = await request.json();

    const card = await prisma.card.update({
      where: { id: params.id },
      data: { 
        value: value ? parseFloat(value) : 0,
        currency: currency || 'USD'
      }
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating value:', error);
    return NextResponse.json({ error: 'Failed to update value' }, { status: 500 });
  }
}