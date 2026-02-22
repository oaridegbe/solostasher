'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CardModal } from '@/components/CardModal';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface CardValue {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  color: string;
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: string;
  dueDate: string | null;
  color: string | null;
  clientEmail: string | null;
  columnId: string;
  cardTags: Array<{
    tag: Tag;
  }>;
  values: CardValue[];
  _count: {
    comments: number;
    files: number;
  };
}

interface Board {
  id: string;
  title: string;
  cards: Card[];
  tags: Tag[];
}

const COLUMNS = [
  { id: 'inquiry', title: 'Inquiry', color: 'bg-gray-100' },
  { id: 'follow-up', title: 'Follow Up', color: 'bg-blue-50' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-yellow-50' },
  { id: 'won', title: 'Won', color: 'bg-green-50' },
  { id: 'lost', title: 'Lost', color: 'bg-red-50' }
];

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('inquiry');
  const [isCreating, setIsCreating] = useState(false);
  
  // Add modal state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !board) return;

    setIsCreating(true);
    try {
      const columnCards = board.cards.filter(c => c.columnId === selectedColumn);
      const maxPosition = columnCards.length > 0 
        ? Math.max(...columnCards.map(c => c.position)) 
        : -1;

      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCardTitle,
          boardId: board.id,
          columnId: selectedColumn,
          position: maxPosition + 1
        })
      });

      if (res.ok) {
        setNewCardTitle('');
        fetchBoard();
      }
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const moveCard = async (cardId: string, newColumnId: string) => {
    // Don't move if clicking the card to open modal
    if (!board) return;

    const columnCards = board.cards.filter(c => c.columnId === newColumnId);
    const maxPosition = columnCards.length > 0 
      ? Math.max(...columnCards.map(c => c.position)) 
      : -1;

    try {
      const res = await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: cardId,
            columnId: newColumnId,
            position: maxPosition + 1
          }]
        })
      });

      if (res.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  // Add function to open modal
  const openCardModal = (cardId: string) => {
    setSelectedCardId(cardId);
    setIsModalOpen(true);
  };

  const closeCardModal = () => {
    setIsModalOpen(false);
    setSelectedCardId(null);
    fetchBoard(); // Refresh board data when modal closes
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Board not found</h1>
          <Link href="/boards" className="text-blue-600 hover:underline">
            ← Back to boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/boards" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
          </div>
          
          {/* Create Card Form */}
          <form onSubmit={createCard} className="flex items-center space-x-3">
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {COLUMNS.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="New card title..."
              className="px-4 py-2 border border-gray-300 rounded-lg w-64"
            />
            <button
              type="submit"
              disabled={isCreating || !newCardTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Card
            </button>
          </form>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="p-8 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {COLUMNS.map((column) => {
            const columnCards = board.cards
              .filter(card => card.columnId === column.id)
              .sort((a, b) => a.position - b.position);

            return (
              <div key={column.id} className="w-80 flex-shrink-0">
                <div className={`${column.color} rounded-t-xl px-4 py-3 border-b-2 border-gray-200`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                      {columnCards.length}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-b-xl p-3 min-h-[500px] space-y-3">
                  {columnCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => openCardModal(card.id)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{card.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(card.priority)}`}>
                          {card.priority}
                        </span>
                      </div>

                      {card.clientEmail && (
                        <p className="text-sm text-gray-500 mb-2">{card.clientEmail}</p>
                      )}

                      {card.cardTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {card.cardTags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-1 rounded-full text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {card.values.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {card.values.map((value) => (
                            <div key={value.id} className="text-xs">
                              <div className="flex justify-between text-gray-600 mb-1">
                                <span>{value.name}</span>
                                <span>{value.unit}{value.currentValue.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min((value.currentValue / value.targetValue) * 100, 100)}%`,
                                    backgroundColor: value.color
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-3">
                          {card._count.comments > 0 && (
                            <span className="flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              <span>{card._count.comments}</span>
                            </span>
                          )}
                          {card._count.files > 0 && (
                            <span className="flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5L13.5 2z"/><polyline points="13 2 13 9 20 9"/></svg>
                              <span>{card._count.files}</span>
                            </span>
                          )}
                        </div>

                        {card.dueDate && (
                          <span className={new Date(card.dueDate) < new Date() ? 'text-red-600' : ''}>
                            Due {new Date(card.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        {COLUMNS.filter(col => col.id !== card.columnId).map(col => (
                          <button
                            key={col.id}
                            onClick={() => moveCard(card.id, col.id)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            → {col.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Modal */}
      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          isOpen={isModalOpen}
          onClose={closeCardModal}
        />
      )}
    </div>
  );
}