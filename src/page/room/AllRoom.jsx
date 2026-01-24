import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function AllRoom() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rooms")) || [];
    const sorted = [...saved].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setRooms(sorted);
  }, []);

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // Single delete
  const confirmDelete = () => {
    const updated = rooms.filter((r) => r.id !== selectedItem.id);
    setRooms(updated);
    localStorage.setItem("rooms", JSON.stringify(updated));
    toast.success("Room deleted successfully");
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6 bg-sky-50 min-h-screen space-y-6">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-sky-900">All Rooms</h2>
        <button
          onClick={() => navigate("/dashboard/rooms/add")}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          + Add New Room
        </button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search room..."
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
        <table className="w-full text-sm">
          <thead className="bg-sky-100 text-sky-900">
            <tr>
              <th className="px-4 py-3 text-left">Check Box</th>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">Room</th>
              <th className="px-4 py-3 text-left">Base Rent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginated.map((r, index) => (
              <tr key={r.id} className="hover:bg-sky-50 transition">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, r.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== r.id));
                      }
                    }}
                  />
                </td>

                {/* PHOTO */}
                <td className="px-4 py-3">
                  <img
                    src={r.photo || "https://via.placeholder.com/80"}
                    alt="room"
                    className="w-14 h-14 object-cover rounded-lg border"
                  />
                </td>

                {/* NAME */}
                <td className="px-4 py-3 font-medium text-slate-800">
                  {r.name}
                </td>

                {/* RENT */}
                <td className="px-4 py-3 text-slate-700">${r.rent}</td>

                {/* STATUS */}
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      r.status === "Occupied"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>

                {/* ACTION */}
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() =>
                        navigate(`/dashboard/rooms/viewroom/${r.id}`)
                      }
                      className="px-3 py-1 text-xs rounded-full text-green-600 hover:bg-green-600 hover:text-white transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/rooms/edit/${r.id}`)}
                      className="px-3 py-1 text-xs rounded-full text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(r);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded-full text-red-600 hover:bg-red-600 hover:text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400">
                  No rooms found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bulk Delete */}
        {selectedIds.length > 0 && (
          <button
            onClick={() => setShowBulkDelete(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg mt-2 hover:bg-red-700"
          >
            Delete Selected ({selectedIds.length})
          </button>
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

      {/* ===== SINGLE DELETE MODAL ===== */}
      <AnimatePresence>
        {showModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Delete Room
              </h3>

              <p className="text-gray-700 mb-1">
                Are you sure you want to delete
              </p>
              <p className="font-semibold mb-4">{selectedItem.name}?</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Confirm Delete
            </h3>

            <p className="text-slate-600 mb-5">
              Are you sure you want to delete <b>{selectedIds.length}</b>{" "}
              selected rooms? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="px-4 py-2 rounded-lg border hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const updated = rooms.filter(
                    (r) => !selectedIds.includes(r.id)
                  );
                  setRooms(updated);
                  localStorage.setItem("rooms", JSON.stringify(updated));
                  setSelectedIds([]);
                  setShowBulkDelete(false);
                  toast.success("Selected rooms deleted");
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
