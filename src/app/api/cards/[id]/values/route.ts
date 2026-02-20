import { NextRequest, NextResponse } from 'next/server';

// Type definitions
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
  history?: ValueHistory[];
  alerts?: ValueAlert[];
}

interface ValueHistory {
  id: string;
  valueId: string;
  value: number;
  note?: string;
  timestamp: string;
}

interface ValueAlert {
  id: string;
  valueId: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  message: string;
  active: boolean;
  lastTriggered?: string;
}

// Mock auth function
async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/values - Get all tracked values for a card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(searchParams.get('historyLimit') || '30');

    // Mock values data
    const mockValues: CardValue[] = [
      {
        id: 'value-1',
        cardId: params.id,
        name: 'Monthly Revenue',
        category: 'financial',
        currentValue: 48294,
        targetValue: 50000,
        unit: '$',
        color: '#3b82f6',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        history: includeHistory ? Array.from({ length: historyLimit }, (_, i) => ({
          id: `hist-${i}`,
          valueId: 'value-1',
          value: 40000 + Math.random() * 10000,
          note: i === 0 ? 'Initial value' : undefined,
          timestamp: new Date(Date.now() - (historyLimit - i) * 24 * 60 * 60 * 1000).toISOString()
        })) : undefined,
        alerts: [
          {
            id: 'alert-1',
            valueId: 'value-1',
            condition: 'above',
            threshold: 45000,
            message: 'Revenue exceeded $45,000!',
            active: true,
            lastTriggered: new Date().toISOString()
          }
        ]
      },
      {
        id: 'value-2',
        cardId: params.id,
        name: 'Active Users',
        category: 'performance',
        currentValue: 2543,
        targetValue: 3000,
        unit: '',
        color: '#10b981',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        history: includeHistory ? Array.from({ length: 10 }, (_, i) => ({
          id: `hist-users-${i}`,
          valueId: 'value-2',
          value: 2000 + Math.floor(Math.random() * 600),
          timestamp: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString()
        })) : undefined
      }
    ];

    return NextResponse.json(mockValues);
  } catch (error) {
    console.error('Error fetching values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch values' },
      { status: 500 }
    );
  }
}

// POST /api/cards/[id]/values - Create a new value tracker
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category = 'custom',
      currentValue = 0,
      targetValue = 0,
      unit = '',
      color = '#3b82f6'
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Value name is required' },
        { status: 400 }
      );
    }

    const newValue: CardValue = {
      id: 'value-' + Date.now(),
      cardId: params.id,
      name,
      category,
      currentValue,
      targetValue,
      unit,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{
        id: 'hist-initial',
        valueId: 'value-' + Date.now(),
        value: currentValue,
        note: 'Initial value',
        timestamp: new Date().toISOString()
      }]
    };

    // In production, save to database
    // await prisma.cardValue.create({ data: newValue });

    return NextResponse.json(newValue, { status: 201 });
  } catch (error) {
    console.error('Error creating value:', error);
    return NextResponse.json(
      { error: 'Failed to create value' },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/[id]/values - Bulk update values
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { values } = body as { values: Array<{ id: string; targetValue?: number; color?: string }> };

    if (!Array.isArray(values)) {
      return NextResponse.json(
        { error: 'Values must be an array' },
        { status: 400 }
      );
    }

    const updatedValues = values.map(v => ({
      ...v,
      updatedAt: new Date().toISOString()
    }));

    return NextResponse.json(updatedValues);
  } catch (error) {
    console.error('Error updating values:', error);
    return NextResponse.json(
      { error: 'Failed to update values' },
      { status: 500 }
    );
  }
}