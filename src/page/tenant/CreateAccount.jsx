import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// import "./createAccount.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function CreateAccount() {
  const { id } = useParams(); // tenant id from URL
  const navigate = useNavigate();

  const [tenant, setTenant] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isPasswordMismatch = confirmPassword && password !== confirmPassword;

  useEffect(() => {
    const tenants = JSON.parse(localStorage.getItem("tenants")) || [];
    const found = tenants.find((t) => t.id.toString() === id); // convert to string
    if (found) {
      setTenant(found);
    } else {
      setError("Tenant not found");
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const tenants = JSON.parse(localStorage.getItem("tenants")) || [];
    const updatedTenants = tenants.map((t) =>
      t.id.toString() === id
        ? { ...t, status: "Linked", account: { password } }
        : t,
    );
    localStorage.setItem("tenants", JSON.stringify(updatedTenants));

    // alert("Account created successfully!");
    navigate("/dashboard/tenants");
  };

  if (!tenant) return <p>{error || "Loading tenant..."}</p>;

  return (
    <div className="min-h-screen to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* ===== TITLE ===== */}
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">
          Create Account for{" "}
          <span className="text-sky-600 font-semibold">{tenant.name}</span>
        </h1>

        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tenant Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Tenant Name
            </label>
            <input
              type="text"
              value={tenant.name}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={tenant.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-500 hover:text-sky-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label
              className={`block text-sm font-medium mb-1 ${
                isPasswordMismatch ? "text-red-500" : "text-slate-600"
              }`}
            >
              {isPasswordMismatch
                ? "Password does not match"
                : "Confirm Password"}
            </label>

            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-4 py-2.5 pr-11 rounded-lg outline-none border
              ${
                isPasswordMismatch
                  ? "border-red-400 focus:ring-red-300"
                  : "border-slate-300 focus:ring-sky-400 focus:border-sky-400"
              }
              focus:ring-2`}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-slate-500 hover:text-sky-600"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white py-2.5 rounded-lg font-semibold shadow-md transition"
          >
            Create Account
          </button>
        </form>

        {/* Back */}
        <div className="text-center mt-4">
          <Link
            to="/dashboard/tenants"
            className="text-sm text-sky-600 hover:underline"
          >
            ← Back to Tenants List
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
