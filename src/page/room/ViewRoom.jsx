import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [furnitureList, setFurnitureList] = useState([]);

  useEffect(() => {
    const rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    const found = rooms.find((r) => r.id === Number(id));
    setRoom(found || null);

    const furniture = JSON.parse(localStorage.getItem("furniture")) || [];
    const normalized = furniture.map((f) => ({
      ...f,
      condition: f.condition || f.status || "Good",
    }));
    setFurnitureList(normalized);
  }, [id]);

  if (!room) return null;

  const assignedFurniture = furnitureList.filter((f) =>
    (room.furniture || []).includes(f.id)
  );

  return (
    <div className="min-h-screen bg-sky-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* IMAGE */}
        <img
          src={room.photo || "https://via.placeholder.com/800x300"}
          alt={room.name}
          className="w-full h-64 object-cover"
        />

        <div className="p-8 space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-sky-900">{room.name}</h2>
              <p className="text-sm text-slate-500">
                ${room.rent} / month •{" "}
                <span
                  className={`font-medium ${
                    room.status === "Free" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {room.status}
                </span>
              </p>
            </div>

            <button
              onClick={() => navigate(`/dashboard/rooms/edit/${room.id}`)}
              className="px-5 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
            >
              Edit Room
            </button>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h4 className="font-semibold mb-1">Description</h4>
            <p className="text-gray-600">
              {room.description || "No description provided"}
            </p>
          </div>

          {/* FURNITURE */}
          <div>
            <h4 className="font-semibold mb-3">Furniture in this Room</h4>

            {assignedFurniture.length === 0 ? (
              <p className="text-sm text-gray-400">No furniture assigned</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {assignedFurniture.map((f) => (
                  <div key={f.id} className="border rounded-xl p-4 bg-sky-50">
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.type}</p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full
                        ${
                          f.condition === "New"
                            ? "bg-blue-100 text-blue-700"
                            : f.condition === "Good"
                            ? "bg-green-100 text-green-700"
                            : f.condition === "Broken"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {f.condition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Lease History</h4>
              <button
                onClick={() =>
                  navigate(`/dashboard/tenants/createlease`, {
                    state: { id: tenant.id, email: tenant.email },
                  })
                }
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                + Create New Lease
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Room</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-left">Rent</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400">
                      No lease history for this tenant.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BACK */}
          <div className="pt-4 border-t">
            <button
              onClick={() => navigate("/dashboard/rooms")}
              className="px-5 py-2 rounded-lg border hover:bg-slate-100"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
