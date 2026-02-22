import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface ActivityItem {
  id: string;
  type: 'value_created' | 'value_updated' | 'value_deleted' | 'alert_triggered' | 'comment_added' | 'moved' | 'updated';
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  userId?: string;
}

// Mock auth function
async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/activity - Get activity feed including value tracking changes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock activity data including value tracking
    const mockActivities: ActivityItem[] = [
      {
        id: 'act-1',
        type: 'value_updated',
        description: 'Monthly Revenue changed from $45,000 to $48,294',
        metadata: {
          valueName: 'Monthly Revenue',
          oldValue: 45000,
          newValue: 48294,
          unit: '$',
          change: '+7.3%'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        userId: 'user-1'
      },
      {
        id: 'act-2',
        type: 'value_created',
        description: 'Added new value tracker: Conversion Rate',
        metadata: {
          valueName: 'Conversion Rate',
          initialValue: 3.2,
          targetValue: 5.0,
          unit: '%'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        userId: 'user-1'
      },
      {
        id: 'act-3',
        type: 'alert_triggered',
        description: 'Alert: Monthly Revenue exceeded $45,000 threshold',
        metadata: {
          alertType: 'above',
          threshold: 45000,
          actualValue: 48294,
          valueName: 'Monthly Revenue'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        userId: 'system'
      },
      {
        id: 'act-4',
        type: 'comment_added',
        description: 'Added comment about revenue growth',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        userId: 'user-2'
      },
      {
        id: 'act-5',
        type: 'moved',
        description: 'Card moved from "To Do" to "In Progress"',
        metadata: {
          fromColumn: 'To Do',
          toColumn: 'In Progress'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        userId: 'user-1'
      }
    ];

    const typeFilter = searchParams.get('type');
    let filteredActivities = mockActivities;
    if (typeFilter) {
      filteredActivities = mockActivities.filter(a => a.type === typeFilter);
    }

    const valuesOnly = searchParams.get('valuesOnly') === 'true';
    if (valuesOnly) {
      filteredActivities = mockActivities.filter(a => 
        ['value_created', 'value_updated', 'value_deleted', 'alert_triggered'].includes(a.type)
      );
    }

    const paginatedActivities = filteredActivities.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginatedActivities,
      pagination: {
        total: filteredActivities.length,
        limit,
        offset,
        hasMore: offset + limit < filteredActivities.length
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

// POST /api/cards/[id]/activity - Log new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, description, metadata } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type and description' },
        { status: 400 }
      );
    }

    const newActivity: ActivityItem = {
      id: 'act-' + Date.now(),
      type,
      description,
      metadata,
      createdAt: new Date().toISOString(),
      userId
    };

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}