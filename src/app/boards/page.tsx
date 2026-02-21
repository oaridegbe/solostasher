'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    cards: number;
  };
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBoardTitle,
          userId: 'mock-user-id' // Replace with actual auth
        })
      });

      if (res.ok) {
        setNewBoardTitle('');
        fetchBoards();
      }
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;

    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchBoards();
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
          <div className="text-sm text-gray-500">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Create Board Form */}
        <form onSubmit={createBoard} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isCreating || !newBoardTitle.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 mb-4">No boards yet. Create your first board above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/boards/${board.id}`} className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                      {board.title}
                    </h2>
                  </Link>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    className="text-gray-400 hover:text-red-600 p-2"
                    title="Delete board"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{board._count.cards} cards</span>
                  <span>Updated {new Date(board.updatedAt).toLocaleDateString()}</span>
                </div>

                <Link
                  href={`/boards/${board.id}`}
                  className="block w-full text-center py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
                >
                  Open Board →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}