"use client";

import { useEffect, useState, useRef } from "react";

const columns = ["inquiry", "quoted", "completed", "followup"];
const allTags = ["Hot", "Recurring", "Upsell"];

interface Card {
  id: string;
  title: string;
  status: string;
  color?: string;
  tags?: string;
  due_date?: string;
  files?: string;
  client_email?: string;
}

export default function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // -----  native HTML5 drag  -----
  async function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId }));
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, newStatus: string) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const { cardId } = JSON.parse(data);
    if (!cardId) return;

    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, newStatus })
    }).catch(err => console.error("Move failed", err));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // -----  change card color  -----
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

  // -----  change card tags  -----
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

  // -----  change due date  -----
  async function changeDueDate(cardId: string, newDate: string) {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, due_date: newDate } : c))
    );

    fetch("/api/due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, due_date: newDate })
    }).catch(err => console.error("Due-date update failed", err));
  }

  // -----  file uploads  -----
  async function uploadFiles(cardId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    
    setUploading(cardId);
    try {
      const form = new FormData();
      for (let i = 0; i < files.length; i++) form.append("file", files[i]);
      
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        console.error("Upload failed");
        return;
      }
      const urls = await res.json() as {url: string; name: string}[];
      const currentCard = cards.find(c => c.id === cardId);
      const current = JSON.parse(currentCard?.files || "[]") as {url: string; name: string}[];
      const next = [...current, ...urls];
      
      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
      );
      
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, files: JSON.stringify(next) })
      });
    } catch (err) {
      console.error("Files update failed", err);
    } finally {
      setUploading(null);
      // Reset input to allow uploading the same file again if deleted
      const inputRef = fileInputRefs.current[cardId];
      if (inputRef) {
        inputRef.value = "";
      }
    }
  }

  async function removeFile(cardId: string, urlToRemove: string) {
    const currentCard = cards.find(c => c.id === cardId);
    const current = JSON.parse(currentCard?.files || "[]") as {url: string; name: string}[];
    const next = current.filter(f => f.url !== urlToRemove);
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, files: JSON.stringify(next) } : c))
    );
    fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, files: JSON.stringify(next) })
    }).catch(err => console.error("Files update failed", err));
  }

  // -----  new deal  -----
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
      body: JSON.stringify({ title, email, color, tags: "", due_date: "", files: "[]", status: "inquiry" })
    });
    location.reload();
  }

  // -----  filter by tags  -----
  const visibleCards = selectedTags.length
    ? cards.filter(c => selectedTags.some((t: string) => (c.tags || "").split(",").includes(t)))
    : cards;

  // -----  due-date badge  -----
  function DueBadge({ date }: { date?: string }) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-500 text-white">Overdue</span>;
    }
    if (diff === 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-orange-500 text-white">Today</span>;
    }
    if (diff <= 3) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-400 text-white">{diff}d</span>;
    }
    return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-800">{diff}d</span>;
  }

  // -----  file list inside card  -----
  function FileList({ card }: { card: Card }) {
    const files = JSON.parse(card.files || "[]") as { url: string; name: string }[];
    if (files.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {files.map(f => (
          <div key={f.url} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs group">
            <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[120px]">
              {f.name}
            </a>
            <button
              onClick={() => removeFile(card.id, f.url)}
              className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher Board</h1>

      {/* NEW DEAL FORM */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
        <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + New Deal
        </button>
      </div>

      {/* TAG FILTER BAR */}
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

      {/* KANBAN GRID */}
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
                  className="bg-white p-3 mb-3 rounded shadow cursor-move relative flex flex-col justify-between"
                  style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                >
                  {/* top row: due date */}
                  <div className="flex items-center justify-between mb-2">
                    <DueBadge date={c.due_date} />
                    <input
                      type="date"
                      value={c.due_date ? c.due_date.substring(0, 10) : ""}
                      onChange={(e) => changeDueDate(c.id, e.target.value)}
                      className="text-xs rounded border px-1 py-0.5"
                      title="Due"
                    />
                  </div>

                  {/* title + email */}
                  <div className="mb-2">
                    <p className="font-semibold text-gray-800 leading-tight">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.client_email}</p>
                  </div>

                  {/* files display */}
                  <FileList card={c} />

                  {/* bottom controls: tags, file, color */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex gap-1 flex-wrap">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
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
                      {/* File Upload Button */}
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
                          className="hidden"
                        />
                      </label>

                      {/* Color Picker */}
                      <input
                        type="color"
                        value={c.color || "#3b82f6"}
                        onChange={(e) => changeColor(c.id, e.target.value)}
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
    </main>
  );
}