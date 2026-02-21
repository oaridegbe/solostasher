import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      include: {
        cardTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // CSV Header
    const headers = ['Title', 'Client Email', 'Status', 'Due Date', 'Tags', 'Priority', 'Created At', 'Color'];
    
    // CSV Rows
    const rows = cards.map(card => [
      `"${card.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${card.clientEmail || ''}"`,
      card.status,
      card.dueDate || '',
      `"${card.cardTags?.map(ct => ct.tag.name).join(', ') || ''}"`,
      card.priority,
      new Date(card.createdAt).toLocaleDateString(),
      card.color || '#3b82f6'
    ]);

    // Combine into CSV string
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Return as downloadable file
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