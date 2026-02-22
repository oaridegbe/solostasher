import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // CSV Header
    const headers = ['Title', 'Client Email', 'Status', 'Due Date', 'Tags', 'Created At'];
    
    // CSV Rows
    const rows = cards.map((card: any) => [
      `"${card.title.replace(/"/g, '""')}"`,
      `"${card.client_email || ''}"`,
      card.status,
      card.due_date || '',
      `"${card.tags || ''}"`,
      new Date(card.createdAt).toLocaleDateString()
    ]);

    const csv = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="solostasher-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}