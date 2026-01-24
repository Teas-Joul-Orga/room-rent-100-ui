import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AddNewTenant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [tenant, setTenant] = useState({
    name: "",
    email: "",
    phone: "",
    occupation: "",
    dob: "",
    tenantPhoto: null,
    idCardFront: null,
    idCardBack: null,
  });

  useEffect(() => {
    if (isEdit) {
      const list = JSON.parse(localStorage.getItem("tenants")) || [];
      const found = list.find((t) => t.id === Number(id));

      if (found) {
        setTenant({
          name: found.name || "",
          email: found.email || "",
          phone: found.phone || "",
          occupation: found.occupation || found.job || "",
          dob: found.dob || "",
          tenantPhoto: null,
          idCardFront: null,
          idCardBack: null,
        });
      }
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setTenant((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tenants = JSON.parse(localStorage.getItem("tenants")) || [];

    if (isEdit) {
      const updated = tenants.map((t) =>
        t.id === Number(id)
          ? {
              ...t,
              name: tenant.name,
              email: tenant.email,
              phone: tenant.phone,
              occupation: tenant.occupation,
              dob: tenant.dob,
              photo: tenant.tenantPhoto
                ? URL.createObjectURL(tenant.tenantPhoto)
                : t.photo,
              idFront: tenant.idCardFront
                ? URL.createObjectURL(tenant.idCardFront)
                : t.idFront,
              idBack: tenant.idCardBack
                ? URL.createObjectURL(tenant.idCardBack)
                : t.idBack,
            }
          : t
      );
      localStorage.setItem("tenants", JSON.stringify(updated));
    } else {
      const newTenant = {
        id: Date.now(),
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        occupation: tenant.occupation,
        dob: tenant.dob,
        photo: URL.createObjectURL(tenant.tenantPhoto),
        idFront: URL.createObjectURL(tenant.idCardFront),
        idBack: URL.createObjectURL(tenant.idCardBack),
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("tenants", JSON.stringify([newTenant, ...tenants]));
    }

    navigate("/dashboard/tenants");
  };

  return (
    <div className="min-h-screen bg-sky-50 flex justify-center items-start py-10 px-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow p-6 space-y-6">
        {/* TITLE */}
        <h2 className="text-2xl font-bold text-sky-900 text-center">
          {isEdit ? "Edit Tenant" : "Add New Tenant"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={tenant.name}
              onChange={handleChange}
            />
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={tenant.email}
              onChange={handleChange}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={tenant.phone}
              onChange={handleChange}
            />
            <Input
              label="Occupation"
              name="occupation"
              value={tenant.occupation}
              onChange={handleChange}
            />
            <Input
              label="Date of Birth"
              type="date"
              name="dob"
              value={tenant.dob}
              onChange={handleChange}
            />
          </div>

          {/* IMAGE UPLOADS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ImageUpload
              label="Tenant Photo"
              name="tenantPhoto"
              file={tenant.tenantPhoto}
              onChange={handleChange}
            />

            <ImageUpload
              label="ID Card (Front)"
              name="idCardFront"
              file={tenant.idCardFront}
              onChange={handleChange}
            />

            <ImageUpload
              label="ID Card (Back)"
              name="idCardBack"
              file={tenant.idCardBack}
              onChange={handleChange}
            />
          </div>

          {/* SUBMIT */}
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              disabled={
                !isEdit &&
                (!tenant.tenantPhoto ||
                  !tenant.idCardFront ||
                  !tenant.idCardBack)
              }
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white px-10 py-3 rounded-xl font-semibold shadow transition"
            >
              {isEdit ? "Update Tenant" : "Save Tenant Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewTenant;

/* ===== Small Components ===== */

function Input({ label, type = "text", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type={type}
        {...props}
        required
        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </div>
  );
}

function ImageUpload({ label, name, file, onChange }) {
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

      {file ? (
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          className="w-full h-28 object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-28 flex items-center justify-center text-gray-400 border rounded-lg">
          No image
        </div>
      )}
    </div>
  );
}
