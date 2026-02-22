import { NextRequest, NextResponse } from 'next/server';

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

async function auth(): Promise<{ userId: string | null }> {
  return { userId: 'mock-user-id' };
}

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        content: 'Great progress on the revenue target! We\'re at 96% of goal.',
        cardId: id,
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
        cardId: id,
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
        cardId: id,
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
      cardId: id,
      authorId: userId,
      authorName: 'John Doe',
      authorAvatar: 'JD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mentions,
      attachments
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.pathname.split('/').pop();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}