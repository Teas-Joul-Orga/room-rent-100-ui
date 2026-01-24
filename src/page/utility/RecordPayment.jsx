import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RecordPayment() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tenantRoom: "",
    type: "",
    amount: "",
    method: "",
    date: "",
    note: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTransaction = {
      id: Date.now(),
      date: form.date,
      description: `${form.type} - ${form.tenantRoom}`,
      method: form.method,
      amount: form.amount,
    };

    const old = JSON.parse(localStorage.getItem("transactions")) || [];
    localStorage.setItem(
      "transactions",
      JSON.stringify([newTransaction, ...old])
    );

    navigate("/view-lease");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-xl font-semibold mb-6 text-sky-600">
        Record Rent Payment
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Tenant / Room */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Tenant / Room
          </label>
          <input
            name="tenantRoom"
            onChange={handleChange}
            placeholder="John - Room 101"
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          />
        </div>

        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Payment Type
          </label>
          <input
            name="type"
            onChange={handleChange}
            placeholder="Monthly Rent"
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Amount ($)
          </label>
          <input
            name="amount"
            type="number"
            onChange={handleChange}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Payment Method
          </label>
          <select
            name="method"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          >
            <option value="">Select Method</option>
            <option>Cash</option>
            <option>ABA</option>
            <option>Bank Transfer</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Date
          </label>
          <input
            name="date"
            type="date"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Note (Optional)
          </label>
          <input
            name="note"
            onChange={handleChange}
            placeholder="Extra note..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg border border-gray-300
              hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-sky-500 text-white
              hover:bg-sky-600 transition shadow"
          >
            Save Payment
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecordPayment;
