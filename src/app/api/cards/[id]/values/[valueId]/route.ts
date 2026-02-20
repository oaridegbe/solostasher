import { NextRequest, NextResponse } from 'next/server';

// Type definitions
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

// Mock auth function
async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/values/[valueId]/history - Get value history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Mock history data
    const mockHistory: ValueHistory[] = Array.from({ length: limit }, (_, i) => ({
      id: `hist-${i}`,
      valueId: params.valueId,
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

// PATCH /api/cards/[id]/values/[valueId] - Update value and add history
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newValue, note, targetValue, name, unit, color } = body;

    // Mock current value
    const currentValue: CardValue = {
      id: params.valueId,
      cardId: params.id,
      name: name || 'Monthly Revenue',
      category: 'financial',
      currentValue: newValue || 48294,
      targetValue: targetValue || 50000,
      unit: unit || '$',
      color: color || '#3b82f6',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If value changed, create history entry
    let historyEntry: ValueHistory | undefined;
    if (newValue !== undefined) {
      historyEntry = {
        id: 'hist-' + Date.now(),
        valueId: params.valueId,
        value: newValue,
        note: note || 'Updated',
        timestamp: new Date().toISOString()
      };

      // Check alerts
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

// DELETE /api/cards/[id]/values/[valueId] - Delete a value
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; valueId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify ownership and delete
    // await prisma.cardValue.delete({ where: { id: params.valueId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting value:', error);
    return NextResponse.json(
      { error: 'Failed to delete value' },
      { status: 500 }
    );
  }
}