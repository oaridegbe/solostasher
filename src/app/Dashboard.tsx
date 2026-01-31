"use client";
import { useEffect, useState } from "react";

const columns = ["inquiry", "quoted", "completed", "followup"];
const allTags = ["Hot", "Recurring", "Upsell"];

export default function Dashboard() {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // -----  native HTML5 drag  -----
  async function handleDragStart(e: React.DragEvent<HTMLDivElement>, cardId: string, newStatus: string) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId, newStatus }));
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, newStatus: string) {
    e.preventDefault();
    const { cardId } = JSON.parse(e.dataTransfer.getData("text/plain"));
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

  // -----  new deal  (no free-form tags input) -----
  async function createDeal() {
    const title = (document.getElementById("title") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const color = (document.getElementById("color") as HTMLInputElement).value;
    if (!title) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, email, color, tags: "", due_date: "" }) // no tags, no due date from form
    });
    location.reload();
  }

  // -----  filter by selected tags  -----
  const visibleCards = selectedTags.length
    ? cards.filter(c => selectedTags.some(t => (c.tags || "").split(",").includes(t)))
    : cards;

  // -----  due-date badge  -----
  function DueBadge({ date }: { date?: string }) {
    if (!date) return null;
    const today = new Date();
    const due = new Date(date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-500 text-white">Overdue</span>;
    }
    if (diff === 0) {
      return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-orange-500 text-white">Today</span>;
    }
    return <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-800">{diff}d</span>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher Board</h1>

      {/* NEW DEAL FORM: Title, Email, Color, New Deal only */}
      <div className="mb-4 flex items-center gap-2">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
        <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + New Deal
        </button>
      </div>

      {/* TAG FILTER BAR (chip only) */}
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

      {/* KANBAN GRID with native drag + per-card controls */}
      <div className="flex gap-4">
        {columns.map(col => (
          <div
            key={col}
            className="w-72 bg-gray-100 p-2 rounded"
            onDrop={(e) => handleDrop(e, col)}
            onDragOver={handleDragOver}
          >
            <h2 className="font-bold capitalize mb-2">{col}</h2>
            {visibleCards
              .filter(c => c.status === col)
              .map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c.id, col)}
                  className="bg-white p-4 mb-3 rounded shadow cursor-move relative flex flex-col justify-between min-h-[100px]"
                  style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                >
                  {/* top row: due date left, color right */}
                  <div className="flex items-center justify-between mb-2 flex-row-reverse">
                    <DueBadge date={c.due_date} />
                    <input
                      type="color"
                      value={c.color || "#3b82f6"}
                      onChange={(e) => changeColor(c.id, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border"
                      title="Color"
                    />
                  </div>

                  {/* middle: title + email */}
                  <div className="mb-2">
                    <p className="font-semibold text-gray-800">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.client_email}</p>
                  </div>

                  {/* bottom row: tags (single line) */}
                  <div className="flex gap-1 flex-nowrap">
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
                        className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
                          (c.tags || "").split(",").includes(tag)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}