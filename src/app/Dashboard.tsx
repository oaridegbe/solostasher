"use client";

import { useEffect, useState, useRef } from "react";

const columns = ["inquiry", "quoted", "completed", "followup"];
const allTags = ["Hot", "Recurring", "Upsell"];

interface Comment {
  id: string;
  card_id: string;
  text: string;
  created_at: string;
  author: string;
}

interface Activity {
  id: string;
  card_id: string;
  action: string;
  created_at: string;
}

interface Card {
  id: string;
  title: string;
  status: string;
  color?: string;
  tags?: string;
  due_date?: string;
  files?: string;
  client_email?: string;
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly" | "";
  notify_email?: boolean;
  notify_slack?: boolean;
  custom_email?: string;
  slack_webhook?: string;
}

export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "calendar">("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  const [notificationForm, setNotificationForm] = useState({
    email: "",
    slackWebhook: "",
    notifyOnDue: true
  });

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data: Card[]) => {
        setCards(data);
        const saved = localStorage.getItem("notification_prefs");
        if (saved) setNotificationForm(JSON.parse(saved));
      })
      .catch(() => setCards([]));
  }, []);

  useEffect(() => {
    if (selectedCard) {
      loadCommentsAndActivity(selectedCard.id);
    }
  }, [selectedCard]);

  async function loadCommentsAndActivity(cardId: string) {
    setLoadingComments(true);
    try {
      const [commentsRes, activityRes] = await Promise.all([
        fetch(`/api/cards/${cardId}/comments`),
        fetch(`/api/cards/${cardId}/activity`)
      ]);
      if (commentsRes.ok) setComments(await commentsRes.json());
      if (activityRes.ok) setActivities(await activityRes.json());
    } catch (err) {
      console.error("Failed to load card details", err);
    } finally {
      setLoadingComments(false);
    }
  }

  async function addComment() {
    if (!selectedCard || !newComment.trim()) return;
    const res = await fetch(`/api/cards/${selectedCard.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, author: "User" })
    });
    if (res.ok) {
      const comment = await res.json();
      setComments(prev => [comment, ...prev]);
      setNewComment("");
      await fetch(`/api/cards/${selectedCard.id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "Added comment" })
      });
      loadCommentsAndActivity(selectedCard.id);
    }
  }

  async function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId }));
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, newStatus: string) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const { cardId } = JSON.parse(data);
    if (!cardId) return;

    const oldStatus = cards.find(c => c.id === cardId)?.status;
    
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    await fetch(`/api/cards/${cardId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: `Moved from ${oldStatus} to ${newStatus}` })
    }).catch(() => {});

    if (newStatus === "completed") {
      const card = cards.find(c => c.id === cardId);
      if (card?.is_recurring) {
        handleRecurringComplete(card);
      }
    }

    fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, newStatus })
    }).catch(err => console.error("Move failed", err));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleRecurringComplete(card: Card) {
    const nextDue = new Date(card.due_date || new Date());
    switch (card.recurrence_pattern) {
      case "daily": nextDue.setDate(nextDue.getDate() + 1); break;
      case "weekly": nextDue.setDate(nextDue.getDate() + 7); break;
      case "monthly": nextDue.setMonth(nextDue.getMonth() + 1); break;
    }
    
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: card.title,
        email: card.client_email,
        color: card.color,
        tags: card.tags,
        due_date: nextDue.toISOString().split("T")[0],
        files: "[]",
        status: "inquiry",
        is_recurring: card.is_recurring,
        recurrence_pattern: card.recurrence_pattern
      })
    });
    
    fetch("/api/cards").then(r => r.json()).then(setCards);
  }

  async function updateRecurringSettings(cardId: string, settings: Partial<Card>) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...settings } : c));
    fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, ...settings })
    }).catch(err => console.error("Recurring update failed", err));
  }

  function saveNotificationPrefs() {
    localStorage.setItem("notification_prefs", JSON.stringify(notificationForm));
    alert("Notification preferences saved!");
  }

  async function changeColor(cardId: string, newColor: string) {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, color: newColor } : c))
    );
    fetch("/api/color", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, color: newColor })
    }).catch(err => console.error("Color update failed", err));
  }

  async function changeTags(cardId: string, newTags: string[]) {
    const tagsStr = newTags.join(",");
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, tags: tagsStr } : c))
    );
    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, tags: tagsStr })
    }).catch(err => console.error("Tags update failed", err));
  }

  async function changeDueDate(cardId: string, newDate: string) {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, due_date: newDate } : c))
    );
    
    const card = cards.find(c => c.id === cardId);
    if (card?.notify_email || notificationForm.notifyOnDue) {
      fetch("/api/schedule-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cardId, 
          dueDate: newDate,
          email: card?.custom_email || notificationForm.email,
          slackWebhook: card?.slack_webhook || notificationForm.slackWebhook
        })
      }).catch(() => {});
    }
    
    fetch("/api/due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, due_date: newDate })
    }).catch(err => console.error("Due-date update failed", err));
  }

  async function uploadFiles(cardId: string, files: FileList | null, isModal = false) {
    if (!files || files.length === 0) return;
    
    setUploading(cardId);
    try {
      const form = new FormData();
      for (let i = 0; i < files.length; i++) form.append("file", files[i]);
      
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      
      const urls = await res.json() as {url: string; name: string}[];
      const currentCard = cards.find(c => c.id === cardId);
      const current = JSON.parse(currentCard?.files || "[]") as {url: string; name: string}[];
      const next = [...current, ...urls];
      
      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
      );
      
      await fetch(`/api/cards/${cardId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: `Attached ${files.length} file(s)` })
      }).catch(() => {});
      
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, files: JSON.stringify(next) })
      });
      
      if (selectedCard) setSelectedCard({ ...selectedCard, files: JSON.stringify(next) });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(null);
      const inputRef = isModal ? modalFileInputRef.current : fileInputRefs.current[cardId];
      if (inputRef) inputRef.value = "";
    }
  }

  async function removeFile(cardId: string, urlToRemove: string) {
    const currentCard = cards.find(c => c.id === cardId);
    const current = JSON.parse(currentCard?.files || "[]") as {url: string; name: string}[];
    const next = current.filter(f => f.url !== urlToRemove);
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
    );
    if (selectedCard) setSelectedCard({ ...selectedCard, files: JSON.stringify(next) });
    
    fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, files: JSON.stringify(next) })
    }).catch(err => console.error("Files update failed", err));
  }

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
        status: "inquiry",
        is_recurring: false 
      })
    });
    location.reload();
  }

  const visibleCards = selectedTags.length
    ? cards.filter(c => selectedTags.some((t: string) => (c.tags || "").split(",").includes(t)))
    : cards;

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  function getCardsForDay(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return cards.filter(c => c.due_date?.startsWith(dateStr));
  }

  function DueBadge({ date }: { date?: string }) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span className="px-2 py-0.5 text-xs rounded bg-red-500 text-white">Overdue</span>;
    if (diff === 0) return <span className="px-2 py-0.5 text-xs rounded bg-orange-500 text-white">Today</span>;
    if (diff <= 3) return <span className="px-2 py-0.5 text-xs rounded bg-yellow-400 text-white">{diff}d</span>;
    return <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-800">{diff}d</span>;
  }

  function FileList({ card, isModal = false }: { card: Card; isModal?: boolean }) {
    const files = JSON.parse(card.files || "[]") as { url: string; name: string }[];
    if (files.length === 0) return null;
    
    return (
      <div className={`flex flex-wrap gap-2 ${isModal ? "mt-4" : "mt-2"}`}>
        {files.map(f => {
          const isImage = f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isPDF = f.name.match(/\.pdf$/i);
          
          return (
            <div key={f.url} className="flex items-center gap-2 bg-gray-50 rounded p-2 border group">
              {isImage ? (
                <img src={f.url} alt={f.name} className="w-8 h-8 object-cover rounded" />
              ) : isPDF ? (
                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 text-xs font-bold">PDF</div>
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs">FILE</div>
              )}
              <div className="flex-1 min-w-0">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs truncate block max-w-[120px]">
                  {f.name}
                </a>
              </div>
              <button
                onClick={() => removeFile(card.id, f.url)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  function CardModal() {
    if (!selectedCard) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{selectedCard.title}</h2>
              <p className="text-gray-500 text-sm">{selectedCard.client_email}</p>
              <div className="flex gap-2 mt-2">
                <DueBadge date={selectedCard.due_date} />
                {selectedCard.is_recurring && (
                  <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                    ↻ {selectedCard.recurrence_pattern}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Attachments</h3>
              <FileList card={selectedCard} isModal />
              <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm">
                <span>+ Add File</span>
                <input
                  ref={(el) => { modalFileInputRef.current = el; }}
                  type="file"
                  multiple
                  onChange={(e) => uploadFiles(selectedCard.id, e.target.files, true)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Recurring Deal</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCard.is_recurring || false}
                    onChange={(e) => updateRecurringSettings(selectedCard.id, { 
                      is_recurring: e.target.checked,
                      recurrence_pattern: selectedCard.recurrence_pattern || "weekly"
                    })}
                  />
                  Enable recurrence
                </label>
                {selectedCard.is_recurring && (
                  <select
                    value={selectedCard.recurrence_pattern || "weekly"}
                    onChange={(e) => updateRecurringSettings(selectedCard.id, { recurrence_pattern: e.target.value as any })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCard.notify_email || false}
                    onChange={(e) => {
                      const updates = { notify_email: e.target.checked };
                      setCards(prev => prev.map(c => c.id === selectedCard.id ? { ...c, ...updates } : c));
                      setSelectedCard({ ...selectedCard, ...updates });
                    }}
                  />
                  Email notification on due date
                </label>
                {selectedCard.notify_email && (
                  <input
                    type="email"
                    placeholder="Custom email (optional)"
                    value={selectedCard.custom_email || ""}
                    onChange={(e) => {
                      const updates = { custom_email: e.target.value };
                      setCards(prev => prev.map(c => c.id === selectedCard.id ? { ...c, ...updates } : c));
                      setSelectedCard({ ...selectedCard, ...updates });
                    }}
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Comments</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {loadingComments ? (
                  <p className="text-gray-500 text-sm">Loading...</p>
                ) : comments.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{comment.author}</span>
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && addComment()}
                />
                <button
                  onClick={addComment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  Post
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Activity</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No activity yet</p>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{activity.action}</span>
                      <span className="text-gray-400 text-xs">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function CalendarView() {
    const days = getDaysInMonth(currentMonth);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded overflow-hidden">
          {weekDays.map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
          {days.map((day, idx) => (
            <div key={idx} className="bg-white min-h-[100px] p-2">
              {day && (
                <>
                  <div className="text-sm font-medium text-gray-700 mb-1">{day}</div>
                  <div className="space-y-1">
                    {getCardsForDay(day).map(card => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="text-xs p-1 rounded cursor-pointer truncate"
                        style={{ 
                          backgroundColor: card.color ? `${card.color}20` : "#e5e7eb",
                          borderLeft: `3px solid ${card.color || "#9ca3af"}`
                        }}
                      >
                        {card.title}
                        {card.is_recurring && <span className="ml-1">↻</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SoloStasher Board</h1>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded">
          <button
            onClick={() => setView("board")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              view === "board" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              view === "calendar" ? "bg-white shadow text-indigo-600" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Notification Settings</h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-xs text-blue-700 mb-1">Default Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={notificationForm.email}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, email: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-blue-700 mb-1">Slack Webhook URL</label>
            <input
              type="text"
              placeholder="https://hooks.slack.com/..."
              value={notificationForm.slackWebhook}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, slackWebhook: e.target.value }))}
              className="border rounded px-2 py-1 text-sm w-64"
            />
          </div>
          <button
            onClick={saveNotificationPrefs}
            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>

      {view === "board" ? (
        <>
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
            <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
            <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
            <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              + New Deal
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filter:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )
                }
                className={`px-2 py-1 text-xs rounded border ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-2 py-1 text-xs rounded border bg-gray-200 text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(col => (
              <div
                key={col}
                className="w-72 bg-gray-100 p-2 rounded flex-shrink-0 min-h-[500px]"
                onDrop={(e) => handleDrop(e, col)}
                onDragOver={handleDragOver}
              >
                <h2 className="font-bold capitalize mb-2 text-gray-700">{col}</h2>
                {visibleCards
                  .filter(c => c.status === col)
                  .map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => setSelectedCard(c)}
                      className="bg-white p-3 mb-3 rounded shadow cursor-move relative flex flex-col justify-between hover:shadow-md transition-shadow"
                      style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <DueBadge date={c.due_date} />
                        <input
                          type="date"
                          value={c.due_date ? c.due_date.substring(0, 10) : ""}
                          onChange={(e) => changeDueDate(c.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs rounded border px-1 py-0.5"
                          title="Due"
                        />
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 leading-tight">{c.title}</p>
                          {c.is_recurring && <span className="text-purple-600 text-sm" title="Recurring">↻</span>}
                        </div>
                        <p className="text-sm text-gray-500">{c.client_email}</p>
                      </div>

                      <FileList card={c} />

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex gap-1 flex-wrap">
                          {allTags.map(tag => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                const current = (c.tags || "").split(",").filter(Boolean);
                                const next = current.includes(tag)
                                  ? current.filter(t => t !== tag)
                                  : [...current, tag];
                                changeTags(c.id, next);
                              }}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                (c.tags || "").split(",").includes(tag)
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <label 
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${
                              uploading === c.id 
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-[10px]">Attach</span>
                            <input
                              ref={(el) => { fileInputRefs.current[c.id] = el; }}
                              type="file"
                              multiple
                              disabled={uploading === c.id}
                              onChange={(e) => uploadFiles(c.id, e.target.files)}
                              onClick={(e) => e.stopPropagation()}
                              className="hidden"
                            />
                          </label>

                          <input
                            type="color"
                            value={c.color || "#3b82f6"}
                            onChange={(e) => changeColor(c.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                            title="Change color"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <CalendarView />
      )}

      {selectedCard && <CardModal />}
    </main>
  );
}