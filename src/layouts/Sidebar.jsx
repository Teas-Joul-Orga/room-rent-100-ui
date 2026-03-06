import React from "react";
import { Box, VStack, Text, useColorModeValue, Flex, Icon, Tooltip, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, Collapse } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

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

const getSidebarGroups = (role) => {
  const generalGroup = {
    title: "General",
    links: [
      { label: "Dashboard", path: "/dashboard", exact: true, pathD: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" },
      { label: "Notifications", path: "/dashboard/notifications", exact: false, pathD: "M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" },
    ]
  };

  if (role === 'tenant') {
    return [
      generalGroup,
      {
        title: "Tenant",
        links: [
          { label: "My Billing", path: "/dashboard/utility", exact: false, pathD: ["M7 3h10v18H7z", "M9 7h6M9 11h6M9 15h4"] },
          { label: "Maintenance", path: "/dashboard/maintenance", exact: false, pathD: ["M14.7 6.3a4 4 0 0 0-5.7 5.7l-6.3 6.3 2 2 6.3-6.3a4 4 0 0 0 5.7-5.7Z", "M16 8l4-4"] },
          { label: "Community", path: "/dashboard/notifications", exact: false, pathD: ["M4 11v2a1 1 0 0 0 1 1h2l5 5V6L7 11H5a1 1 0 0 0-1 1Z", "M15 9a4 4 0 0 1 0 6"] },
        ]
      }
    ];
  }

  // Admin groups
  return [
    generalGroup,
    {
      title: "Management",
      links: [
        { label: "Tenants", path: "/dashboard/tenants", exact: false, pathD: ["M20 21a8 8 0 1 0-16 0", "M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"] },
        { label: "System Users", path: "/dashboard/users", exact: false, pathD: ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"] },
        { label: "Rooms", path: "/dashboard/rooms", exact: false, pathD: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" },
        { label: "Furniture", path: "/dashboard/furniture", exact: false, pathD: ["M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"] },
        { label: "Leases", path: "/dashboard/lease", exact: false, pathD: ["M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 13h6M9 17h6M9 9h3"] },
        { label: "Utilities", path: "/dashboard/utility", exact: false, pathD: ["M12 2v4", "M7 8h10", "M8 22h8", "M9 12h6v6H9z"] },
        { label: "Payments", path: "/dashboard/payments", exact: false, pathD: ["M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"] },
        { label: "Maintenance", path: "/dashboard/maintenance", exact: false, pathD: ["M14.7 6.3a4 4 0 0 0-5.7 5.7l-6.3 6.3 2 2 6.3-6.3a4 4 0 0 0 5.7-5.7Z", "M16 8l4-4"] },
        { label: "Expenses", path: "/dashboard/expenses", exact: false, pathD: ["M12 2v20", "M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7"] },
      ]
    },
    {
      title: "Insights",
      links: [
        { 
          label: "Reports", 
          path: "/dashboard/report", 
          exact: false, 
          pathD: ["M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14", "M8 17V9m4 8V7m4 10v-5"],
          subLinks: [
            { label: 'Financial Summary', path: '/dashboard/report?tab=financial' },
            { label: 'Annual Trend', path: '/dashboard/report?tab=p_and_l' },
            { label: 'Aging (A/R)', path: '/dashboard/report?tab=aging' },
            { label: 'Unit Drill-down', path: '/dashboard/report?tab=unit_analysis' },
            { label: 'Occupancy', path: '/dashboard/report?tab=occupancy' },
            { label: 'Lease Tracking', path: '/dashboard/report?tab=lease_tracking' },
            { label: 'Maintenance Analytics', path: '/dashboard/report?tab=maintenance_analytics' },
            { label: 'Tenant Performance', path: '/dashboard/report?tab=tenant_performance' },
            { label: 'Utility Trends', path: '/dashboard/report?tab=utility_trends' },
            { label: 'Deposit Ledger', path: '/dashboard/report?tab=deposit_ledger' }
          ]
        },
        { label: "Recycle Bin", path: "/dashboard/recyclebin", exact: false, pathD: ["M4 7h16", "M6 7l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14", "M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"] },
        { label: "Announcements", path: "/dashboard/announcements", exact: false, pathD: ["M4 11v2a1 1 0 0 0 1 1h2l5 5V6L7 11H5a1 1 0 0 0-1 1Z", "M15 9a4 4 0 0 1 0 6", "M17 7a7 7 0 0 1 0 10"] },
      ]
    },
    {
      title: "System",
      links: [
        { label: "Settings", path: "/dashboard/settings", exact: false, pathD: ["M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", "M15 12a3 3 0 11-6 0 3 3 0 016 0z"] },
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
        cursor={isDropdown ? "pointer" : "inherit"}
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
                  py={1.5}
                  px={3}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="medium"
                  color={isSubActive ? "blue.500" : "gray.500"}
                  bg={isSubActive ? useColorModeValue("blue.50", "blue.900") : "transparent"}
                  _hover={{ color: "blue.600", bg: hoverBg }}
                  onClick={() => { if (onClose) onClose(); }}
                >
                  {sub.label}
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
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const groupTitleColor = useColorModeValue("gray.400", "gray.400");
  const linkColor = useColorModeValue("gray.700", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const location = useLocation();

  const isLinkActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const [pendingMaintenanceCount, setPendingMaintenanceCount] = React.useState(0);
  const userRole = localStorage.getItem('role');

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
    
    // Initialize WebSockets (Reverb)
    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'ia6m3xrvsph7zmudqiif',
      wsHost: 'localhost',
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    // Listen to 'maintenance' channel
    echo.channel('maintenance')
      .listen('.App\\Events\\MaintenanceCountUpdated', (e) => {
        setPendingMaintenanceCount(e.count);
      });

    return () => {
      echo.leaveChannel('maintenance');
    };
  }, [userRole]);

  const sidebarContent = (
      <VStack spacing={6} align="stretch" p={3} pb={20}>
        {getSidebarGroups(localStorage.getItem('role')).map((group, index) => (
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
        minH="100vh"
        position="fixed"
        left={0}
        top={0}
        display={{ base: "none", lg: "block" }}
        zIndex={40}
        overflowY="auto"
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
