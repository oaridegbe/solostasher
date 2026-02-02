"use client";

import { useEffect, useState } from "react";

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
  activities?: any[];
  comments?: any[];
}

interface FileAttachment {
  url: string;
  name: string;
}

export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newComment, setNewComment] = useState("");
  const [view, setView] = useState<"board" | "calendar">("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(data);
        } else {
          console.error("API didn't return array:", data);
          setCards([]);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setCards([]);
      });
  }, []);

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

  // Drag & Drop
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId }));
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, newStatus: string) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    
    const { cardId } = JSON.parse(data);
    if (!cardId) return;

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    try {
      await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, newStatus }),
      });
    } catch (err) {
      console.error("Move failed", err);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // Change color
  async function changeColor(cardId: string, newColor: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, color: newColor } : c))
    );

    fetch("/api/color", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, color: newColor }),
    }).catch((err) => console.error("Color update failed", err));
  }

  // Change tags
  async function changeTags(cardId: string, newTags: string[]) {
    const tagsStr = newTags.join(",");
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, tags: tagsStr } : c))
    );

    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, tags: tagsStr }),
    }).catch((err) => console.error("Tags update failed", err));
  }

  // Change due date
  async function changeDueDate(cardId: string, newDate: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, due_date: newDate } : c))
    );

    fetch("/api/due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, due_date: newDate }),
    }).catch((err) => console.error("Due-date update failed", err));
  }

  // File uploads
  async function uploadFiles(cardId: string, files: FileList) {
    const form = new FormData();
    for (let i = 0; i < files.length; i++) form.append("file", files[i]);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) return;
      const urls: FileAttachment[] = await res.json();
      const card = cards.find((c) => c.id === cardId);
      const current: FileAttachment[] = JSON.parse(card?.files || "[]");
      const next = [...current, ...urls];
      
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
      );
      
      fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, files: JSON.stringify(next) }),
      }).catch((err) => console.error("Files update failed", err));
    } catch (err) {
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
    
    fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, files: JSON.stringify(next) }),
    }).catch((err) => console.error("Files update failed", err));
  }

  // New deal
  async function createDeal() {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const colorInput = document.getElementById("color") as HTMLInputElement;
    
    const title = titleInput?.value;
    const email = emailInput?.value;
    const color = colorInput?.value;
    
    if (!title) return;

    await fetch("/api/cards", {
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
    
    location.reload();
  }

  // Modal functions
  async function openCardModal(card: Card) {
    try {
      const [activityRes, commentsRes] = await Promise.all([
        fetch(`/api/cards/${card.id}/activity`),
        fetch(`/api/cards/${card.id}/comments`)
      ]);
      
      const activities = await activityRes.json();
      const comments = await commentsRes.json();
      
      setSelectedCard({ ...card, activities, comments });
    } catch (err) {
      console.error("Failed to load card details:", err);
      setSelectedCard(card);
    }
  }

  async function addComment(cardId: string) {
    if (!newComment.trim()) return;
    
    await fetch(`/api/cards/${cardId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, author: "User" }),
    });
    
    setNewComment("");
    
    if (selectedCard) {
      openCardModal(selectedCard);
    }
  }

  // Filter
  const visibleCards = selectedTags.length
    ? cards.filter((c) => selectedTags.some((t) => (c.tags || "").split(",").includes(t)))
    : cards;

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
                      onClick={() => openCardModal(card)}
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

  // Modal Component
  function CardModal({ card }: { card: Card }) {
    const activities = card.activities || [];
    const comments = card.comments || [];
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="text-gray-500">{card.client_email}</p>
            </div>
            <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Status & Due Date */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="capitalize font-medium">{card.status}</p>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={card.due_date ? card.due_date.substring(0, 10) : ""}
                  onChange={(e) => {
                    changeDueDate(card.id, e.target.value);
                    setSelectedCard({ ...card, due_date: e.target.value });
                  }}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Tags</label>
              <div className="flex gap-2">
                {allTags.map(tag => {
                  const isActive = (card.tags || "").split(",").includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = (card.tags || "").split(",").filter(Boolean);
                        const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
                        changeTags(card.id, next);
                        setSelectedCard({ ...card, tags: next.join(",") });
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Files */}
            {card.files && JSON.parse(card.files).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Attachments</label>
                <FileList card={card} />
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Comments ({comments.length})</h3>
              
              {/* Add Comment */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border rounded px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && addComment(card.id)}
                />
                <button
                  onClick={() => addComment(card.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Post
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{comment.author || "User"}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{comment.text}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-gray-400 italic">No comments yet</p>}
              </div>
            </div>

            {/* Activity Log */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Activity Log</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="text-sm text-gray-600 flex justify-between">
                    <span>{activity.action}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-gray-400 italic">No activity recorded</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SoloStasher Board</h1>
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
      </div>

      {/* New Deal Form */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg shadow-sm border">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded flex-1 min-w-[200px]" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded flex-1 min-w-[200px]" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Color:</label>
          <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        </div>
        <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
          + New Deal
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
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="px-3 py-1 text-xs rounded-full border bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

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
                      onClick={() => openCardModal(c)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow relative group min-h-[140px] flex flex-col"
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

      {/* Modal */}
      {selectedCard && <CardModal card={selectedCard} />}
    </main>
  );
}