import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function AddNewFurniture() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [condition, setCondition] = useState("Good"); // ✅ use condition

  // ===== LOAD DATA IF EDIT =====
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("furniture")) || [];

    // normalize old data: status -> condition
    const normalized = data.map((f) => ({
      ...f,
      condition: f.condition || f.status || "Good",
    }));
    localStorage.setItem("furniture", JSON.stringify(normalized));

    if (isEdit) {
      const found = normalized.find((f) => f.id === Number(id));
      if (found) {
        setPhoto(found.photo || "");
        setName(found.name || "");
        setType(found.type || "");
        setCondition(found.condition || "Good");
      }
    } else {
      // RESET WHEN ADD MODE
      setPhoto("");
      setName("");
      setType("");
      setCondition("Good");
    }
  }, [id, isEdit]);

  // ===== IMAGE UPLOAD =====
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  // ===== SAVE =====
  const handleSave = (e) => {
    e.preventDefault();

    if (!name || !type) {
      toast.error("Please fill all required fields");
      return;
    }

    const data = JSON.parse(localStorage.getItem("furniture")) || [];

    if (isEdit) {
      const updated = data.map((f) =>
        f.id === Number(id) ? { ...f, photo, name, type, condition } : f
      );
      localStorage.setItem("furniture", JSON.stringify(updated));
      toast.success("Furniture updated successfully");
    } else {
      const newItem = {
        id: Date.now(),
        photo,
        name,
        type,
        condition,
        createdAt: new Date(),
      };
      localStorage.setItem("furniture", JSON.stringify([...data, newItem]));
      toast.success("Furniture added successfully");
    }

    setTimeout(() => navigate("/dashboard/furniture"), 500);
  };

  return (
    <div className="p-6 min-h-screen bg-sky-50">
      <Toaster position="top-right" />

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-sky-900 mb-1 text-center">
          {isEdit ? "Edit Furniture" : "Add New Furniture"}
        </h2>
        <p className="text-center text-slate-500 mb-8">
          Enter furniture details below
        </p>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6">
          {/* IMAGE */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Furniture Photo
            </label>

            <label className="relative block w-full max-w-md cursor-pointer group">
              <img
                src={
                  photo ||
                  "https://mocra.org/wp-content/uploads/2016/07/default.jpg"
                }
                alt="furniture"
                className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm"
              />

              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-sm font-medium">
                  Change Photo
                </span>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Furniture Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bed, Table, Chair"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
              required
            />
          </div>

          {/* TYPE */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Furniture Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
              required
            >
              <option value="">Select type</option>
              <option value="Wood">Wood</option>
              <option value="Metal">Metal</option>
              <option value="Plastic">Plastic</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          {/* CONDITION */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Broken">Broken</option>
            </select>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/furniture")}
              className="px-5 py-2 rounded-lg border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow"
            >
              {isEdit ? "Update Furniture" : "Save Furniture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
