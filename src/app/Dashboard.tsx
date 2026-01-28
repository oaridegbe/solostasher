"use client";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, PointerSensor, MouseSensor } from "@hello-pangea/dnd";

const columns = ["inquiry", "quoted", "won", "followup"];

export default function Dashboard() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  async function onDragEnd(result: any) {
    if (!result.destination) return;

    const newStatus = result.destination.droppableId;
    const cardId = result.draggableId;

    // Optimistic UI update first
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    // Background sync
    fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, newStatus })
    }).catch(() => {
      // Optional rollback on failure
      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, status: result.source.droppableId } : c))
      );
    });
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher Board</h1>

      {/* NEW DEAL FORM */}
      <div className="mb-4 flex items-center gap-2">
        <input id="title" placeholder="Deal title" className="px-3 py-2 border rounded" />
        <input id="email" placeholder="Client email" className="px-3 py-2 border rounded" />
        <button
          onClick={async () => {
            const title = (document.getElementById("title") as HTMLInputElement).value;
            const email = (document.getElementById("email") as HTMLInputElement).value;
            if (!title) return;
            const res = await fetch("/api/cards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, email })
            });
            if (!res.ok) {
              console.error("Create failed", await res.text());
              return;
            }
            location.reload();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + New Deal
        </button>
      </div>

      {/* KANBAN GRID with zero-lag drag */}
      <DragDropContext
        onDragEnd={onDragEnd}
        enableDefaultSensors={false}
        sensors={[
          {
            sensor: window.PointerEvent ? PointerSensor : MouseSensor,
            options: { activationConstraint: { distance: 0 } }
          }
        ]}
      >
        <div className="flex gap-4">
          {columns.map(col => (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div
                  className="w-72 bg-gray-100 p-2 rounded"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2 className="font-bold capitalize mb-2">{col}</h2>
                  {cards
                    .filter(c => c.status === col)
                    .map((c, idx) => (
                      <Draggable key={c.id} draggableId={c.id} index={idx}>
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            className="bg-white p-3 mb-2 rounded shadow"
                            style={{ borderLeft: "5px solid #3b82f6" }}
                          >
                            <p className="font-semibold cursor-move" {...p.dragHandleProps}>{c.title}</p>
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