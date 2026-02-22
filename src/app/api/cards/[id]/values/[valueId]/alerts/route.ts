import { NextRequest, NextResponse } from 'next/server';

interface ValueAlert {
  id: string;
  valueId: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  message: string;
  active: boolean;
  createdAt: string;
}

async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/values/[valueId]/alerts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
): Promise<NextResponse> {
  try {
    const { id, valueId } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockAlerts: ValueAlert[] = [
      {
        id: 'alert-1',
        valueId: valueId,
        condition: 'above',
        threshold: 45000,
        message: 'Revenue exceeded target!',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json(mockAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/cards/[id]/values/[valueId]/alerts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
): Promise<NextResponse> {
  try {
    const { id, valueId } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { condition, threshold, message } = body;

    if (!condition || threshold === undefined || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAlert: ValueAlert = {
      id: 'alert-' + Date.now(),
      valueId: valueId,
      condition,
      threshold,
      message,
      active: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}