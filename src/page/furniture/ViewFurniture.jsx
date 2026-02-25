import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ViewFurniture() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    const fetchFurniture = async () => {
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
          setName(data.name || "Unknown");
          setCondition(data.condition || "Unknown");
        } else {
          toast.error("Failed to fetch furniture details");
        }
      } catch (e) {
        toast.error("Network error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFurniture();
  }, [id]);

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 min-h-screen bg-sky-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-sky-900 mb-1 text-center">
          Furniture Details
        </h2>
        <p className="text-center text-slate-500 mb-8">
          View furniture information
        </p>

        <div className="grid grid-cols-1 gap-6">
          {/* IMAGE PLACEHOLDER (API DOES NOT TRACK THIS YET) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Furniture Photo
            </label>

            <div className="relative block w-full max-w-md">
              <img
                src="https://via.placeholder.com/600x350?text=No+Image"
                alt="furniture"
                className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm"
              />
            </div>
          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Furniture Name
            </label>
            <input
              value={name}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-700"
            />
          </div>



          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Condition
            </label>
            <input
              value={condition}
              readOnly
              className={`w-full px-4 py-2.5 rounded-lg border font-medium
                ${
                  condition === "New" || condition === "Good"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : condition === "Broken"
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-yellow-50 border-yellow-300 text-yellow-700"
                }`}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              onClick={() => navigate("/dashboard/furniture")}
              className="px-5 py-2 rounded-lg border hover:bg-gray-100"
            >
              Back
            </button>

            <button
              onClick={() => navigate(`/dashboard/furniture/edit/${id}`)}
              className="px-6 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow"
            >
              Edit Furniture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
