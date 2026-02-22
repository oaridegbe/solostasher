import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateInvoiceHTML, htmlToBuffer } from '@/lib/invoice-generator';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

// GET /api/cards/[id]/invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { cardId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/cards/[id]/invoices - Create and optionally send
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      amount, 
      currency = 'USD', 
      description, 
      customerEmail, 
      customerName,
      lineItems,
      quoteId,
      sendNow = false,
      dueDays = 30,
      notes
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 });
    }

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        cardId: id,
        quoteId,
        amount,
        currency,
        description,
        customerEmail,
        customerName,
        notes,
        lineItems: JSON.stringify(lineItems || []),
        dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
        status: sendNow ? 'sent' : 'draft',
        sentAt: sendNow ? new Date() : null,
      },
    });

    // Generate HTML invoice
    const html = generateInvoiceHTML({
      id: invoice.id,
      amount,
      currency,
      description,
      customerEmail,
      customerName,
      dueDate: invoice.dueDate || undefined,
      lineItems: lineItems || [{ description: description || 'Service', quantity: 1, unitPrice: amount, amount }],
      notes,
      fromName: user.name || 'Your Company',
      fromEmail: user.email || '',
    });

    // Convert to base64 for email
    const htmlBuffer = htmlToBuffer(html);
    const htmlBase64 = htmlBuffer.toString('base64');

    // Send email if requested
    if (sendNow) {
      await resend.emails.send({
        from: 'invoices@yourapp.com',
        to: customerEmail,
        subject: `Invoice from ${user.name || 'Your Company'}`,
        html: `
          <h1>New Invoice</h1>
          <p>Amount: ${currency} ${amount}</p>
          <p>Description: ${description || 'N/A'}</p>
          <p>Due Date: ${invoice.dueDate?.toLocaleDateString()}</p>
          <p>Please find the invoice attached.</p>
        `,
        attachments: [
          {
            filename: `invoice-${invoice.id}.html`,
            content: htmlBase64,
          },
        ],
      });
    }

    return NextResponse.json({ 
      ...invoice, 
      html: sendNow ? undefined : html // Only return HTML if not emailed
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}