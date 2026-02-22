import { NextRequest, NextResponse } from 'next/server';

interface ValueHistory {
  id: string;
  valueId: string;
  value: number;
  note?: string;
  timestamp: string;
}

interface CardValue {
  id: string;
  cardId: string;
  name: string;
  category: 'financial' | 'performance' | 'custom';
  currentValue: number;
  targetValue: number;
  unit: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/values/[valueId]/history
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const mockHistory: ValueHistory[] = Array.from({ length: limit }, (_, i) => ({
      id: `hist-${i}`,
      valueId: valueId,
      value: 40000 + Math.random() * 10000,
      note: i % 5 === 0 ? 'Weekly update' : undefined,
      timestamp: new Date(Date.now() - (limit - i) * 24 * 60 * 60 * 1000).toISOString()
    }));

    return NextResponse.json(mockHistory);
  } catch (error) {
    console.error('Error fetching value history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/[id]/values/[valueId]
export async function PATCH(
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
    const { newValue, note, targetValue, name, unit, color } = body;

    const currentValue: CardValue = {
      id: valueId,
      cardId: id,
      name: name || 'Monthly Revenue',
      category: 'financial',
      currentValue: newValue || 48294,
      targetValue: targetValue || 50000,
      unit: unit || '$',
      color: color || '#3b82f6',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    let historyEntry: ValueHistory | undefined;
    if (newValue !== undefined) {
      historyEntry = {
        id: 'hist-' + Date.now(),
        valueId: valueId,
        value: newValue,
        note: note || 'Updated',
        timestamp: new Date().toISOString()
      };

      if (currentValue.targetValue && newValue >= currentValue.targetValue) {
        console.log('Target reached!');
      }
    }

    return NextResponse.json({
      value: currentValue,
      historyEntry
    });
  } catch (error) {
    console.error('Error updating value:', error);
    return NextResponse.json(
      { error: 'Failed to update value' },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[id]/values/[valueId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
): Promise<NextResponse> {
  try {
    const { id, valueId } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting value:', error);
    return NextResponse.json(
      { error: 'Failed to delete value' },
      { status: 500 }
    );
  }
}