import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function AddNewRoom() {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [status, setStatus] = useState("Free");

  const [allFurniture] = useState(() => {
    return JSON.parse(localStorage.getItem("furniture")) || [];
  });
  const [selectedFurniture, setSelectedFurniture] = useState([]);



  const handleSave = (e) => {
    e.preventDefault();

    if (!name || !rent) {
      toast.error("Room name and rent are required");
      return;
    }

    const rooms = JSON.parse(localStorage.getItem("rooms")) || [];

    rooms.push({
      id: Date.now(),
      photo: photos.length > 0 ? photos[0] : "https://via.placeholder.com/300",
      name,
      description,
      rent,
      status,
      furniture: selectedFurniture,
      createdAt: new Date(),
    });

    localStorage.setItem("rooms", JSON.stringify(rooms));
    toast.success("Room added successfully");
    setTimeout(() => navigate("/dashboard/rooms"), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-6">
      <Toaster />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sky-900">Add New Room</h2>
          <p className="text-sm text-slate-500">
            Fill room details and assign furniture
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* ROOM INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ROOM IMAGE GALLERY */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Room Photos (max 3)
              </label>

              {/* GALLERY GRID */}
              <div className="grid grid-cols-3 gap-4">
                {/* EXISTING PHOTOS */}
                {photos.map((img, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border"
                  >
                    <img
                      src={img}
                      alt="room"
                      className="w-full h-32 object-cover"
                    />

                    {/* REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos(photos.filter((_, i) => i !== index))
                      }
                      className="absolute top-2 right-2 bg-black/60 text-white
          w-7 h-7 rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* ADD MORE */}
                {photos.length < 3 && (
                  <label
                    className="flex flex-col items-center justify-center h-32
        border-2 border-dashed rounded-xl cursor-pointer
        hover:bg-sky-50 transition text-slate-400"
                  >
                    <span className="text-2xl">＋</span>
                    <span className="text-xs">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        files.forEach((file) => {
                          if (photos.length < 3) {
                            const reader = new FileReader();
                            reader.onloadend = () =>
                              setPhotos((prev) => [...prev, reader.result]);
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Upload up to 3 photos of the room
              </p>
            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Room Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Room A1"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </div>

            {/* RENT */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Base Rent ($) *
              </label>
              <input
                type="number"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                focus:ring-2 focus:ring-sky-400 outline-none"
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                focus:ring-2 focus:ring-sky-400 outline-none"
              >
                <option value="Free">Free</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Room near window, good ventilation..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300
                focus:ring-2 focus:ring-sky-400 outline-none resize-none"
              />
            </div>
          </div>

          {/* FURNITURE */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-sky-900 mb-1">
              Assign Furniture
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Select furniture available in this room
            </p>

            {allFurniture.length === 0 ? (
              <p className="text-sm text-gray-400">No furniture available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allFurniture.map((f) => {
                  const checked = selectedFurniture.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition
                      ${
                        checked
                          ? "bg-white border-sky-400 shadow-sm"
                          : "bg-white/60 border-slate-200 hover:border-sky-300"
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
                        className="accent-sky-600"
                      />
                      <div>
                        <p className="font-medium text-slate-700">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.type}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/dashboard/rooms")}
              className="px-5 py-2.5 rounded-lg border border-slate-300
              text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-sky-600 text-white
              hover:bg-sky-700 transition shadow-md"
            >
              Save Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
