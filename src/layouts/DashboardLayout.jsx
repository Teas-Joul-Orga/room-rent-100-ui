import { useState, useEffect } from "react";
import { Flex, Box, useColorModeValue } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { ErrorBoundary } from "../component/ErrorBoundary";
import useGlobalNotifications from "../hooks/useGlobalNotifications.jsx";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  // Fetch global settings and save the currency globally
  useEffect(() => {
    const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));
    if (token) {
      fetch("http://localhost:8000/api/v1/me", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      })
      .then(r => r.json())
      .then(d => {
        if (d?.settings) {
           if (d.settings.currency) localStorage.setItem("currency", d.settings.currency);
           if (d.settings.exchangeRate) localStorage.setItem("exchangeRate", d.settings.exchangeRate);
           if (d.settings.utility_rate_electricity) localStorage.setItem("utility_rate_electricity", d.settings.utility_rate_electricity);
           if (d.settings.utility_rate_water) localStorage.setItem("utility_rate_water", d.settings.utility_rate_water);
           if (d.settings.utility_fixed_trash) localStorage.setItem("utility_fixed_trash", d.settings.utility_fixed_trash);
           if (d.settings.utility_fixed_internet) localStorage.setItem("utility_fixed_internet", d.settings.utility_fixed_internet);
        }
      })
      .catch(e => console.error("Could not fetch global settings."));
    }
  }, []);
  
  // Get current user for notifications
  let userDetails = { id: null };
  try {
    const storedUser = (localStorage.getItem("user") || sessionStorage.getItem("user"));
    if (storedUser) {
      userDetails = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Failed to parse user details", e);
  }

  // Actively listen for global chat toasts
  useGlobalNotifications(userDetails);
  
  // Outer app background matches Blade app bg-gray-100 or gray-900 (dark mode)
  const appBg = useColorModeValue("gray.100", "#0d1117");

  return (
    <Flex 
      h="100vh" 
      bg={appBg}
      sx={{
        "@media print": {
          h: "auto !important",
          bg: "white !important",
        }
      }}
    >
      {/* 
        Static Sidebar on Desktop, Hidden on Mobile 
        Matches: <aside class="hidden lg:flex lg:w-[280px] lg:flex-col lg:sticky lg:top-0 lg:h-screen..."
      */}
      <Box sx={{ "@media print": { display: "none !important" } }}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isDesktopCollapsed={isDesktopCollapsed}
        />
      </Box>

      {/* Main Content Area */}
      <Flex 
        flex="1" 
        direction="column" 
        minW={0} 
        overflow="hidden" 
        ml={{ lg: isDesktopCollapsed ? "80px" : "280px" }}
        transition="margin-left 0.2s"
        sx={{
          "@media print": {
            ml: "0 !important",
            overflow: "visible !important",
          }
        }}
      >
        {/* Sticky Top Bar over the main content area */}
        <Box sx={{ "@media print": { display: "none !important" } }}>
          <Topbar 
            onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} 
            onToggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          />
        </Box>

        {/* Page Content */}
        <Box 
          as="main" 
          flex="1" 
          p={{ base: 4, md: 6, lg: 8 }} 
          pb={{ base: "80px", md: 8 }} 
          overflowY="auto"
          sx={{
            "@media print": {
              p: "0 !important",
              overflow: "visible !important",
            }
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Flex>
      
      {/* Mobile Bottom Navigation Ribbon */}
      <Box sx={{ "@media print": { display: "none !important" } }}>
        <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />
      </Box>
    </Flex>
  );
};

export default DashboardLayout;
