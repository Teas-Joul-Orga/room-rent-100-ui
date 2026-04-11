import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = (localStorage.getItem("isLoggedIn") || sessionStorage.getItem("isLoggedIn"));
  const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));

  if (!isLoggedIn || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
