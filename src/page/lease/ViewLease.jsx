import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ViewLease() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lease, setLease] = useState(null);
  // const [transactions, setTransactions] = useState([]);

  // ===== LOAD LEASE =====
  useEffect(() => {
    const leases = JSON.parse(localStorage.getItem("leases")) || [];
    const found = leases.find((l) => l.id === Number(id));
    setLease(found);
  }, [id]);
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("transactions")) || [];
    setTransactions(data);
  }, []);

  if (!lease) return null;
  const pendingBills = lease.bills || [];
  const transactions = lease.transactions || [];

  // ===== RECORD RENT PAYMENT =====
  const recordRentPayment = () => {
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      description: "Monthly Rent Payment",
      method: "Cash",
      amount: lease.rent,
      status: "Paid",
    };

    const leases = JSON.parse(localStorage.getItem("leases")) || [];

    const updated = leases.map((l) => {
      if (l.id === lease.id) {
        return {
          ...l,
          transactions: [...(l.transactions || []), newTx],
        };
      }
      return l;
    });

    localStorage.setItem("leases", JSON.stringify(updated));
    setLease(updated.find((l) => l.id === lease.id));

    toast.success("Rent payment recorded");
  };

  return (
    <div className="min-h-screen bg-sky-50 p-6 space-y-6">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-900">Lease Details</h2>

        <button
          onClick={() => navigate(`/dashboard/lease/edit/${lease.id}`)}
          className="bg-sky-500/75 text-white px-5 py-2 rounded-lg shadow"
        >
          Edit Lease
        </button>
      </div>

      {/* ===== LEASE SUMMARY CARD ===== */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {/* TENANT */}
          <div>
            <p className="text-sm text-slate-500">Tenant</p>
            <p className="text-lg font-semibold text-slate-800 mt-1">
              {lease.tenant}
            </p>
          </div>

          {/* ROOM */}
          <div className="sm:border-l sm:border-r border-slate-200 px-4">
            <p className="text-sm text-slate-500">Room</p>
            <p className="text-lg font-semibold text-slate-800 mt-1">
              {lease.room}
            </p>
          </div>

          {/* RENT */}
          <div>
            <p className="text-sm text-slate-500">Monthly Rent</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              ${lease.rent}
            </p>
          </div>
        </div>
      </div>

      {/* ===== ACTION CARDS ===== */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PENDING BILLS */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Pending Utility Bills
            </h3>

            <button
              onClick={() => navigate(`/dashboard/utility/addbill`)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm"
            >
              + Add Bill
            </button>
          </div>

          {/* BILLS LIST */}
          {pendingBills.length === 0 ? (
            <div className="bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-4 py-3 text-sm text-center">
              No pending utility bill
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBills.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between items-center border rounded-lg px-4 py-2"
                >
                  <div>
                    <p className="font-medium">{b.description}</p>
                    <p className="text-xs text-gray-500">Due: {b.dueDate}</p>
                  </div>

                  <div className="flex flex-col items-start gap-1">
                    <p className="font-semibold text-red-600 text-sm">
                      ${b.amount}
                    </p>

                    {/* PAY NOW BUTTON BELOW PRICE */}
                    <button
                      onClick={() => payBill(b.id)}
                      className="bg-sky-500 text-white px-3 py-1 rounded-lg text-xs"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECORD PAYMENT */}
        <div className="bg-white rounded-xl shadow p-6 space-y-3 text-center">
          <h3 className="text-lg font-semibold text-slate-800">
            Record Payment
          </h3>
          <button
            // onClick={recordRentPayment}
            onClick={() => navigate(`/dashboard/utility/recordpayment`)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Record Rent Payment (${lease.rent})
          </button>
        </div>
      </div>

      {/* ===== TRANSACTION HISTORY ===== */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow overflow-x-auto">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-slate-800">
            Transaction History
          </h3>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-sky-100 text-sky-900">
            <tr>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Description</th>
              <th className="px-5 py-3 text-left">Method</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-5 py-3">{t.date}</td>
                <td className="px-5 py-3">{t.description}</td>
                <td className="px-5 py-3">{t.method}</td>
                <td className="px-5 py-3 text-right font-semibold">
                  ${t.amount}
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-400">
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
