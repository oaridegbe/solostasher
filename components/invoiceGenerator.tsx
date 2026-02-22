'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface InvoiceGeneratorProps {
  cardId: string;
  cardValue?: number;
  clientEmail?: string;
  clientName?: string;
}

export function InvoiceGenerator({ cardId, cardValue, clientEmail, clientName }: InvoiceGeneratorProps) {
  const [amount, setAmount] = useState(cardValue?.toString() || '');
  const [description, setDescription] = useState('');
  const [customerEmail, setCustomerEmail] = useState(clientEmail || '');
  const [customerName, setCustomerName] = useState(clientName || '');
  const [dueDays, setDueDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/cards/${cardId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', cardId] });
      setAmount('');
      setDescription('');
      setNotes('');
      setShowForm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent, sendNow: boolean) => {
    e.preventDefault();
    createInvoice.mutate({
      amount: parseFloat(amount),
      description,
      customerEmail,
      customerName,
      dueDays,
      notes,
      sendNow,
    });
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Create New Invoice
      </button>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold">Create Invoice</h3>
      
      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Email</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Due Days</label>
          <input
            type="number"
            value={dueDays}
            onChange={(e) => setDueDays(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
            min={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Payment instructions, bank details, etc."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={createInvoice.isPending}
            className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {createInvoice.isPending ? 'Creating...' : 'Save as Draft'}
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={createInvoice.isPending}
            className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {createInvoice.isPending ? 'Sending...' : 'Send Invoice'}
          </button>
        </div>
        
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="w-full p-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}