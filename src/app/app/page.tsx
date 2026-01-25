"use client";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const columns = ["inquiry", "quoted", "won", "followup"];

export default function Dashboard() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cards").then(r => r.json()).then(setCards).catch(() => setCards([]));
  }, []);

  async function onDragEnd(result: any) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const cardId = result.draggableId;
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c)));
    await fetch("/api/move", { method: "POST", body: JSON.stringify({ cardId, newStatus }) });
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher Board</h1>

      {/* NEW FORM */}
      <div className="mb-4">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded mr-2" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded mr-2" />
        <button
          onClick={async () => {
            const title = (document.getElementById("title") as HTMLInputElement).value;
            const email = (document.getElementById("email") as HTMLInputElement).value;
            if (!title) return;
            await fetch("/api/cards", { method: "POST", body: JSON.stringify({ title, email }) });
            location.reload();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + New Deal
        </button>
      </div>

      {/* KANBAN GRID */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          {columns.map(col => (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div className="w-72 bg-gray-100 p-2 rounded" ref={provided.innerRef} {...provided.droppableProps}>
                  <h2 className="font-bold capitalize mb-2">{col}</h2>
                  {cards.filter(c => c.status === col).map((c, idx) => (
                    <Draggable key={c.id} draggableId={c.id} index={idx}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="bg-white p-3 mb-2 rounded shadow">
                          <p className="font-semibold">{c.title}</p>
                          <p className="text-sm text-gray-500">{c.client_email}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </main>
  );
}