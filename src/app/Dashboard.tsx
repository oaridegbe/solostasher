<div
  key={c.id}
  draggable
  onDragStart={(e) => handleDragStart(e, c.id, col)}
  className="bg-white p-4 mb-3 rounded shadow cursor-move relative flex flex-col justify-between min-h-[100px]"
  style={{ borderLeft: `5px solid ${c.color || "#3b82f6"}` }}
>
  {/* top section */}
  <div className="mb-2">
    <p className="font-semibold text-gray-800">{c.title}</p>
    <p className="text-sm text-gray-500">{c.client_email}</p>
  </div>

  {/* bottom row: tags left, color right */}
  <div className="flex items-center justify-between">
    {/* tags row (single line) */}
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

    {/* color picker */}
    <input
      type="color"
      value={c.color || "#3b82f6"}
      onChange={(e) => changeColor(c.id, e.target.value)}
      className="w-6 h-6 rounded cursor-pointer border ml-2"
      title="Change color"
    />
  </div>
</div>