import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiX,
  FiMail,
  FiCamera,
  FiCreditCard,
  FiTrash,
  FiShield,
  FiPhone,
  FiUser,
  FiBriefcase,
} from "react-icons/fi";

const INITIAL_FORM_STATE = {
  name: "",
  email: "",
  phone: "",
  job: "",
  photo: null,
  idFront: null,
  idBack: null,
};

export default function TenantManager() {
  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    title: "",
    message: "",
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const [tenantForm, setTenantForm] = useState(INITIAL_FORM_STATE);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("tenants")) || [];
    setTenants(saved);
  }, []);

  const triggerNotify = (title, message) => {
    setNotification({ show: true, title, message });
    setTimeout(
      () => setNotification({ show: false, title: "", message: "" }),
      4000,
    );
  };

  const handleAddTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name || !tenantForm.email) {
      alert("Please fill in required fields.");
      return;
    }

    const newTenant = {
      ...tenantForm,
      id: Date.now(),
      status: "Pending",
      photo: tenantForm.photo || `https://i.pravatar.cc/150?u=${Date.now()}`,
    };

    const updated = [newTenant, ...tenants];
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setIsAddModalOpen(false);
    setTenantForm(INITIAL_FORM_STATE);
    triggerNotify("Success", "Tenant registered.");
  };

  const handleLinkAccount = (id) => {
    const updated = tenants.map((t) =>
      t.id === id ? { ...t, status: "Linked" } : t,
    );
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    triggerNotify("Account Linked", "Tenant access has been granted.");
  };

  const handleDelete = (tenant) => {
    // Instead of confirming here, we just save the tenant and open the modal
    setSelectedTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  // This is the actual execution function called by the "Yes, Delete" button
  const executeDelete = () => {
    if (!selectedTenant) return;

    const updated = tenants.filter((t) => t.id !== selectedTenant.id);
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));

    triggerNotify(
      "Record Removed",
      `${selectedTenant.name}'s profile has been deleted.`,
    );

    // Cleanup
    setIsDeleteModalOpen(false);
    setSelectedTenant(null);
  };

  const handleBulkDelete = () => {
    const updated = tenants.filter((t) => !selectedIds.includes(t.id));
    setTenants(updated);
    localStorage.setItem("tenants", JSON.stringify(updated));
    setSelectedIds([]);
    triggerNotify("Batch Purge Complete", "Selected records removed.");
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setTenantForm((prev) => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const filteredTenants = tenants.filter((t) =>
    Object.values(t).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  // Calculate stats
  const stats = {
    total: tenants.length,
    pending: tenants.filter((t) => t.status === "Pending").length,
    linked: tenants.filter((t) => t.status === "Linked").length,
  };

  // New state for the account creation form
  const [accountForm, setAccountForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // Update the Link Account button click handler
  const openAccountModal = (tenant) => {
    setSelectedTenant(tenant);
    setIsAccountModalOpen(true);
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (accountForm.password !== accountForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Logic to link account
    handleLinkAccount(selectedTenant.id);
    setIsAccountModalOpen(false);
    setAccountForm({ password: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen md:p-1 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Tenant Management
            </h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-3 transition-all active:scale-95"
          >
            <FiPlus strokeWidth={3} /> Register New Tenant
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <StatCard
            label="Total Tenants"
            value={stats.total}
            icon={<FiUser className="text-blue-500" />}
            color="bg-blue-50"
          />
          <StatCard
            label="Pending Approval"
            value={stats.pending}
            icon={<FiClock className="text-amber-500" />}
            color="bg-amber-50"
          />
          <StatCard
            label="Linked Accounts"
            value={stats.linked}
            icon={<FiCheckCircle className="text-emerald-500" />}
            color="bg-emerald-50"
          />
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-[30px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="relative border-b border-slate-100">
            <div className="p-6">
              <div className="relative max-w-md">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* BATCH ACTIONS */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-sky-400 z-10 flex items-center justify-between px-8"
                >
                  <div className="flex items-center gap-4 text-white">
                    <span className="bg-sky-200 px-3 py-1 rounded-lg text-xs font-bold text-black">
                      {selectedIds.length} Selected
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-white text-xs font-bold uppercase tracking-widest px-4"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)} // Opens the new UI
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all"
                    >
                      <FiTrash /> Delete Records
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-6 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md border-slate-300 accent-indigo-600 cursor-pointer"
                      checked={
                        selectedIds.length === filteredTenants.length &&
                        filteredTenants.length > 0
                      }
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.length === filteredTenants.length
                            ? []
                            : filteredTenants.map((t) => t.id),
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-6">Tenant</th>
                  <th className="px-4 py-6">Email</th>
                  <th className="px-4 py-6">Contact</th>
                  <th className="px-4 py-6">Job</th>
                  <th className="px-4 py-6 text-center">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className={`transition-all ${selectedIds.includes(tenant.id) ? "bg-indigo-50/40 border-l-4 border-l-indigo-500" : "hover:bg-slate-50/50 border-l-4 border-l-transparent"}`}
                  >
                    <td className="px-6 py-5 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-md border-slate-300 accent-indigo-600 cursor-pointer"
                        checked={selectedIds.includes(tenant.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(tenant.id)
                              ? prev.filter((i) => i !== tenant.id)
                              : [...prev, tenant.id],
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-5 flex items-center gap-4">
                      <img
                        src={tenant.photo}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shadow-sm"
                      />
                      <span className="font-bold text-slate-800 text-sm">
                        {tenant.name}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-slate-500 text-xs font-medium">
                      {tenant.email}
                    </td>
                    <td className="px-4 py-5 text-slate-600 text-xs font-bold font-mono">
                      {tenant.phone || "---"}
                    </td>
                    <td className="px-4 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                      {tenant.job || "Resident"}
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${tenant.status === "Linked" ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"}`}
                      >
                        {tenant.status === "Linked" ? (
                          <FiCheckCircle />
                        ) : (
                          <FiClock />
                        )}{" "}
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {tenant.status === "Pending" ? (
                          <button
                            onClick={() => openAccountModal(tenant)} // Changed this
                            className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-colors mr-1 shadow-sm"
                          >
                            Create Account
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewingProfile(tenant)}
                            className="p-2 text-sky-500 transition-colors"
                          >
                            <FiEye size={18} />
                          </button>
                        )}
                        <button className="p-2 text-green-500 font-bold transition-colors">
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant)} // Pass the whole object now
                          className="p-2 text-red-500 transition-colors"
                          title="Delete Profile"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-10 right-10 z-[200] bg-white border border-slate-100 shadow-2xl p-5 rounded-2xl flex items-center gap-4"
          >
            <FiCheckCircle className="text-emerald-500" size={20} />
            <p className="font-bold text-sm text-slate-900">
              {notification.title}:{" "}
              <span className="font-medium text-slate-500">
                {notification.message}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: VIEW PROFILE */}
      <AnimatePresence>
        {viewingProfile && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] p-10 w-full max-w-3xl shadow-2xl relative"
            >
              <button
                onClick={() => setViewingProfile(null)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"
              >
                <FiX size={24} />
              </button>
              <div className="flex items-center gap-6 mb-10 pb-6 border-b">
                <img
                  src={viewingProfile.photo}
                  alt=""
                  className="w-24 h-24 rounded-3xl object-cover shadow-lg border-4 border-white"
                />
                <div>
                  <h2 className="text-2xl font-black">{viewingProfile.name}</h2>
                  <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">
                    {viewingProfile.job || "Resident"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    ID Card Front
                  </p>
                  <div className="aspect-video rounded-3xl overflow-hidden border bg-slate-50 flex items-center justify-center">
                    {viewingProfile.idFront ? (
                      <img
                        src={viewingProfile.idFront}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-300 italic text-xs">
                        No document
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    ID Card Back
                  </p>
                  <div className="aspect-video rounded-3xl overflow-hidden border bg-slate-50 flex items-center justify-center">
                    {viewingProfile.idBack ? (
                      <img
                        src={viewingProfile.idBack}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-300 italic text-xs">
                        No document
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTER NEW TENANT */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
            >
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight ">
                    Register New Tenant
                  </h2>
                  <p className="text-slate-400 text-sm font-semibold flex items-center gap-2 mt-1">
                    <FiShield className="text-indigo-500" /> Secure identity
                    onboarding.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form
                onSubmit={handleAddTenant}
                className="flex-1 overflow-y-auto p-10 bg-white"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 flex flex-col items-center lg:border-r lg:border-slate-50 lg:pr-10">
                    <div className="relative group">
                      <div className="w-44 h-44 rounded-[56px] bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-100 group-hover:ring-indigo-300 transition-all">
                        {tenantForm.photo ? (
                          <img
                            src={tenantForm.photo}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiUser size={50} className="text-slate-200" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-4 rounded-3xl text-white shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                        <FiCamera size={20} />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "photo")}
                        />
                      </label>
                    </div>

                    <div className="w-full mt-10 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Occupation
                        </label>
                        <div className="relative">
                          <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input
                            type="text"
                            placeholder="e.g. Software Engineer"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            value={tenantForm.job}
                            onChange={(e) =>
                              setTenantForm({
                                ...tenantForm,
                                job: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-10">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput
                        label="Full Name"
                        icon={<FiUser />}
                        placeholder="John Doe"
                        required
                        value={tenantForm.name}
                        onChange={(e) =>
                          setTenantForm({ ...tenantForm, name: e.target.value })
                        }
                      />
                      <FormInput
                        label="Email Address"
                        icon={<FiMail />}
                        type="email"
                        placeholder="john@example.com"
                        required
                        value={tenantForm.email}
                        onChange={(e) =>
                          setTenantForm({
                            ...tenantForm,
                            email: e.target.value,
                          })
                        }
                      />
                      <FormInput
                        label="Phone Number"
                        icon={<FiPhone />}
                        placeholder="0000000000"
                        type="tel"
                        inputMode="numeric" // Forces numeric keypad on mobile
                        value={tenantForm.phone}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/\D/g, "");
                          setTenantForm({
                            ...tenantForm,
                            phone: onlyNums,
                          });
                        }}
                      />
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DocUpload
                        label="ID Card Front"
                        preview={tenantForm.idFront}
                        onChange={(e) => handleImageChange(e, "idFront")}
                      />
                      <DocUpload
                        label="ID Card Back"
                        preview={tenantForm.idBack}
                        onChange={(e) => handleImageChange(e, "idBack")}
                      />
                    </section>
                  </div>
                </div>
              </form>

              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-8 py-4 font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTenant}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-600 transition-all"
                >
                  Complete Registration <FiCheckCircle size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE ACCOUNT */}
      <AnimatePresence>
        {isAccountModalOpen && selectedTenant && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/30">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[35px] shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header Section */}
              <div className="bg-sky-50 p-8 flex items-center gap-4 border-b border-sky-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-sky-500">
                  <FiShield size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Setup Access
                  </h2>
                  <p className="text-sky-600/70 text-xs font-bold uppercase tracking-wider">
                    Credential Security
                  </p>
                </div>
                <button
                  onClick={() => setIsAccountModalOpen(false)}
                  className="ml-auto p-2 hover:bg-sky-100 rounded-xl transition-colors text-slate-400"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="p-8 space-y-5">
                {/* Read Only Tenant Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Tenant Name
                    </label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2">
                      <FiUser className="text-slate-300" />{" "}
                      {selectedTenant.name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                      Account Email
                    </label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2 truncate">
                      <FiMail className="text-slate-300" />{" "}
                      {selectedTenant.email}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-50" />

                {/* Input Fields */}
                <FormInput
                  label="Create Password"
                  type="password"
                  icon={<FiShield />}
                  placeholder="••••••••"
                  required
                  value={accountForm.password}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, password: e.target.value })
                  }
                />

                <FormInput
                  label="Confirm Password"
                  type="password"
                  icon={<FiCheckCircle />}
                  placeholder="••••••••"
                  required
                  value={accountForm.confirmPassword}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAccountModalOpen(false)}
                    className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-sky-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Link Portal Access <FiPlus />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-red-50"
            >
              <div className="p-10 text-center">
                {/* Header Section: Logic to switch between Photo and Bulk Trash */}
                <div className="relative w-28 h-28 mx-auto mb-6">
                  {selectedIds.length > 0 ? (
                    /* --- MULTI DELETE VIEW: Clean Professional Trash Icon --- */
                    <div className="w-full h-full rounded-[38px] bg-red-50 flex items-center justify-center text-red-500 shadow-inner ring-1 ring-red-100">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <FiTrash2 size={42} />
                      </motion.div>
                      {/* Visual Indicator for 'Multiple' */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                  ) : (
                    /* --- SINGLE DELETE VIEW: Tenant Photo + Badge --- */
                    <>
                      <div className="w-full h-full rounded-[38px] overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-200">
                        {selectedTenant?.photo ? (
                          <img
                            src={selectedTenant.photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <FiUser size={40} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
                        <FiTrash2 size={18} />
                      </div>
                    </>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                  Confirm Deletion
                </h2>

                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  {selectedIds.length > 0 ? (
                    <>
                      You are about to remove{" "}
                      <span className="text-red-600 font-black text-lg underline underline-offset-4 decoration-red-200">
                        {selectedIds.length}
                      </span>{" "}
                      selected records.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete{" "}
                      <span className="text-red-600 font-bold italic">
                        {selectedTenant?.name}
                      </span>
                      ?
                    </>
                  )}
                  <br />
                  <span className="text-[10px] text-slate-400 mt-4 block font-bold uppercase tracking-widest opacity-60">
                    Warning: This action cannot be undone
                  </span>
                </p>
              </div>

              {/* Buttons Section */}
              <div className="flex bg-slate-50/50 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedTenant(null);
                  }}
                  className="flex-1 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedIds.length > 0) {
                      handleBulkDelete();
                    } else {
                      executeDelete();
                    }
                    setIsDeleteModalOpen(false);
                  }}
                  className="flex-1 py-6 text-[11px] font-black text-red-500 uppercase tracking-[0.2em] bg-red-50/30 hover:bg-red-500 hover:text-white transition-all border-l border-slate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormInput({ label, icon, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
        {label} {props.required && <span className="text-indigo-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
          {icon}
        </div>
        <input
          {...props}
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-bold text-slate-700"
        />
      </div>
    </div>
  );
}

function DocUpload({ label, preview, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <label className="relative flex flex-col items-center justify-center h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer hover:bg-white transition-all overflow-hidden">
        {preview ? (
          <img
            src={preview}
            alt="Upload"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center">
            <FiCreditCard size={24} className="text-slate-300 mb-2" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Click to upload scan
            </span>
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={onChange}
        />
      </label>
    </div>
  );
}
function StatCard({ label, value, icon, color }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex items-center gap-5"
    >
      <div
        className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-2xl`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      </div>
    </motion.div>
  );
}
