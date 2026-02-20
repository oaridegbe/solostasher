import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface Comment {
  id: string;
  content: string;
  cardId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  mentions: string[];
  attachments: string[];
}

// Mock auth function
async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

// GET /api/cards/[id]/comments - Get all comments for a card
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock comments data
    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        content: 'Great progress on the revenue target! We\'re at 96% of goal.',
        cardId: params.id,
        authorId: 'user-1',
        authorName: 'John Doe',
        authorAvatar: 'JD',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        mentions: [],
        attachments: []
      },
      {
        id: 'comment-2',
        content: 'The conversion rate is still below target. @sarah can you look into this?',
        cardId: params.id,
        authorId: 'user-2',
        authorName: 'Jane Smith',
        authorAvatar: 'JS',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        mentions: ['sarah'],
        attachments: []
      },
      {
        id: 'comment-3',
        content: 'Updated the Monthly Revenue value to reflect Q3 numbers. Current: $48,294',
        cardId: params.id,
        authorId: 'user-1',
        authorName: 'John Doe',
        authorAvatar: 'JD',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        mentions: [],
        attachments: ['attachment-1']
      }
    ];

    const paginatedComments = mockComments.slice(offset, offset + limit);

    return NextResponse.json({
      comments: paginatedComments,
      pagination: {
        total: mockComments.length,
        limit,
        offset,
        hasMore: offset + limit < mockComments.length
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/cards/[id]/comments - Add a new comment
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
    const { content, mentions = [], attachments = [] } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const newComment: Comment = {
      id: 'comment-' + Date.now(),
      content: content.trim(),
      cardId: params.id,
      authorId: userId,
      authorName: 'John Doe', // In production, fetch from user profile
      authorAvatar: 'JD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mentions,
      attachments
    };

    // In production, save to database and trigger notifications for mentions
    // await prisma.comment.create({ data: newComment });

    // If comment mentions value changes, parse and log activity
    const valueChangePattern = /(increased|decreased|changed|updated).+?(to|by)\s*[\d$%,.]+/i;
    if (valueChangePattern.test(content)) {
      // Log value-related activity
      console.log('Value change mentioned in comment:', content);
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/[id]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.pathname.split('/').pop();
    
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // In production, verify comment ownership and update
    const updatedComment: Partial<Comment> = {
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.pathname.split('/').pop();

    // In production, verify ownership and delete
    // await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}