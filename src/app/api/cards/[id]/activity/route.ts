import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await prisma.activityLog.findMany({
      where: { cardId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action } = body;
    
    const activity = await prisma.activityLog.create({
      data: {
        cardId: params.id,
        action
      }
    });
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}