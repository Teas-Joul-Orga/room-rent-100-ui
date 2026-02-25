import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddBill() {
  const navigate = useNavigate();

  const [leases] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("leases")) || [];
    return saved.filter((l) => l.status === "Active");
  });

  const [form, setForm] = useState({
    leaseId: "",
    billType: "Water",
    otherDesc: "",
    amount: "",
    dueDate: "",
    status: "Unpaid",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.leaseId || !form.amount || !form.dueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.billType === "Other" && !form.otherDesc.trim()) {
      toast.error("Please enter bill description");
      return;
    }

    const description =
      form.billType === "Other" ? form.otherDesc : form.billType;

    const newBill = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate,
      description,
      amount: Number(form.amount),
      method: "Utility Bill",
      status: form.status,
    };

    const allLeases = JSON.parse(localStorage.getItem("leases")) || [];

    const updated = allLeases.map((l) => {
      if (l.id === Number(form.leaseId)) {
        return {
          ...l,
          bills:
            form.status === "Unpaid"
              ? [...(l.bills || []), newBill]
              : l.bills || [],
          transactions:
            form.status === "Paid"
              ? [...(l.transactions || []), newBill]
              : l.transactions || [],
        };
      }
      return l;
    });

    localStorage.setItem("leases", JSON.stringify(updated));
    toast.success("Bill saved successfully");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-sky-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">
          Add Utility Bill
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* SELECT LEASE */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tenant / Room (Active Lease)
              </label>
              <select
                name="leaseId"
                value={form.leaseId}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">-- Select --</option>
                {leases.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenant} - {l.room}
                  </option>
                ))}
              </select>
            </div>

            {/* BILL TYPE */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Bill Type
              </label>
              <select
                name="billType"
                value={form.billType}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* OTHER DESC */}
            {form.billType === "Other" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="otherDesc"
                  value={form.otherDesc}
                  onChange={handleChange}
                  placeholder="Enter description..."
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* AMOUNT */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* DUE DATE */}
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* BUTTON ROW */}
          <div className="md:col-span-2 flex justify-end gap-4 pt-6 border-t mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg border hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-8 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow"
            >
              Save Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
