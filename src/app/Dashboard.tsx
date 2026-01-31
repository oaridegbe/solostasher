"use client";
import { useEffect, useState } from "react";

const columns = ["inquiry", "quoted", "won", "followup"];

export default function Dashboard() {
  const [cards, setCards] = useState<any[]>([]);

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

  // -----  new deal  -----
  async function createDeal() {
    const title = (document.getElementById("title") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const color = (document.getElementById("color") as HTMLInputElement).value;
    if (!title) return;
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, email, color })
    });
    location.reload();
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher Board</h1>

      {/* NEW DEAL FORM */}
      <div className="mb-4 flex items-center gap-2">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
        <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + New Deal
        </button>
      </div>

      {/* KANBAN GRID with native drag + per-card color picker */}
      <div className="flex gap-4">
        {columns.map(col => (
          <div
            key={col}
            className="w-72 bg-gray-100 p-2 rounded"
            onDrop={(e) => handleDrop(e, col)}
            onDragOver={handleDragOver}
          >
            <h2 className="font-bold capitalize mb-2">{col}</h2>
            {cards
              .filter(c => c.status === col)
              .map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c.id, col)}
                  className="bg-white p-3 mb-2 rounded shadow cursor-move relative"
                  style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                >
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-gray-500">{c.client_email}</p>
                  {/* tiny color picker bottom-right */}
                  <input
                    type="color"
                    value={c.color || "#3b82f6"}
                    onChange={(e) => changeColor(c.id, e.target.value)}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded cursor-pointer border"
                    title="Change color"
                  />
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}