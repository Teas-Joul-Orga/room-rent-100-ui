import React from "react";
import { Flex, IconButton, useColorModeValue, Icon, Text, VStack } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiMessageSquare, FiMenu, FiUsers, FiBox, FiTool, FiFileText } from "react-icons/fi";
import useUnreadChatCount from "../hooks/useUnreadChatCount";

const NavItem = ({ icon, label, path, isActive, onClick, badgeCount }) => {
  const activeColor = useColorModeValue("blue.600", "blue.300");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  
  return (
    <VStack 
      spacing={1} 
      flex="1" 
      onClick={onClick} 
      cursor="pointer"
      color={isActive ? activeColor : inactiveColor}
      transition="all 0.2s"
      _active={{ transform: "scale(0.95)" }}
    >
      <Flex position="relative">
        <Icon as={icon} boxSize={5} weight={isActive ? "bold" : "regular"} />
        {badgeCount > 0 && (
          <Flex
            position="absolute"
            top={-1.5}
            right={-2}
            bg="red.500"
            color="white"
            fontSize="0.6rem"
            fontWeight="bold"
            h="3.5"
            w="3.5"
            borderRadius="full"
            justify="center"
            align="center"
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </Flex>
        )}
      </Flex>
      <Text fontSize="10px" fontWeight={isActive ? "bold" : "medium"}>{label}</Text>
    </VStack>
  );
};

export default function BottomNav({ onOpenSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  let userDetails = null;
  try {
    userDetails = JSON.parse(localStorage.getItem("user"));
  } catch(e) {}

  const unreadChatCount = useUnreadChatCount(userDetails);
  
  const bg = useColorModeValue("white", "#0d1117");
  const borderTopColor = useColorModeValue("gray.200", "#30363d");

  const isRouteActive = (route) => location.pathname.startsWith(route);
  // Specific check for Exact dashboard so it doesn't highlight when on /dashboard/rooms
  const isDashboardActive = location.pathname === "/dashboard";

  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTop="1px"
      borderTopColor={borderTopColor}
      h="65px"
      align="center"
      justify="space-around"
      px={2}
      pb={2}
      pt={3}
      zIndex={1000}
      boxShadow="0 -4px 12px rgba(0,0,0,0.05)"
    >
      {/* Universal Dashboard Button */}
      <NavItem 
        icon={FiHome} 
        label="Home" 
        isActive={isDashboardActive} 
        onClick={() => navigate("/dashboard")} 
      />

      {/* Admin Specific Links */}
      {role === "admin" && (
        <>
          <NavItem 
            icon={FiUsers} 
            label="Tenants" 
            isActive={isRouteActive("/dashboard/tenants")} 
            onClick={() => navigate("/dashboard/tenants")} 
          />
          <NavItem 
            icon={FiBox} 
            label="Rooms" 
            isActive={isRouteActive("/dashboard/rooms")} 
            onClick={() => navigate("/dashboard/rooms")} 
          />
        </>
      )}

      {/* Tenant Specific Links */}
      {role === "tenant" && (
        <>
          <NavItem 
            icon={FiFileText} 
            label="Billing" 
            isActive={isRouteActive("/dashboard/utility")} 
            onClick={() => navigate("/dashboard/utility")} 
          />
          <NavItem 
            icon={FiTool} 
            label="Issues" 
            isActive={isRouteActive("/dashboard/maintenance")} 
            onClick={() => navigate("/dashboard/maintenance")} 
          />
        </>
      )}

      {/* Universal Chat Button */}
      <NavItem 
        icon={FiMessageSquare} 
        label="Chat" 
        isActive={isRouteActive("/dashboard/chat")} 
        onClick={() => navigate("/dashboard/chat")} 
        badgeCount={unreadChatCount}
      />

      {/* Menu Drawer Trigger */}
      <NavItem 
        icon={FiMenu} 
        label="Menu" 
        isActive={false} 
        onClick={onOpenSidebar} 
      />
    </Flex>
  );
}
