'use client';

import { useQuery } from '@tanstack/react-query';

interface InvoiceListProps {
  cardId: string;
}

export function InvoiceList({ cardId }: InvoiceListProps) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}/invoices`);
      return res.json();
    },
  });

  if (isLoading) return <div>Loading invoices...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'void': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Invoices</h3>
      
      {invoices?.length === 0 ? (
        <p className="text-gray-500">No invoices yet</p>
      ) : (
        <div className="space-y-2">
          {invoices?.map((invoice: any) => (
            <div key={invoice.id} className="p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {invoice.currency} {invoice.amount}
                  </p>
                  <p className="text-sm text-gray-600">{invoice.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              
              {invoice.hostedUrl && (
                <a
                  href={invoice.hostedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  View Invoice →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}