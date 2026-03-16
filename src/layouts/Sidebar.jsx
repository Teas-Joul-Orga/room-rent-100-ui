import React from "react";
import { Box, VStack, Text, useColorModeValue, Flex, Icon, Tooltip, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, Collapse } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import echo from "../lib/echo";

// Custom Icon Component to render Blade SVG paths
const SvgIcon = ({ pathD, ...props }) => (
  <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    {Array.isArray(pathD) ? (
      pathD.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />)
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={pathD} />
    )}
  </Icon>
);

const API = "http://localhost:8000/api/v1";

const getSidebarGroups = (role, t) => {
  const generalGroup = {
    title: t("sidebar.general"),
    links: [
      { label: t("sidebar.dashboard"), path: "/dashboard", exact: true, pathD: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" },
    ]
  };

  if (role === 'tenant') {
    return [
      generalGroup,
      {
        title: t("sidebar.tenant"),
        links: [
          { label: t("sidebar.my_lease") || "My Lease", path: "/dashboard/lease/my-lease", exact: false, pathD: ["M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 13h6M9 17h6M9 9h3"] },
          { label: t("sidebar.lease_history") || "Lease History", path: "/dashboard/lease/history", exact: false, pathD: ["M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"] },
          { label: t("sidebar.my_billing"), path: "/dashboard/utility", exact: false, pathD: ["M7 3h10v18H7z", "M9 7h6M9 11h6M9 15h4"] },
          { label: t("sidebar.maintenance"), path: "/dashboard/maintenance", exact: false, pathD: ["M14.7 6.3a4 4 0 0 0-5.7 5.7l-6.3 6.3 2 2 6.3-6.3a4 4 0 0 0 5.7-5.7Z", "M16 8l4-4"] },
          { label: t("sidebar.community"), path: "/dashboard/chat", exact: false, pathD: ["M4 11v2a1 1 0 0 0 1 1h2l5 5V6L7 11H5a1 1 0 0 0-1 1Z", "M15 9a4 4 0 0 1 0 6"] },
          { label: t("sidebar.announcements"), path: "/dashboard/announcements", exact: false, pathD: ["M4 11v2a1 1 0 0 0 1 1h2l5 5V6L7 11H5a1 1 0 0 0-1 1Z", "M15 9a4 4 0 0 1 0 6", "M17 7a7 7 0 0 1 0 10"] },
        ]
      }
    ];
  }

  // Admin groups
  return [
    generalGroup,
    {
      title: t("sidebar.management"),
      links: [
        { label: t("sidebar.tenants"), path: "/dashboard/tenants", exact: false, pathD: ["M20 21a8 8 0 1 0-16 0", "M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"] },
        { label: t("sidebar.system_users"), path: "/dashboard/users", exact: false, pathD: ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"] },
        { label: t("sidebar.rooms"), path: "/dashboard/rooms", exact: false, pathD: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" },
        { label: t("sidebar.furniture"), path: "/dashboard/furniture", exact: false, pathD: ["M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"] },
        { label: t("sidebar.leases"), path: "/dashboard/lease", exact: false, pathD: ["M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 13h6M9 17h6M9 9h3"] },
        { label: t("sidebar.utilities"), path: "/dashboard/utility", exact: false, pathD: ["M12 2v4", "M7 8h10", "M8 22h8", "M9 12h6v6H9z"] },
        { label: t("sidebar.payments"), path: "/dashboard/payments", exact: false, pathD: ["M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z", "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0", "M6 12h.01", "M18 12h.01"] },
        { label: t("sidebar.maintenance"), path: "/dashboard/maintenance", exact: false, pathD: ["M14.7 6.3a4 4 0 0 0-5.7 5.7l-6.3 6.3 2 2 6.3-6.3a4 4 0 0 0 5.7-5.7Z", "M16 8l4-4"] },
        { label: t("sidebar.expenses"), path: "/dashboard/expenses", exact: false, pathD: ["M20 12V8H4v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z", "M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4", "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"] },
      ]
    },
    {
      title: t("sidebar.insights"),
      links: [
        { 
          label: t("sidebar.reports"), 
          path: "/dashboard/report", 
          exact: false, 
          pathD: ["M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14", "M8 17V9m4 8V7m4 10v-5"],
          subLinks: [
            { label: t("sidebar.financial_summary"), path: '/dashboard/report?tab=financial', pathD: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            { label: t("sidebar.annual_trend"), path: '/dashboard/report?tab=p_and_l', pathD: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { label: t("sidebar.aging_ar"), path: '/dashboard/report?tab=aging', pathD: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: t("sidebar.unit_drilldown"), path: '/dashboard/report?tab=unit_analysis', pathD: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
            { label: t("sidebar.occupancy"), path: '/dashboard/report?tab=occupancy', pathD: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            { label: t("sidebar.lease_tracking"), path: '/dashboard/report?tab=lease_tracking', pathD: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { label: t("sidebar.maintenance_analytics"), path: '/dashboard/report?tab=maintenance_analytics', pathD: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
            { label: t("sidebar.tenant_performance"), path: '/dashboard/report?tab=tenant_performance', pathD: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
            { label: t("sidebar.utility_trends"), path: '/dashboard/report?tab=utility_trends', pathD: "M13 10V3L4 14h7v7l9-11h-7z" },
            { label: t("sidebar.deposit_ledger"), path: '/dashboard/report?tab=deposit_ledger', pathD: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
          ]
        },
        { label: t("sidebar.recycle_bin"), path: "/dashboard/recyclebin", exact: false, pathD: ["M4 7h16", "M6 7l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14", "M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"] },
        { label: t("sidebar.announcements"), path: "/dashboard/announcements", exact: false, pathD: ["M4 11v2a1 1 0 0 0 1 1h2l5 5V6L7 11H5a1 1 0 0 0-1 1Z", "M15 9a4 4 0 0 1 0 6", "M17 7a7 7 0 0 1 0 10"] },
      ]
    },
    {
      title: t("sidebar.system"),
      links: [
        { label: t("sidebar.settings"), path: "/dashboard/settings", exact: false, pathD: ["M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", "M15 12a3 3 0 11-6 0 3 3 0 016 0z"] },
      ]
    }
  ];
};

const SidebarLinkItem = ({ link, location, linkColor, hoverBg, onClose, pendingMaintenanceCount, userRole, useColorModeValue }) => {
  const isDropdown = !!link.subLinks;
  
  const isAnySubActive = isDropdown && link.subLinks.some(s => {
      const isPathEqual = location.pathname + location.search === s.path;
      const isDefaultFinancial = location.search === '' && s.path.includes('?tab=financial') && location.pathname === '/dashboard/report';
      return isPathEqual || isDefaultFinancial;
  });

  const isActive = (link.exact ? location.pathname === link.path : location.pathname.startsWith(link.path));

  const [isOpen, setIsOpen] = React.useState(isAnySubActive && isDropdown);

  React.useEffect(() => {
    if (isAnySubActive && !isOpen) {
      setIsOpen(true);
    }
  }, [location.pathname, location.search, isAnySubActive]);

  const handleClick = (e) => {
    if (isDropdown) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <Box>
      <Flex
        as={NavLink}
        to={link.path}
        align="center"
        justify="space-between"
        px={3}
        py={2}
        borderRadius="xl"
        fontSize="sm"
        fontWeight="semibold"
        transition="all 0.2s"
        color={isActive && !isDropdown ? "white" : linkColor}
        bg={isActive && !isDropdown ? "blue.600" : "transparent"}
        boxShadow={isActive && !isDropdown ? "sm" : "none"}
        _hover={{
          bg: !isDropdown && isActive ? "blue.600" : hoverBg,
          color: !isDropdown && isActive ? "white" : linkColor
        }}
        role="group"
        onClick={handleClick}
        cursor="pointer"
      >
        <Flex align="center" gap={3}>
          <SvgIcon 
            pathD={link.pathD} 
            boxSize={5} 
            flexShrink={0}
            color={isActive && !isDropdown ? "white" : (isDropdown && isActive ? "blue.500" : linkColor)}
          />
          <Text isTruncated color={isDropdown && isActive ? "blue.500" : (isActive && !isDropdown ? "white" : "inherit")}>{link.label}</Text>
        </Flex>
        {link.label === "Maintenance" && pendingMaintenanceCount > 0 && userRole === 'admin' && (
          <Box
            bg="red.500"
            color="white"
            fontSize="10px"
            fontWeight="bold"
            px={2}
            py={0.5}
            borderRadius="full"
            ml="auto"
          >
            {pendingMaintenanceCount}
          </Box>
        )}
        {isDropdown && (
          <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" boxSize={4} transform={isOpen ? "rotate(180deg)" : ""} transition="transform 0.2s" color={isActive ? "blue.500" : "inherit"}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </Icon>
        )}
      </Flex>
      {isDropdown && (
        <Collapse in={isOpen} animateOpacity>
          <VStack align="stretch" spacing={1} mt={1} pl={10} pr={2}>
            {link.subLinks.map(sub => {
              const isSubActive = location.pathname + location.search === sub.path || (location.search === '' && sub.path.includes('?tab=financial') && location.pathname === '/dashboard/report');
              return (
                <Flex
                  as={NavLink}
                  to={sub.path}
                  key={sub.path}
                  py={2}
                  px={3}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="bold"
                  align="center"
                  gap={3}
                  transition="all 0.2s"
                  color={isSubActive ? "blue.600" : "gray.500"}
                  cursor="pointer"
                  bg={isSubActive ? useColorModeValue("blue.50", "blue.900") : "transparent"}
                  _hover={{ color: "blue.600", bg: hoverBg }}
                  onClick={() => { if (onClose) onClose(); }}
                >
                  {sub.pathD && (
                    <SvgIcon 
                      pathD={sub.pathD} 
                      boxSize={3.5} 
                      flexShrink={0}
                      color={isSubActive ? "blue.500" : "gray.400"}
                    />
                  )}
                  <Text isTruncated>{sub.label}</Text>
                </Flex>
              )
            })}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const bg = useColorModeValue("white", "#0d1117");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const groupTitleColor = useColorModeValue("gray.400", "gray.500");
  const linkColor = useColorModeValue("gray.700", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "#1c2333");
  const location = useLocation();
  const { t } = useTranslation();

  const isLinkActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const [pendingMaintenanceCount, setPendingMaintenanceCount] = React.useState(0);
  const userRole = localStorage.getItem('role')?.toLowerCase();

  React.useEffect(() => {
    if (userRole !== 'admin') return;

    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API}/admin/maintenance/pending-count`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingMaintenanceCount(data.count || 0);
        }
      } catch (e) {
        // silently fail for background poll
      }
    };

    fetchCount(); // Initial fetch
    
    // Listen for immediate local updates (e.g., when admin resolves a request on this device)
    window.addEventListener('maintenanceUpdated', fetchCount);

    // Initialize WebSockets (Reverb) via shared instance
    const echoInstance = echo();
    if (!echoInstance) return;

    // Listen to 'maintenance' channel
    const channel = echoInstance.channel('maintenance')
      .listen('.App\\Events\\MaintenanceCountUpdated', (e) => {
        setPendingMaintenanceCount(e.count);
      });

    return () => {
      window.removeEventListener('maintenanceUpdated', fetchCount);
      channel.stopListening('.App\\Events\\MaintenanceCountUpdated');
    };
  }, [userRole]);

  const sidebarContent = (
      <VStack spacing={6} align="stretch" p={3} pb={20}>
        {getSidebarGroups(userRole, t).map((group, index) => (
          <Box key={index}>
            <Text
              px={3}
              fontSize="10px"
              fontWeight="black"
              textTransform="uppercase"
              letterSpacing="0.25em"
              color={groupTitleColor}
              mb={2}
            >
              {group.title}
            </Text>
            
            <VStack spacing={1} align="stretch">
              {group.links.map((link) => (
                <SidebarLinkItem 
                  key={link.path} 
                  link={link} 
                  location={location} 
                  linkColor={linkColor} 
                  hoverBg={hoverBg} 
                  onClose={onClose} 
                  pendingMaintenanceCount={pendingMaintenanceCount} 
                  userRole={userRole} 
                  useColorModeValue={useColorModeValue}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
  );

  return (
    <>
      <Box
        bg={bg}
        w="280px"
        borderRight="1px"
        borderColor={borderColor}
        h="100vh"
        position="fixed"
        left={0}
        top={0}
        display={{ base: "none", lg: "block" }}
        zIndex={40}
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: useColorModeValue('rgba(0,0,0,0.05)', '#30363d'),
            borderRadius: '24px',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: useColorModeValue('rgba(0,0,0,0.1)', '#484f58'),
          }
        }}
      >
        {sidebarContent}
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={bg} maxW="280px">
          <DrawerCloseButton mt={1} />
          <Box h="100%" overflowY="auto" pt={10}>
            {sidebarContent}
          </Box>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Sidebar;
