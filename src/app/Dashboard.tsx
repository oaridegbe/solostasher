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

    // instant UI move
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    // background save
    fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, newStatus })
    }).catch(err => console.error("Move failed", err));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); // allow drop
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

      {/* NEW DEAL FORM with color picker */}
      <div className="mb-4 flex items-center gap-2">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
        <input id="color" type="color" className="w-10 h-10 border rounded cursor-pointer" defaultValue="#3b82f6" />
        <button onClick={createDeal} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + New Deal
        </button>
      </div>

      {/* KANBAN GRID with native drag */}
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
                  className="bg-white p-3 mb-2 rounded shadow cursor-move"
                  style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
                >
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-gray-500">{c.client_email}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}