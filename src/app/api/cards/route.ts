import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface CardValueInput {
  name: string;
  category?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  color?: string;
}

interface CardValue {
  id: string;
  cardId: string;
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Card {
  id: string;
  title: string;
  description?: string | null;
  boardId: string;
  columnId: string;
  position: number;
  priority: string;
  targetDate: string | null;
  values: CardValue[];
  createdAt: string;
  updatedAt: string;
}

interface ReorderItem {
  id: string;
  position: number;
  columnId: string;
}

interface ValueHistory {
  id: string;
  valueId: string;
  value: number;
  note?: string;
  timestamp: string;
}

// Mock data store with proper types
const mockCards: Card[] = [];
const mockValues: CardValue[] = [];
const mockHistory: ValueHistory[] = [];

async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    const cards = mockCards.filter(c => c.boardId === (boardId || c.boardId));
    return NextResponse.json(cards);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST /api/cards
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { 
      title, 
      description, 
      boardId, 
      columnId, 
      position,
      values,
      targetDate,
      priority = 'medium',
    } = body;

    const newCard: Card = {
      id: 'card-' + Date.now(),
      title,
      description,
      boardId,
      columnId,
      position,
      priority,
      targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      values: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create values if provided
    if (values && Array.isArray(values)) {
      for (const val of values as CardValueInput[]) {
        const newValue: CardValue = {
          id: 'value-' + Date.now() + Math.random().toString(36).substr(2, 9),
          cardId: newCard.id,
          name: val.name,
          category: val.category || 'custom',
          currentValue: val.currentValue || 0,
          targetValue: val.targetValue || 0,
          unit: val.unit || '',
          color: val.color || '#3b82f6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockValues.push(newValue);
        newCard.values.push(newValue);

        // Add history entry
        const historyEntry: ValueHistory = {
          id: 'hist-' + Date.now() + Math.random().toString(36).substr(2, 9),
          valueId: newValue.id,
          value: val.currentValue || 0,
          note: 'Initial value',
          timestamp: new Date().toISOString(),
        };
        mockHistory.push(historyEntry);
      }
    }

    mockCards.push(newCard);
    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

// PATCH /api/cards
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { items } = body as { items: ReorderItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    for (const item of items) {
      const card = mockCards.find(c => c.id === item.id);
      if (card) {
        card.position = item.position;
        card.columnId = item.columnId;
        card.updatedAt = new Date().toISOString();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 });
  }
}