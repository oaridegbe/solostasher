'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InvoiceGenerator } from './InvoiceGenerator';

interface CardModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CardModal({ cardId, isOpen, onClose }: CardModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'quotes' | 'invoices' | 'values'>('details');

  const { data: card } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}`);
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/quotes`);
      return res.json();
    },
    enabled: isOpen && activeTab === 'quotes',
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/invoices`);
      return res.json();
    },
    enabled: isOpen && activeTab === 'invoices',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{card?.title || 'Card Details'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['details', 'quotes', 'invoices', 'values'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 capitalize ${
                activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div>
              <p>Status: {card?.status}</p>
              <p>Client: {card?.clientEmail}</p>
              <p>Value: {card?.currency} {card?.value}</p>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Quotes</h3>
              {quotes?.length === 0 ? (
                <p>No quotes yet</p>
              ) : (
                quotes?.map((quote: any) => (
                  <div key={quote.id} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">{quote.currency} {quote.amount}</p>
                    <p className="text-sm text-gray-600">{quote.description}</p>
                    <p className="text-xs text-gray-500">Status: {quote.status}</p>
                  </div>
                ))
              )}
              {/* Add Quote Form Here */}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <InvoiceGenerator 
                cardId={cardId}
                cardValue={card?.value}
                clientEmail={card?.clientEmail}
              />
              
              <h3 className="font-semibold mt-6">Existing Invoices</h3>
              {invoices?.length === 0 ? (
                <p>No invoices yet</p>
              ) : (
                invoices?.map((invoice: any) => (
                  <div key={invoice.id} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <p className="font-medium">{invoice.currency} {invoice.amount}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                    {invoice.hostedUrl && (
                      <a href={invoice.hostedUrl} target="_blank" className="text-sm text-blue-500">
                        View Invoice →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'values' && (
            <div>
              <p>Value tracking coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}