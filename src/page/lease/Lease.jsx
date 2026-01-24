import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Leases() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [leases, setLeases] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [sortField, setSortField] = useState("tenant"); // tenant | status
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  // ===== LOAD DATA =====
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("leases")) || [];

    const normalized = saved.map((l) => ({
      ...l,
      status: l.status || "Active",
    }));

    setLeases(normalized);
    localStorage.setItem("leases", JSON.stringify(normalized));
  }, []);

  // ===== FILTER + SORT =====
  const filtered = [...leases]
    .filter(
      (l) =>
        l.tenant?.toLowerCase().includes(search.trim().toLowerCase()) ||
        l.room?.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // ===== PAGINATION =====
  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // ===== SELECT ALL =====
  const allChecked =
    paginated.length > 0 && paginated.every((l) => selectedIds.includes(l.id));

  const toggleSelectAll = (checked) => {
    if (checked) {
      const newIds = paginated
        .map((l) => l.id)
        .filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newIds]);
    } else {
      setSelectedIds(
        selectedIds.filter((id) => !paginated.some((l) => l.id === id))
      );
    }
  };

  // ===== SINGLE DELETE =====
  const confirmDelete = () => {
    const updated = leases.filter((l) => l.id !== selectedItem.id);
    setLeases(updated);
    localStorage.setItem("leases", JSON.stringify(updated));
    toast.success("Lease deleted successfully");
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6 bg-sky-50 min-h-screen space-y-6">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-sky-900">All Leases</h2>
        <button
          onClick={() => navigate("/dashboard/lease/createnewlease")}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          + Add New Lease
        </button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search by tenant or room..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full border border-sky-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead className="bg-sky-100 text-sky-900">
            <tr>
              {/* SELECT ALL */}
              <th className="px-5 py-4 text-left w-[60px]">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
              </th>

              {/* TENANT SORT */}
              <th className="px-5 py-4 text-left w-[25%]">
                <button
                  onClick={() => {
                    setSortField("tenant");
                    setSortOrder(
                      sortField === "tenant" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="hover:text-sky-700"
                >
                  Tenant
                </button>
              </th>

              <th className="px-5 py-4 text-left w-[20%]">Room</th>

              <th className="px-5 py-4 text-left w-[20%]">Duration</th>

              <th className="px-5 py-4 text-left w-[15%]">Rent</th>

              {/* STATUS SORT */}
              <th className="px-5 py-4 text-left w-[10%]">
                <button
                  onClick={() => {
                    setSortField("status");
                    setSortOrder(
                      sortField === "status" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="hover:text-sky-700"
                >
                  Status
                </button>
              </th>

              <th className="px-5 py-4 text-center w-[15%]">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((l) => (
              <tr
                key={l.id}
                className="bg-white hover:bg-sky-50 transition shadow-sm rounded-lg"
              >
                {/* CHECKBOX */}
                <td className="px-5 py-4 rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(l.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, l.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== l.id));
                      }
                    }}
                    className="w-4 h-4 accent-sky-600"
                  />
                </td>

                {/* TENANT */}
                <td className="px-5 py-4 font-semibold text-slate-800">
                  {l.tenant}
                </td>

                {/* ROOM */}
                <td className="px-5 py-4">{l.room}</td>

                {/* DURATION */}
                <td className="px-5 py-4 text-xs text-slate-600">
                  {l.startDate} → {l.endDate}
                </td>

                {/* RENT */}
                <td className="px-5 py-4 font-medium text-slate-800">
                  ${l.rent}
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full
                      ${
                        l.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                  >
                    {l.status}
                  </span>
                </td>

                {/* ACTION */}
                <td className="px-5 py-4 rounded-r-lg">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/lease/view/${l.id}`)}
                      className="px-3 py-1 text-xs rounded-md text-green-700 hover:bg-green-100"
                    >
                      View
                    </button>

                    <button
                      onClick={() => navigate(`/dashboard/lease/edit/${l.id}`)}
                      className="px-3 py-1 text-xs rounded-md text-indigo-700 hover:bg-indigo-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(l);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded-md text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-400">
                  No leases found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* BULK DELETE */}
        {selectedIds.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => setShowBulkDelete(true)}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
            >
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          Show
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
          entries
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded border disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                currentPage === i + 1 ? "bg-sky-600 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* ===== DELETE MODAL ===== */}
      <AnimatePresence>
        {showModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              <h3 className="text-xl font-bold mb-3">Delete Lease</h3>
              <p className="mb-4">
                Delete lease for <b>{selectedItem.tenant}</b>?
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BULK DELETE MODAL ===== */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
            <p className="mb-5">
              Delete <b>{selectedIds.length}</b> selected leases?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const updated = leases.filter(
                    (l) => !selectedIds.includes(l.id)
                  );
                  setLeases(updated);
                  localStorage.setItem("leases", JSON.stringify(updated));
                  setSelectedIds([]);
                  setShowBulkDelete(false);
                  toast.success("Selected leases deleted");
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
