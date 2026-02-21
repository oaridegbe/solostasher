import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // CSV Header
    const headers = ['Title', 'Client Email', 'Status', 'Due Date', 'Tags', 'Priority', 'Created At', 'Color'];
    
    // CSV Rows
    const rows = cards.map((card: any) => [
      `"${card.title.replace(/"/g, '""')}"`,
      `"${card.clientEmail || ''}"`,
      card.status,
      card.dueDate || '',
      `"${card.tags || ''}"`,
      'medium',
      new Date(card.createdAt).toLocaleDateString(),
      card.color || '#3b82f6'
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="solostasher-deals-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}