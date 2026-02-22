export interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  dueDate?: Date;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  notes?: string;
  fromName?: string;
  fromEmail?: string;
  invoiceNumber?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const items = data.lineItems || [{
    description: data.description || 'Service',
    quantity: 1,
    unitPrice: data.amount,
    amount: data.amount
  }];

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.invoiceNumber || data.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-title { font-size: 32px; color: #3b82f6; margin: 0; }
    .invoice-meta { margin-top: 10px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 10px; }
    .from-to { display: flex; justify-content: space-between; }
    .from, .to { width: 45%; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #3b82f6; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f3f4f6; }
    .notes { margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 5px; }
    .payment-info { margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 5px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="invoice-title">INVOICE</h1>
    <div class="invoice-meta">
      <strong>Invoice #:</strong> ${data.invoiceNumber || data.id}<br>
      <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
      ${data.dueDate ? `<strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}<br>` : ''}
    </div>
  </div>

  <div class="section from-to">
    <div class="from">
      <div class="section-title">From</div>
      <strong>${data.fromName || 'Your Company'}</strong><br>
      ${data.fromEmail || ''}
    </div>
    <div class="to">
      <div class="section-title">Bill To</div>
      <strong>${data.customerName || 'Customer'}</strong><br>
      ${data.customerEmail || ''}
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice, data.currency)}</td>
            <td class="text-right">${formatCurrency(item.amount, data.currency)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" class="text-right">Total:</td>
          <td class="text-right">${formatCurrency(total, data.currency)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${data.notes ? `
    <div class="section notes">
      <div class="section-title">Notes</div>
      ${data.notes}
    </div>
  ` : ''}

  <div class="section payment-info">
    <div class="section-title">Payment Options</div>
    <p><strong>Bank Transfer:</strong> Contact us for bank details</p>
    <p><strong>Check:</strong> Mail to our office address</p>
    <p><strong>Online Payment:</strong> <em>Coming soon - Stripe integration</em></p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
  `;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function htmlToBuffer(html: string): Buffer {
  return Buffer.from(html, 'utf-8');
}