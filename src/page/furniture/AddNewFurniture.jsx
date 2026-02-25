import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function AddNewFurniture() {
  const navigate = useNavigate();
  const { id } = useParams(); // 'id' here is actually the uid from the route
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [condition, setCondition] = useState("Good");
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchItem = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:8000/api/v1/admin/furniture/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          });
          const data = await res.json();
          if (res.ok) {
            setName(data.name || "");
            setCondition(data.condition || "Good");
          } else {
            toast.error("Failed to load furniture data");
          }
        } catch (e) {
          toast.error("Network error");
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }
  }, [id, isEdit]);

  // ===== SAVE =====
  const handleSave = async (e) => {
    e.preventDefault();

    if (!name) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name,
      condition,
    };

    try {
      const token = localStorage.getItem("token");
      const url = isEdit
        ? `http://localhost:8000/api/v1/admin/furniture/${id}`
        : `http://localhost:8000/api/v1/admin/furniture`;
      
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(isEdit ? "Furniture updated successfully" : "Furniture added successfully");
        setTimeout(() => navigate("/dashboard/furniture"), 1000);
      } else {
        toast.error(data.message || "Failed to save furniture");
        if (data.errors) {
            console.error(data.errors);
        }
      }
    } catch(e) {
      toast.error("Network error saving furniture");
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

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
