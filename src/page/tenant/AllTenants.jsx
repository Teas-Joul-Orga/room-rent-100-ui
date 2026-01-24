import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function AllTenants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // create account modal
  // const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTenant, setAccountTenant] = useState(null);

  // bulk delete
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("tenants")) || [];
    const sorted = [...saved].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    setTenants(sorted);
  }, []);

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const paginatedTenants = filteredTenants.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);

  const confirmDelete = () => {
    const updated = tenants.filter((t) => t.id !== selectedTenant.id);
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setSelectedIds((prev) => prev.filter((id) => id !== selectedTenant.id));
    setShowModal(false);
    setSelectedTenant(null);
  };

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    job: "",
    photo: "",
    idFront: "",
    idBack: "",
  });

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;

    const updated = tenants.filter((t) => !selectedIds.includes(t.id));
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setSelectedIds([]);
  };

  const handleSaveTenant = () => {
    let updated;

    if (isEdit && selectedTenant) {
      updated = tenants.map((t) =>
        t.id === selectedTenant.id
          ? {
              ...t,
              name: form.name,
              email: form.email,
              phone: form.phone,
              dob: form.dob,
              job: form.job,
              occupation: form.job,
              photo: form.photo || t.photo,
              idFront: form.idFront || t.idFront,
              idBack: form.idBack || t.idBack,
            }
          : t,
      );
    } else {
      const newTenant = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        job: form.job,
        occupation: form.job,
        photo: form.photo || "/avatar.png",
        idFront: form.idFront || "",
        idBack: form.idBack || "",

        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      updated = [newTenant, ...tenants];
    }

    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setShowFormModal(false);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;

    setForm((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  const handleSubmitTenant = () => {
    const newTenant = {
      id: Date.now(),
      ...form,
      status: "Pending",
      createdAt: new Date(),
    };

    const updated = [newTenant, ...tenants];
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setShowFormModal(false);
  };

  return (
    <div className="p-6 space-y-6 bg-sky-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-sky-900">Tenants Management</h2>

        <button
          onClick={() => {
            setIsEdit(false);
            setSelectedTenant(null);
            setForm({
              name: "",
              email: "",
              phone: "",
              dob: "",
              job: "",
              photo: "",
              idFront: "",
              idBack: "",
            });
            setShowFormModal(true);
          }}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          + Add New Tenant
        </button>
      </div>
      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Tenants</p>
            <h3 className="text-2xl font-bold text-sky-700">
              {tenants.length}
            </h3>
          </div>
          <span className="text-3xl">👥</span>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Pending Accounts</p>
            <h3 className="text-2xl font-bold text-yellow-600">
              {tenants.filter((t) => t.status === "Pending").length}
            </h3>
          </div>
          <span className="text-3xl">⏳</span>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Linked Accounts</p>
            <h3 className="text-2xl font-bold text-green-600">
              {tenants.filter((t) => t.status !== "Pending").length}
            </h3>
          </div>
          <span className="text-3xl">✅</span>
        </div>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search tenant name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-sky-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {selectedIds.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={deleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}

        <table className="w-full text-sm text-left">
          <thead className="bg-sky-100 text-sky-900">
            <tr>
              <th className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedTenants.length > 0 &&
                    paginatedTenants.every((t) => selectedIds.includes(t.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(paginatedTenants.map((t) => t.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </th>

              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Date of Birth</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedTenants.map((t, index) => (
              <tr key={t.id} className="hover:bg-sky-50 transition">
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds((prev) => [...prev, t.id]);
                      } else {
                        setSelectedIds((prev) =>
                          prev.filter((id) => id !== t.id),
                        );
                      }
                    }}
                  />
                </td>

                <td className="px-4 py-3">
                  <img
                    src={t.photo}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                </td>

                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.email}</td>
                <td className="px-4 py-3">{t.phone}</td>
                <td className="px-4 py-3">{t.occupation || t.job}</td>
                <td className="px-4 py-3">{t.dob || "N/A"}</td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        t.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                  >
                    {t.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    {t.status === "Pending" ? (
                      <button
                        onClick={() => {
                          setSelectedTenant(t);
                          setShowAccountModal(true);
                        }}
                        className="px-3 py-1 text-xs rounded-full border border-green-600 bg-green-600 text-white transition cursor-pointer"
                      >
                        Link Account
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/tenants/view/${t.id}`)
                        }
                        className="px-3 py-1 rounded-full text-green-600 transition cursor-pointer"
                      >
                        View
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsEdit(true);
                        setSelectedTenant(t);
                        setForm({
                          name: t.name || "",
                          email: t.email || "",
                          phone: t.phone || "",
                          dob: t.dob || "",
                          job: t.occupation || t.job || "",
                          photo: t.photo || "",
                          idFront: t.idFront || "",
                          idBack: t.idBack || "",
                        });
                        setShowFormModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded-full text-indigo-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTenant(t);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 text-xs rounded-full text-red-700 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredTenants.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-400">
                  No tenants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
              className={`px-3 py-1 rounded border
          ${currentPage === i + 1 ? "bg-sky-600 text-white" : ""}`}
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

      {/* ===== DELETE MODAL (CENTERED DESIGN) ===== */}
      <AnimatePresence>
        {showModal && selectedTenant && (
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
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              {/* ICON */}
              <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl">
                ⚠
              </div>

              {/* TITLE */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Tenant
              </h3>

              {/* BODY */}
              <img
                src={selectedTenant.photo}
                alt="avatar"
                className="w-20 h-20 mx-auto rounded-full object-cover border mb-3"
                onError={(e) => (e.target.src = "/avatar.png")}
              />

              <p className="text-gray-700">Are you sure you want to delete</p>
              <p className="font-semibold text-gray-900 mb-2">
                {selectedTenant.name}
              </p>

              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone.
              </p>

              {/* BUTTONS */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFormModal && (
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
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold text-sky-900 text-center mb-6">
                {isEdit ? "Edit Tenant" : "Add New Tenant"}
              </h2>

              {/* ===== FORM ===== */}
              <div className="space-y-6">
                {/* BASIC INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ModalInput
                    label="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />

                  <ModalInput
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />

                  <ModalInput
                    label="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />

                  <ModalInput
                    label="Occupation"
                    value={form.job}
                    onChange={(e) => setForm({ ...form, job: e.target.value })}
                  />

                  <ModalInput
                    label="Date of Birth"
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>

                {/* IMAGE UPLOAD (DESIGN ONLY) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ImageInput
                    label="Tenant Photo"
                    value={form.photo}
                    onChange={(img) => setForm({ ...form, photo: img })}
                  />

                  <ImageInput
                    label="ID Card (Front)"
                    value={form.idFront}
                    onChange={(img) => setForm({ ...form, idFront: img })}
                  />

                  <ImageInput
                    label="ID Card (Back)"
                    value={form.idBack}
                    onChange={(img) => setForm({ ...form, idBack: img })}
                  />
                </div>

                {/* BUTTONS */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowFormModal(false)}
                    className="px-6 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSubmitTenant}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-2 rounded-xl font-semibold shadow"
                  >
                    {isEdit ? "Update Tenant" : "Save Tenant"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountModal && selectedTenant && (
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
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
                🔗
              </div>

              <h3 className="text-xl font-bold mb-2">Link Account</h3>

              <p className="text-gray-600 mb-4">
                Create login account for <b>{selectedTenant.name}</b>
              </p>

              <input
                placeholder="Email"
                className="w-full border rounded-lg px-3 py-2 mb-3"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded-lg px-3 py-2 mb-4"
              />

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="px-5 py-2 rounded-lg border"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    const updated = tenants.map((t) =>
                      t.id === selectedTenant.id
                        ? { ...t, status: "Active" }
                        : t,
                    );

                    setTenants(updated);
                    localStorage.setItem("tenants", JSON.stringify(updated));
                    setShowAccountModal(false);
                  }}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Link Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalInput({ label, type = "text", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type={type}
        {...props}
        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </div>
  );
}

function ModalImage({ label, name, value, onChange }) {
  return (
    <div className="border rounded-xl p-3 text-center space-y-2 hover:shadow transition">
      <p className="text-sm text-gray-500">{label}</p>

      <input
        type="file"
        name={name}
        accept="image/*"
        onChange={onChange}
        className="text-sm"
      />

      {value ? (
        <img
          src={typeof value === "string" ? value : URL.createObjectURL(value)}
          alt="preview"
          className="w-full h-28 object-cover rounded-lg border"
        />
      ) : (
        <div className="w-full h-28 flex items-center justify-center text-gray-400 border rounded-lg text-sm">
          No image
        </div>
      )}
    </div>
  );
}

function ImageInput({ label, value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result); // base64 for localStorage
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border rounded-xl p-3 text-center space-y-2 hover:shadow transition">
      <p className="text-sm text-gray-500">{label}</p>

      <label className="cursor-pointer block">
        <input type="file" accept="image/*" onChange={handleFile} hidden />

        {value ? (
          <img
            src={value}
            className="w-full h-28 object-cover rounded-lg border"
          />
        ) : (
          <div className="w-full h-28 flex items-center justify-center text-gray-400 border rounded-lg text-sm">
            Click to upload
          </div>
        )}
      </label>
    </div>
  );
}
