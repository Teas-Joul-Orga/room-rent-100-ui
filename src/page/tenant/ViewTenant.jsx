import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ViewTenant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const location = useLocation();
  const tenantEmail = location.state?.email || "";
  const tenantId = location.state?.id || ""; // make sure ViewTenant passes the id

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMismatch = confirmPassword && newPassword !== confirmPassword;

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("tenants")) || [];
    const normalizedList = list.map((t) => ({
      id: t.id || 0,
      name: t.name || "Unknown",
      email: t.email || "Not provided",
      phone: t.phone || "Not provided",
      occupation: t.occupation || t.job || "Not specified",
      dob: t.dob || "Not specified",
      photo: t.photo || "https://via.placeholder.com/150",
      status: t.status || "Pending",
      idFront: t.idFront || "https://via.placeholder.com/300x200",
      idBack: t.idBack || "https://via.placeholder.com/300x200",
    }));

    const found = normalizedList.find((t) => t.id === Number(id));
    setTenant(found);
  }, [id]);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (isMismatch) return;

    setLoading(true);

    setTimeout(() => {
      const tenants = JSON.parse(localStorage.getItem("tenants")) || [];
      const updated = tenants.map((t) =>
        t.email === tenant.email
          ? { ...t, account: { password: newPassword }, status: "Linked" }
          : t,
      );
      localStorage.setItem("tenants", JSON.stringify(updated));
      setLoading(false);
      setShowPasswordModal(false);
    }, 700);
  };

  if (!tenant) return <p className="p-6 text-gray-500">Tenant not found.</p>;

  return (
    <div className="p-6 bg-sky-50 min-h-screen space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-sky-900">Tenant Detail</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-sky-100 transition"
        >
          ← Back
        </button>
      </div>

      {/* ===== PROFILE CARD ===== */}
      <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <img
              src={tenant.photo}
              alt="Tenant"
              className="w-32 h-32 rounded-full object-cover border-4 border-sky-200"
            />
            <span
              className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white
              ${tenant.status === "Linked" ? "bg-green-500" : "bg-yellow-400"}`}
            ></span>
          </div>

          <h3 className="text-xl font-bold">{tenant.name}</h3>

          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold
            ${
              tenant.status === "Linked"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {tenant.status === "Linked" ? "Account Linked" : "Pending"}
          </span>
        </div>

        {/* RIGHT */}
        <div className="md:col-span-2 space-y-4">
          {/* ACTION BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h4 className="text-lg font-semibold text-gray-800">
              Tenant Information
            </h4>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
            >
              <CiEdit />
              Change Password
            </button>
          </div>

          {/* INFO GRID — 3 CARDS FIRST ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Info label="Email" value={tenant.email} />
            <Info label="Phone" value={tenant.phone} />
            <Info label="Job / Occupation" value={tenant.occupation} />

            <Info label="Date of Birth" value={tenant.dob} />

            {/* ID CARD */}
            <div
              onClick={() => setShowIdModal(true)}
              className="cursor-pointer p-4 rounded-xl border bg-sky-50 hover:bg-sky-100 transition"
            >
              <p className="text-sm text-gray-500">ID Card</p>
              <p className="font-semibold text-sky-700">View ID Images →</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LEASE HISTORY ===== */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Lease History</h4>
          <button
            onClick={() =>
              navigate(`/dashboard/tenants/createlease`, {
                state: { id: tenant.id, email: tenant.email },
              })
            }
            className="px-4 py-2 rounded-lg bg-green-600 text-white"
          >
            + Create New Lease
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Rent</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-400">
                  No lease history for this tenant.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== ID MODAL ===== */}
      <AnimatePresence>
        {showIdModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowIdModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-center">ID Card</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <img
                  src={tenant.idFront}
                  alt="ID Front"
                  className="rounded-lg border"
                />
                <img
                  src={tenant.idBack}
                  alt="ID Back"
                  className="rounded-lg border"
                />
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowIdModal(false)}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-sky-900 text-center mb-6">
                Change Tenant Password
              </h2>

              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                onSubmit={(e) => handleUpdatePassword(e)}
              >
                {/* EMAIL */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-600 mb-1">
                    Tenant Email
                  </label>
                  <input
                    type="email"
                    value={tenant.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 cursor-not-allowed"
                  />
                </div>

                {/* PASSWORDS */}
                <div className="flex flex-col gap-4">
                  {/* New Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      New Password
                    </label>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-9 text-slate-500 hover:text-sky-600"
                    >
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isMismatch ? "text-red-500" : "text-slate-600"
                      }`}
                    >
                      {isMismatch
                        ? "Passwords do not match"
                        : "Confirm Password"}
                    </label>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full px-4 py-2.5 pr-11 rounded-lg border focus:ring-2 outline-none
                  ${
                    isMismatch
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:ring-sky-400 focus:border-sky-400"
                  }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-9 text-slate-500 hover:text-sky-600"
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition font-medium disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading || isMismatch}
                      className="flex-1 py-2.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition font-medium disabled:opacity-60"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Small reusable info box */
function Info({ label, value }) {
  return (
    <div className="p-4 rounded-xl border bg-white">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}
