"use client";

import { useEffect, useState } from "react";
import { CardModal } from '@/components/CardModal';

const columns = ["inquiry", "quoted", "completed", "followup"];
const allTags = ["Hot", "Recurring", "Upsell"];

interface Card {
  id: string;
  title: string;
  client_email?: string;
  status: string;
  color?: string;
  tags?: string;
  due_date?: string;
  files?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

interface FileAttachment {
  url: string;
  name: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<"board" | "calendar">("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [movingCardId, setMovingCardId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cards");
      if (!res.ok) throw new Error('Failed to fetch cards');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCards(data);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast('Failed to load deals', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Calendar helpers
  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function getCardsForDay(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return visibleCards.filter(c => c.due_date === dateStr);
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  // Drag & Drop with optimistic update
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId }));
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, newStatus: string) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    
    const { cardId } = JSON.parse(data);
    if (!cardId) return;

    const oldCards = [...cards];
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
    );
    setMovingCardId(cardId);

    try {
      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, newStatus }),
      });
      
      if (!res.ok) throw new Error('Move failed');
      showToast(`Moved to ${newStatus}`);
    } catch (err) {
      setCards(oldCards);
      showToast('Failed to move deal', 'error');
      console.error("Move failed", err);
    } finally {
      setMovingCardId(null);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // Change color with optimistic update
  async function changeColor(cardId: string, newColor: string) {
    const oldCards = [...cards];
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, color: newColor } : c))
    );

    try {
      const res = await fetch("/api/color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, color: newColor }),
      });
      if (!res.ok) throw new Error('Failed to update color');
    } catch (err) {
      setCards(oldCards);
      showToast('Failed to update color', 'error');
      console.error("Color update failed", err);
    }
  }

  // Change tags with optimistic update
  async function changeTags(cardId: string, newTags: string[]) {
    const tagsStr = newTags.join(",");
    const oldCards = [...cards];
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, tags: tagsStr } : c))
    );

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, tags: tagsStr }),
      });
      if (!res.ok) throw new Error('Failed to update tags');
    } catch (err) {
      setCards(oldCards);
      showToast('Failed to update tags', 'error');
      console.error("Tags update failed", err);
    }
  }

  // Change due date with optimistic update
  async function changeDueDate(cardId: string, newDate: string) {
    const oldCards = [...cards];
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, due_date: newDate } : c))
    );

    try {
      const res = await fetch("/api/due", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, due_date: newDate }),
      });
      if (!res.ok) throw new Error('Failed to update due date');
    } catch (err) {
      setCards(oldCards);
      showToast('Failed to update due date', 'error');
      console.error("Due-date update failed", err);
    }
  }

  // Toggle recurring with optimistic update
  async function toggleRecurring(cardId: string, isRecurring: boolean, pattern: string = 'monthly') {
    const oldCards = [...cards];
    setCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, isRecurring, recurrencePattern: pattern } : c)
    );

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, isRecurring, pattern })
      });
      if (!res.ok) throw new Error('Failed to update recurring');
    } catch (err) {
      setCards(oldCards);
      showToast('Failed to update recurrence', 'error');
      console.error('Failed to update recurring:', err);
    }
  }

  // File uploads
  async function uploadFiles(cardId: string, files: FileList) {
    const form = new FormData();
    for (let i = 0; i < files.length; i++) form.append("file", files[i]);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error('Upload failed');
      const urls: FileAttachment[] = await res.json();
      const card = cards.find((c) => c.id === cardId);
      const current: FileAttachment[] = JSON.parse(card?.files || "[]");
      const next = [...current, ...urls];
      
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
      );
      
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, files: JSON.stringify(next) }),
      });
      showToast('Files uploaded');
    } catch (err) {
      showToast('Failed to upload files', 'error');
      console.error("Upload error:", err);
    }
  }

  async function removeFile(cardId: string, urlToRemove: string) {
    const card = cards.find((c) => c.id === cardId);
    const current: FileAttachment[] = JSON.parse((card?.files || "[]") as string);
    const next = current.filter((f) => f.url !== urlToRemove);
    
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
    );
    
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, files: JSON.stringify(next) }),
      });
      showToast('File removed');
    } catch (err) {
      showToast('Failed to remove file', 'error');
      console.error("Files update failed", err);
    }
  }

  // New deal
  async function createDeal() {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const colorInput = document.getElementById("color") as HTMLInputElement;
    
    const title = titleInput?.value;
    const email = emailInput?.value;
    const color = colorInput?.value;
    
    if (!title) {
      showToast('Please enter a title', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          email, 
          color, 
          tags: "", 
          due_date: "", 
          files: "[]",
          status: "inquiry"
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create deal');
      
      showToast('Deal created successfully');
      titleInput.value = '';
      if (emailInput) emailInput.value = '';
      await fetchCards();
    } catch (err) {
      showToast('Failed to create deal', 'error');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  // Modal functions
  function openCardModal(cardId: string) {
    setSelectedCardId(cardId);
    setIsModalOpen(true);
  }

  function closeCardModal() {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCardId(null), 300);
  }

  // Filter and Search
  const filteredCards = cards.filter((c) => {
    const matchesTags = selectedTags.length === 0 || selectedTags.some((t) => (c.tags || "").split(",").includes(t));
    const matchesSearch = searchQuery === "" || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.client_email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTags && matchesSearch;
  });

  const visibleCards = filteredCards;

  // Due badge component
  function DueBadge({ date }: { date?: string }) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-500 text-white font-medium">Overdue</span>;
    }
    if (diff === 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-orange-500 text-white font-medium">Today</span>;
    }
    return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-800">{diff}d</span>;
  }

  // File list component
  function FileList({ card }: { card: Card }) {
    const files: FileAttachment[] = JSON.parse((card.files || "[]") as string);
    if (files.length === 0) return null;
    
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((f) => (
          <div key={f.url} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs group">
            <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[100px]">
              {f.name}
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile(card.id, f.url);
              }}
              className="text-red-400 hover:text-red-700 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Calendar Component
  function CalendarView() {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="px-3 py-1 border rounded hover:bg-gray-50">←</button>
            <button onClick={nextMonth} className="px-3 py-1 border rounded hover:bg-gray-50">→</button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="h-24 bg-gray-50 rounded" />
          ))}
          
          {days.map(day => {
            const dayCards = getCardsForDay(day);
            return (
              <div 
                key={day} 
                className="h-24 border rounded p-2 overflow-y-auto hover:bg-gray-50"
              >
                <div className="font-medium text-sm text-gray-700 mb-1">{day}</div>
                <div className="space-y-1">
                  {dayCards.map(card => (
                    <div
                      key={card.id}
                      onClick={() => openCardModal(card.id)}
                      className="text-xs p-1 rounded cursor-pointer truncate"
                      style={{ backgroundColor: card.color || "#3b82f6", color: "white" }}
                    >
                      {card.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Toast Component
  function ToastContainer() {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-slide-up ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    );
  }

  // Loading Skeleton
  function LoadingSkeleton() {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col} className="w-80 bg-gray-100 p-3 rounded-lg flex-shrink-0">
            <div className="h-6 bg-gray-200 rounded mb-3 w-24 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-lg h-32 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Header with View Toggle and Export */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">SoloStasher Board</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("board")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "board" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "calendar" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Calendar
            </button>
          </div>
          
          {/* Export CSV Button */}
          <a
            href="/api/export"
            download
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search deals by title or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Found {visibleCards.length} {visibleCards.length === 1 ? 'deal' : 'deals'} matching &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* New Deal Form */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg shadow-sm border">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded flex-1 min-w-[200px]" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded flex-1 min-w-[200px]" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Color:</label>
          <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        </div>
        <button 
          onClick={createDeal} 
          disabled={isCreating}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </>
          ) : (
            '+ New Deal'
          )}
        </button>
      </div>

      {/* Tag Filter Bar */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() =>
              setSelectedTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selectedTags.includes(tag)
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tag}
          </button>
        ))}
        {(selectedTags.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              setSelectedTags([]);
              setSearchQuery("");
            }}
            className="px-3 py-1 text-xs rounded-full border bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Board View */}
          {view === "board" && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((col) => (
                <div
                  key={col}
                  className="w-80 bg-gray-100 p-3 rounded-lg flex-shrink-0 min-h-[500px]"
                  onDrop={(e) => handleDrop(e, col)}
                  onDragOver={handleDragOver}
                >
                  <h2 className="font-bold capitalize mb-3 text-gray-700 px-1">
                    {col} 
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({visibleCards.filter((c) => c.status === col).length})
                    </span>
                  </h2>
                  
                  <div className="space-y-3">
                    {visibleCards
                      .filter((c) => c.status === col)
                      .map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          onClick={() => openCardModal(c.id)}
                          className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow relative group min-h-[140px] flex flex-col ${
                            movingCardId === c.id ? 'opacity-50' : ''
                          }`}
                          style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                        >
                          {/* Header: Due Date Badge and Date Picker */}
                          <div className="flex items-center justify-between mb-3">
                            <DueBadge date={c.due_date} />
                            <input
                              type="date"
                              value={c.due_date ? c.due_date.substring(0, 10) : ""}
                              onChange={(e) => changeDueDate(c.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs border rounded px-1 py-0.5 text-gray-600 cursor-pointer hover:border-gray-400"
                              title="Set due date"
                            />
                          </div>

                          {/* Content */}
                          <div className="mb-3 flex-grow">
                            <p className="font-semibold text-gray-800 leading-tight">{c.title}</p>
                            {c.client_email && (
                              <p className="text-sm text-gray-500 mt-1">{c.client_email}</p>
                            )}
                            {c.isRecurring && (
                              <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">
                                ↻ Recurring
                              </span>
                            )}
                          </div>

                          {/* Bottom row: Tags (aligned bottom), file + color */}
                          <div className="flex items-end justify-between mt-auto gap-2">
                            <div className="flex gap-1 flex-wrap content-end">
                              {allTags.map((tag) => {
                                const active = (c.tags || "").split(",").includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = (c.tags || "").split(",").filter(Boolean);
                                      const next = current.includes(tag)
                                        ? current.filter((t) => t !== tag)
                                        : [...current, tag];
                                      changeTags(c.id, next);
                                    }}
                                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                      active
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-1">
                              <label 
                                className="text-xs px-2 py-1 rounded border bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                File
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => e.target.files && uploadFiles(c.id, e.target.files)}
                                  className="hidden"
                                />
                              </label>
                              <input
                                type="color"
                                value={c.color || "#3b82f6"}
                                onChange={(e) => changeColor(c.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer overflow-hidden"
                                title="Change color"
                              />
                            </div>
                          </div>

                          {/* File Attachments */}
                          <FileList card={c} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calendar View */}
          {view === "calendar" && <CalendarView />}
        </>
      )}

      {/* Modal - Only render when we have a valid cardId and modal is open */}
      {selectedCardId && isModalOpen && (
        <CardModal 
          cardId={selectedCardId} 
          isOpen={isModalOpen} 
          onClose={closeCardModal} 
        />
      )}
    </main>
  );
}