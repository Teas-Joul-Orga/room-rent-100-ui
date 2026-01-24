import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [allFurniture, setAllFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState([]);
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    const rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    const found = rooms.find((r) => r.id === Number(id));
    if (found) {
      setRoom(found);
      setSelectedFurniture(found.furniture || []);
      setPhoto(found.photo || "");
    }

    const furniture = JSON.parse(localStorage.getItem("furniture")) || [];
    setAllFurniture(furniture);
  }, [id]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    const rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    const updated = rooms.map((r) =>
      r.id === Number(id) ? { ...room, photo, furniture: selectedFurniture } : r
    );

    localStorage.setItem("rooms", JSON.stringify(updated));
    toast.success("Room updated successfully");
    navigate("/dashboard/rooms");
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-sky-900 mb-6">Edit Room</h2>

        <form onSubmit={handleUpdate} className="space-y-8">
          {/* ROOM IMAGE UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Room Photo
            </label>

            <label className="relative block w-full max-w-md cursor-pointer group">
              {/* IMAGE PREVIEW */}
              <img
                src={
                  photo ||
                  "https://via.placeholder.com/600x350?text=Upload+Room+Photo"
                }
                alt="room"
                className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-sm"
              />

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-white mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h4l2-3h6l2 3h4v11H3V7z"
                  />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span className="text-white text-sm font-medium">
                  Change Photo
                </span>
              </div>

              {/* FILE INPUT */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            <p className="text-xs text-slate-400 mt-2">
              Click the image to upload or change room photo
            </p>
          </div>

          {/* INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Room Name
              </label>
              <input
                value={room.name}
                onChange={(e) => setRoom({ ...room, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Base Rent ($)
              </label>
              <input
                type="number"
                value={room.rent}
                onChange={(e) => setRoom({ ...room, rent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Status
              </label>
              <select
                value={room.status}
                onChange={(e) => setRoom({ ...room, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none"
              >
                <option value="Free">Free</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={room.description}
                onChange={(e) =>
                  setRoom({ ...room, description: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 outline-none resize-none"
              />
            </div>
          </div>

          {/* FURNITURE */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-sky-900 mb-1">
              Assign Furniture
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {allFurniture.map((f) => {
                const checked = selectedFurniture.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`flex gap-3 p-3 rounded-xl border cursor-pointer
                    ${
                      checked
                        ? "bg-white border-sky-400"
                        : "bg-white/70 border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedFurniture([...selectedFurniture, f.id]);
                        else
                          setSelectedFurniture(
                            selectedFurniture.filter((id) => id !== f.id)
                          );
                      }}
                      className="accent-sky-600 mt-1"
                    />
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.type}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/dashboard/rooms")}
              className="px-5 py-2.5 rounded-lg border hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
            >
              Update Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
