import { useState } from "react";
import { Flex, Box, useColorModeValue } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { ErrorBoundary } from "../component/ErrorBoundary";
import useGlobalNotifications from "../hooks/useGlobalNotifications.jsx";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get current user for notifications
  let userDetails = { id: null };
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      userDetails = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Failed to parse user details", e);
  }

  // Actively listen for global chat toasts
  useGlobalNotifications(userDetails);
  
  // Outer app background matches Blade app bg-gray-100 or gray-900 (dark mode)
  const appBg = useColorModeValue("gray.100", "gray.900");

  return (
    <Flex h="100vh" bg={appBg}>
      {/* 
        Static Sidebar on Desktop, Hidden on Mobile 
        Matches: <aside class="hidden lg:flex lg:w-[280px] lg:flex-col lg:sticky lg:top-0 lg:h-screen..."
      */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <Flex flex="1" direction="column" minW={0} overflow="hidden" ml={{ lg: "280px" }}>
        {/* Sticky Top Bar over the main content area */}
        <Topbar onOpenSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <Box as="main" flex="1" p={{ base: 4, md: 6, lg: 8 }} pb={{ base: "80px", md: 8 }} overflowY="auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Flex>
      
      {/* Mobile Bottom Navigation Ribbon */}
      <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />
    </Flex>
  );
};

export default DashboardLayout;
