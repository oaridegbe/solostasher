import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // CSV Header
    const headers = ['Title', 'Client Email', 'Status', 'Due Date', 'Tags', 'Recurring', 'Pattern', 'Created At', 'Color'];
    
    // CSV Rows
    const rows = cards.map(card => [
      `"${card.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${card.client_email || ''}"`,
      card.status,
      card.dueDate || '',
      `"${card.tags || ''}"`,
      card.isRecurring ? 'Yes' : 'No',
      card.recurrencePattern || '',
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