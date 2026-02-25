import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";
import profile from "../assets/profile.jpg";
import { IoNotificationsOutline, IoMenu } from "react-icons/io5";
import { LuCircleUser } from "react-icons/lu";
import { RiLogoutCircleRLine } from "react-icons/ri";
import sidebarMap from "@/data/routes";

function MainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveMenu = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard/tenants")) return "Tenants";
    if (path.startsWith("/dashboard/rooms")) return "Rooms";
    if (path.startsWith("/dashboard/furniture")) return "Furniture";
    if (path.startsWith("/dashboard/lease")) return "Lease";
    if (path.startsWith("/dashboard/utility")) return "Utility bills & Payment";
    if (path.startsWith("/dashboard/report")) return "Report";
    if (path.startsWith("/dashboard/chat")) return "Chat";
    if (path.startsWith("/dashboard/recyclebin")) return "Recyclebin";
    return "Dashboard";
  };

  const activeMenu = getActiveMenu();
  const sidebarItems = sidebarMap[activeMenu] || {};

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastSidebarPath, setLastSidebarPath] = useState(() => {
    const saved = localStorage.getItem("lastSidebarPath");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("lastSidebarPath", JSON.stringify(lastSidebarPath));
  }, [lastSidebarPath]);

  const handleTopMenuClick = (menuKey, defaultPath) => {
    navigate(lastSidebarPath[menuKey] || defaultPath);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-sky-50">
      {/* ============ NAVBAR ============ */}
      <header className="sticky top-0 z-50 bg-white border-b border-sky-100">
        <div className="flex items-center justify-between px-4 h-16">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-2xl text-sky-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <IoMenu />
            </button>
            <img src={logo} className="w-9 h-9 rounded-full object-cover" />
            <span className="font-bold text-sky-700 hidden sm:block">
              Rental Admin
            </span>
          </div>

          {/* CENTER MENU (DESKTOP) */}
          <nav className="hidden lg:flex gap-6 text-sm font-medium">
            {[
              ["Dashboard", "/dashboard"],
              ["Tenants", "/dashboard/tenants"],
              ["Furniture", "/dashboard/furniture"],
              ["Rooms", "/dashboard/rooms"],
              ["Lease", "/dashboard/lease"],
              ["Utility bills & Payment", "/dashboard/utility"],
              ["Report", "/dashboard/report"],
              ["Recyclebin", "/dashboard/recyclebin"],
              ["Chat", "/dashboard/chat"],
            ].map(([label, path]) => (
              <button
                key={label}
                onClick={() => handleTopMenuClick(label, path)}
                className={`transition pb-1 ${
                  activeMenu === label
                    ? "text-sky-600 border-b-2 border-sky-600 font-semibold"
                    : "text-gray-500 hover:text-sky-600"
                }`}
              >
                {label === "Utility bills & Payment" ? "Utility" : label}
              </button>
            ))}
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative">
            {/* MOBILE MENU */}
            <button
              className="lg:hidden text-2xl text-sky-600"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <IoMenu />
            </button>

            {/* NOTIFICATION */}
            <NavLink to="/dashboard/notifications" className="relative">
              <IoNotificationsOutline className="text-2xl text-sky-600" />
              <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-xs px-1.5 rounded-full">
                3
              </span>
            </NavLink>

            {/* USER */}
            <div className="group relative">
              <img
                src={profile}
                className="w-9 h-9 rounded-full cursor-pointer border border-sky-200"
              />

              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-sky-100 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition">
                <button className="flex items-center gap-2 px-4 py-3 hover:bg-sky-50 w-full text-sm text-gray-700">
                  <LuCircleUser /> Profile
                </button>

                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate("/login");
                  }}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 w-full text-sm"
                >
                  <RiLogoutCircleRLine /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TOP MENU */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-sky-100 px-4 py-3 grid gap-2 text-sm">
            {[
              ["Dashboard", "/dashboard"],
              ["Tenants", "/dashboard/tenants"],
              ["Furniture", "/dashboard/furniture"],
              ["Rooms", "/dashboard/rooms"],
              ["Lease", "/dashboard/lease"],
              ["Utility bills & Payment", "/dashboard/utility"],
              ["Report", "/dashboard/report"],
              ["Recyclebin", "/dashboard/recyclebin"],
              ["Chat", "/dashboard/chat"],
            ].map(([label, path]) => (
              <button
                key={label}
                onClick={() => handleTopMenuClick(label, path)}
                className="text-left py-2 text-gray-600 hover:text-sky-600"
              >
                {label === "Utility bills & Payment" ? "Utility" : label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ============ MAIN ============ */}
      <div className="flex">
        {/* SIDEBAR */}
        <aside
          className={`bg-white w-64 border-r border-sky-100 min-h-[calc(100vh-64px)] fixed md:static z-40 transition-transform
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 space-y-1">
            {Object.entries(sidebarItems).map(([label, item]) => {
              const isIndex =
                item.path === `/dashboard/${activeMenu.toLowerCase()}` ||
                item.index === true;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={isIndex}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? "bg-sky-600 text-white shadow"
                        : "text-gray-600 hover:bg-sky-50 hover:text-sky-600"
                    }`
                  }
                  onClick={() =>
                    setLastSidebarPath((prev) => ({
                      ...prev,
                      [activeMenu]: item.path,
                    }))
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainPage;
