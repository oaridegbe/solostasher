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

interface ReorderItem {
  id: string;
  position: number;
  columnId: string;
}

interface CardValue {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  color: string;
  cardId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Card {
  id: string;
  title: string;
  description?: string | null;
  boardId: string;
  columnId: string;
  position: number;
  priority: string;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ValueHistory {
  id: string;
  valueId: string;
  value: number;
  note?: string | null;
  timestamp: Date;
}

// Mock auth function since @clerk/nextjs is not installed
async function auth(): Promise<{ userId: string | null }> {
  // In production, replace with actual Clerk auth
  return { userId: 'mock-user-id' };
}

// Define Prisma client type
interface PrismaClient {
  $transaction: <T>(operations: ((tx: PrismaClient) => Promise<T>)[]) => Promise<T[]>;
  board: {
    findFirst: (args: { where: { id?: string; userId?: string } }) => Promise<{ id: string; userId: string } | null>;
  };
  card: {
    findMany: (args: any) => Promise<Card[]>;
    create: (args: { data: any }) => Promise<Card>;
    update: (args: { where: { id: string }; data: any }) => Promise<Card>;
    updateMany: (args: { where: any; data: any }) => Promise<{ count: number }>;
    delete: (args: { where: { id: string } }) => Promise<Card>;
    findUnique: (args: { where: { id: string } }) => Promise<Card | null>;
  };
  cardValue: {
    create: (args: { data: any }) => Promise<CardValue>;
    findMany: (args: any) => Promise<CardValue[]>;
    findFirst: (args: any) => Promise<CardValue | null>;
    findUnique: (args: any) => Promise<CardValue | null>;
    update: (args: any) => Promise<CardValue>;
    delete: (args: any) => Promise<CardValue>;
  };
  valueHistory: {
    create: (args: { data: any }) => Promise<ValueHistory>;
  };
  valueAlert: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
}

// Mock prisma client with proper type
const prisma: PrismaClient = {
  $transaction: async function<T>(operations: ((tx: PrismaClient) => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    for (const operation of operations) {
      results.push(await operation(this));
    }
    return results;
  },
  board: {
    findFirst: async (args): Promise<{ id: string; userId: string } | null> => {
      return { id: args.where?.id || 'board-1', userId: 'mock-user-id' };
    },
  },
  card: {
    findMany: async (args): Promise<Card[]> => {
      return [];
    },
    create: async (args): Promise<Card> => {
      return { 
        id: 'card-' + Date.now(), 
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    update: async (args): Promise<Card> => {
      return { 
        id: args.where?.id, 
        ...args.data,
        updatedAt: new Date(),
      } as Card;
    },
    updateMany: async (args): Promise<{ count: number }> => {
      return { count: 1 };
    },
    delete: async (args): Promise<Card> => {
      return { id: args.where?.id } as Card;
    },
    findUnique: async (args): Promise<Card | null> => {
      return null;
    },
  },
  cardValue: {
    create: async (args): Promise<CardValue> => {
      return {
        id: 'value-' + Date.now(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    findMany: async (args): Promise<CardValue[]> => {
      return [];
    },
    findFirst: async (args): Promise<CardValue | null> => {
      return null;
    },
    findUnique: async (args): Promise<CardValue | null> => {
      return null;
    },
    update: async (args): Promise<CardValue> => {
      return { id: args.where?.id, ...args.data } as CardValue;
    },
    delete: async (args): Promise<CardValue> => {
      return { id: args.where?.id } as CardValue;
    },
  },
  valueHistory: {
    create: async (args): Promise<ValueHistory> => {
      return {
        id: 'history-' + Date.now(),
        ...args.data,
        timestamp: new Date(),
      };
    },
  },
  valueAlert: {
    findMany: async (args): Promise<any[]> => {
      return [];
    },
    create: async (args): Promise<any> => {
      return {
        id: 'alert-' + Date.now(),
        ...args.data,
        createdAt: new Date(),
      };
    },
    update: async (args): Promise<any> => {
      return { id: args.where?.id, ...args.data };
    },
  },
};

// GET /api/cards - Get all cards with value tracking
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const includeValueHistory = searchParams.get('includeValueHistory') === 'true';

    // Mock data for demonstration
    const mockCards = [
      {
        id: 'card-1',
        title: 'Sample Card',
        description: 'This is a sample card',
        boardId: boardId || 'board-1',
        columnId: 'col-1',
        position: 0,
        priority: 'medium',
        targetDate: null,
        values: [
          {
            id: 'value-1',
            name: 'Monthly Revenue',
            category: 'financial',
            currentValue: 48294,
            targetValue: 50000,
            unit: '$',
            color: '#3b82f6',
            history: includeValueHistory ? [
              { id: 'h1', value: 45000, note: 'Week 1', timestamp: new Date().toISOString() },
              { id: 'h2', value: 48294, note: 'Current', timestamp: new Date().toISOString() },
            ] : [],
          }
        ],
        labels: [],
        assignees: [],
        _count: { comments: 0, attachments: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json(mockCards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/cards - Create a new card with value tracking
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Verify board ownership
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        userId,
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Create card with values in a transaction
    interface TransactionResult {
      card: Card;
      values: CardValue[];
    }

    const transactionOperations: ((tx: PrismaClient) => Promise<TransactionResult>)[] = [
      async (tx: PrismaClient): Promise<TransactionResult> => {
        // Create the card
        const newCard: Card = await tx.card.create({
          data: {
            title,
            description,
            boardId,
            columnId,
            position,
            targetDate: targetDate ? new Date(targetDate) : null,
            priority,
          },
        });

        const createdValues: CardValue[] = [];

        // Create associated values if provided
        if (values && Array.isArray(values) && values.length > 0) {
          for (const value of values as CardValueInput[]) {
            const createdValue: CardValue = await tx.cardValue.create({
              data: {
                cardId: newCard.id,
                name: value.name,
                category: value.category || 'custom',
                currentValue: value.currentValue || 0,
                targetValue: value.targetValue || 0,
                unit: value.unit || '',
                color: value.color || '#3b82f6',
              },
            });

            createdValues.push(createdValue);

            // Create initial history entry
            await tx.valueHistory.create({
              data: {
                valueId: createdValue.id,
                value: value.currentValue || 0,
                note: 'Initial value',
              },
            });
          }
        }

        return { card: newCard, values: createdValues };
      }
    ];

    const results = await prisma.$transaction<TransactionResult>(transactionOperations);
    const result = results[0];

    // Fetch the complete card with values
    const completeCard = {
      ...result.card,
      values: result.values.map((v: CardValue) => ({
        ...v,
        history: [],
      })),
      labels: [],
      assignees: [],
    };

    return NextResponse.json(completeCard, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

// PATCH /api/cards - Bulk update cards (for reordering)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items: ReorderItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      );
    }

    // Create transaction operations for each item
    const transactionOperations: ((tx: PrismaClient) => Promise<{ count: number }>)[] = items.map((item: ReorderItem) => {
      return async (tx: PrismaClient): Promise<{ count: number }> => {
        return tx.card.updateMany({
          where: {
            id: item.id,
            board: {
              userId,
            },
          },
          data: {
            position: item.position,
            columnId: item.columnId,
          },
        });
      };
    });

    await prisma.$transaction<{ count: number }>(transactionOperations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cards:', error);
    return NextResponse.json(
      { error: 'Failed to update cards' },
      { status: 500 }
    );
  }
}