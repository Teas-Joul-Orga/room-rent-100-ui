import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Furniture() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [furniture, setFurniture] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [sortField, setSortField] = useState("name"); // name | condition
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc

  useEffect(() => {
    const savedFurniture = JSON.parse(localStorage.getItem("furniture")) || [];
    const savedRooms = JSON.parse(localStorage.getItem("rooms")) || [];

    const normalized = savedFurniture.map((f) => ({
      ...f,
      condition: f.condition || f.status || "Good",
    }));

    setFurniture(normalized);
    setRooms(savedRooms);
    localStorage.setItem("furniture", JSON.stringify(normalized));
  }, []);

  // count how many rooms use this furniture
  const countRooms = (furnitureId) => {
    return rooms.filter((r) => r.furniture?.includes(furnitureId)).length;
  };

  const filtered = [...furniture]
    .filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginated = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // ===== SINGLE DELETE =====
  const confirmDelete = () => {
    const updated = furniture.filter((f) => f.id !== selectedItem.id);
    setFurniture(updated);
    localStorage.setItem("furniture", JSON.stringify(updated));
    toast.success("Furniture deleted successfully");
    setShowModal(false);
    setSelectedItem(null);
  };
  //all checked box
  const allChecked =
    paginated.length > 0 && paginated.every((f) => selectedIds.includes(f.id));

  const toggleSelectAll = (checked) => {
    if (checked) {
      const newIds = paginated
        .map((f) => f.id)
        .filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newIds]);
    } else {
      setSelectedIds(
        selectedIds.filter((id) => !paginated.some((f) => f.id === id))
      );
    }
  };

  return (
    <div className="p-6 bg-sky-50 min-h-screen space-y-6">
      <Toaster position="top-right" />

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-sky-900">All Furniture</h2>
        <button
          onClick={() => navigate("/dashboard/furniture/addnewfurniture")}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          + Add New Furniture
        </button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search furniture by name..."
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

              {/* NAME SORT */}
              <th className="px-5 py-4 text-left w-[35%]">
                <button
                  onClick={() => {
                    setSortField("name");
                    setSortOrder(
                      sortField === "name" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="flex items-center gap-2 hover:text-sky-700"
                >
                  Name
                </button>
              </th>

              {/* CONDITION SORT */}
              <th className="px-5 py-4 text-left w-[20%]">
                <button
                  onClick={() => {
                    setSortField("condition");
                    setSortOrder(
                      sortField === "condition" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                  className="flex items-center gap-2 hover:text-sky-700"
                >
                  Condition
                  {sortField === "condition" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </button>
              </th>

              <th className="px-5 py-4 text-left w-[15%]">In Rooms</th>
              <th className="px-5 py-4 text-center w-[20%]">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((f) => (
              <tr
                key={f.id}
                className="bg-white hover:bg-sky-50 transition shadow-sm rounded-lg"
              >
                {/* CHECKBOX */}
                <td className="px-5 py-4 rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(f.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, f.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== f.id));
                      }
                    }}
                    className="w-4 h-4 accent-sky-600"
                  />
                </td>

                {/* NAME */}
                <td className="px-5 py-4 font-semibold text-slate-800">
                  {f.name}
                </td>

                {/* CONDITION */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-block px-4 py-1 text-xs font-semibold rounded-full
                ${
                  f.condition === "New"
                    ? "bg-blue-100 text-blue-700"
                    : f.condition === "Good"
                    ? "bg-green-100 text-green-700"
                    : f.condition === "Broken"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
                  >
                    {f.condition}
                  </span>
                </td>

                {/* IN ROOMS */}
                <td className="px-5 py-4 text-slate-700">
                  {countRooms(f.id)} room(s)
                </td>

                {/* ACTION */}
                <td className="px-5 py-4 rounded-r-lg">
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={() =>
                        navigate(`/dashboard/furniture/viewfurniture/${f.id}`)
                      }
                      className="px-3 py-1 text-xs rounded-md text-green-700 hover:bg-green-100 transition"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/dashboard/furniture/edit/${f.id}`)
                      }
                      className="px-3 py-1 text-xs rounded-md text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(f);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded-md text-red-700 hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-400">
                  No furniture found
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
                Delete Furniture
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
              selected furniture items?
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
                  const updated = furniture.filter(
                    (f) => !selectedIds.includes(f.id)
                  );
                  setFurniture(updated);
                  localStorage.setItem("furniture", JSON.stringify(updated));
                  setSelectedIds([]);
                  setShowBulkDelete(false);
                  toast.success("Selected furniture deleted");
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
