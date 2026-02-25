import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function CreateNewLease() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [tenant, setTenant] = useState(() => {
    if (!isEdit) return "";
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    return found ? found.tenant : "";
  });
  const [room, setRoom] = useState(() => {
    if (!isEdit) return "";
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    return found ? found.room : "";
  });
  const [rent, setRent] = useState(() => {
    if (!isEdit) return "";
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    return found ? found.rent : "";
  });
  const [startDate, setStartDate] = useState(() => {
    if (!isEdit) return "";
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    return found ? found.startDate : "";
  });
  const [endDate, setEndDate] = useState(() => {
    if (!isEdit) return "";
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    return found ? found.endDate : "";
  });
  const today = new Date().toISOString().split("T")[0];
  const status = (startDate && endDate && today >= startDate && today <= endDate) ? "Active" : "Inactive";

  const [rooms] = useState(() => {
    return JSON.parse(localStorage.getItem("rooms")) || [];
  });

  // ===== SAVE =====
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tenant || !room || !rent || !startDate || !endDate) {
      toast.error("Please fill all fields");
      return;
    }

    const leases = JSON.parse(localStorage.getItem("leases")) || [];

    if (isEdit) {
      const updated = leases.map((l) =>
        l.id === Number(id)
          ? { ...l, tenant, room, rent, startDate, endDate, status }
          : l
      );
      localStorage.setItem("leases", JSON.stringify(updated));
      toast.success("Lease updated");
    } else {
      const newLease = {
        id: Date.now(),
        tenant,
        room,
        rent,
        startDate,
        endDate,
        status,
      };
      localStorage.setItem("lease", JSON.stringify([...leases, newLease]));
      toast.success("Lease added");
    }

    navigate("/dashboard/lease");
  };

  return (
    <div className="min-h-screen bg-sky-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-sky-900 text-center">
          {isEdit ? "Edit Lease" : "Add Lease"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TENANT */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tenant Name
            </label>
            <input
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Enter tenant name"
            />
          </div>

          {/* ROOM */}
          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">-- Select Room --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* RENT */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Rent
            </label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          {/* DATES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              value={status}
              disabled
              className="w-full bg-gray-100 border rounded-lg px-4 py-2 text-gray-600"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="border px-5 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
            >
              {isEdit ? "Update Lease" : "Save Lease"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
