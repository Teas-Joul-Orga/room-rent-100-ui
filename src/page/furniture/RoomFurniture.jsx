import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RoomFurniture() {
  const { room } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("furniture")) || [];
    setItems(list.filter((f) => f.room === room));
  }, [room]);

  return (
    <div className="p-6 bg-sky-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 rounded-lg border bg-white hover:bg-sky-100"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Room {room}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((f) => (
          <div key={f.id} className="bg-white rounded-xl shadow p-4 border">
            <h4 className="font-semibold">{f.name}</h4>
            <p className="text-sm text-gray-500">Condition: {f.condition}</p>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-gray-400">No furniture in this room.</p>
        )}
      </div>
    </div>
  );
}
