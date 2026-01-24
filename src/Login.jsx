import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import login from "./assets/login.jpg";
import { useNavigate } from "react-router-dom";

export default function LoginForm1() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  // ================= VALIDATION =================
  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    if (!validate()) return;

    // ✅ HARD-CODED ADMIN LOGIN
    if (form.email === "admin@gmail.com" && form.password === "admin") {
      localStorage.setItem("isLoggedIn", "true"); // ✅ save login
      navigate("/dashboard");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl grid grid-cols-1 md:grid-cols-2">
        {/* IMAGE */}
        <div className="hidden md:block">
          <img src={login} alt="login" className="h-full w-full object-cover" />
        </div>

        {/* FORM */}
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Login 🔐
          </h2>
          <p className="text-gray-500 mb-6">
            Use admin credentials to continue
          </p>

          {loginError && (
            <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Email
              </label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@gmail.com"
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2
                  ${
                    errors.email
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Password
              </label>

              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="admin"
                  className={`w-full px-4 py-3 rounded-lg border pr-10 focus:outline-none focus:ring-2
                    ${
                      errors.password
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                />

                <span
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
