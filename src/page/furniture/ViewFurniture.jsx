import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewFurniture() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Available");

  // LOAD DATA
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("furniture")) || [];
    const found = data.find((f) => f.id === Number(id));

    if (found) {
      setPhoto(found.photo || "");
      setName(found.name);
      setType(found.type);
      setStatus(found.status || "Available");
    }
  }, [id]);

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
          {/* IMAGE */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Furniture Photo
            </label>

            <div className="relative block w-full max-w-md">
              <img
                src={
                  photo || "https://via.placeholder.com/600x350?text=No+Image"
                }
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

          {/* TYPE */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Furniture Type
            </label>
            <input
              value={type}
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
              value={status}
              readOnly
              className={`w-full px-4 py-2.5 rounded-lg border font-medium
                ${
                  status === "Available"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : status === "Broken"
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
