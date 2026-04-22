import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = (localStorage.getItem("isLoggedIn") || sessionStorage.getItem("isLoggedIn"));
  const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
  const role = (localStorage.getItem("role") || sessionStorage.getItem("role"))?.toLowerCase();

  if (!isLoggedIn || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If user role is not allowed, send them back to dashboard (or wherever appropriate)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
