import React from "react";
import {
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  useColorModeValue,
  Box,
  Avatar,
  MenuDivider,
  Icon,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from "@chakra-ui/react";
import { IoMenu, IoNotificationsOutline, IoMoon, IoSunny, IoKeyOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { LuCircleUser, LuLogOut, LuSettings } from "react-icons/lu";
import { useNavigate, NavLink } from "react-router-dom";
import logo from "../assets/logo.jpg";
import profile from "../assets/profile.jpg"; // Fallback profile image
import ChangePasswordModal from "../components/ChangePasswordModal";
import useUnreadChatCount from "../hooks/useUnreadChatCount";
import useNotificationCount from "../hooks/useNotificationCount";
import Notification from "../page/notification/Notification";

const Topbar = ({ onOpenSidebar }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();

  const bg = useColorModeValue("whiteAlpha.900", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");
  const workspaceColor = useColorModeValue("gray.400", "gray.500");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // User details from localStorage
  let userDetails = { name: "Admin" };
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      userDetails = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Failed to parse user details", e);
  }

  const unreadChatCount = useUnreadChatCount(userDetails);
  const unreadNotificationCount = useNotificationCount(userDetails);

  return (
    <Box
      bg={bg}
      backdropFilter="blur(8px)"
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={50}
    >
      <Flex h="14" alignItems="center" justifyContent="space-between" px={{ base: 4, sm: 6, lg: 8 }}>
        
        {/* Left Side: Logo and Mobile Menu */}
        <Flex alignItems="center" gap={3} minW={0}>
          {/* Mobile Menu Icon (Only visible on tablets between mobile and desktop) */}
          <IconButton
            display={{ base: "none", md: "flex", lg: "none" }}
            onClick={onOpenSidebar}
            variant="ghost"
            aria-label="Open sidebar"
            icon={<IoMenu size={20} />}
            color="gray.700"
            _dark={{ color: "gray.200" }}
            _hover={{ bg: hoverBg }}
            borderRadius="xl"
            size="sm"
          />

          {/* Logo & Title */}
          <HStack display={{ base: "none", sm: "flex" }} spacing={2} minW={0}>
            <Image src={logo} boxSize="8" rounded="md" objectFit="cover" ignoreFallback />
            <Text fontSize="sm" fontWeight="black" letterSpacing="tight" color={textColor} isTruncated>
              Laravel
            </Text>
            <Text
              fontSize="10px"
              fontWeight="black"
              textTransform="uppercase"
              letterSpacing="0.25em"
              color={workspaceColor}
              ml={1}
            >
              Workspace
            </Text>
          </HStack>
        </Flex>

        {/* Right Side: Actions */}
        <Flex alignItems="center" gap={2}>
          {/* Theme Toggle */}
          <IconButton
            variant="ghost"
            icon={colorMode === "dark" ? <IoSunny size={20} /> : <IoMoon size={20} />}
            onClick={toggleColorMode}
            aria-label="Toggle Theme"
            color="gray.500"
            _dark={{ color: "gray.400" }}
            _hover={{ bg: hoverBg, color: "gray.700", _dark: { color: "gray.200" } }}
            borderRadius="xl"
            size="sm"
          />

          {/* Language Dropdown */}
          <Menu placement="bottom-end">
            <MenuButton
              as={Flex}
              alignItems="center"
              gap={1}
              px={2}
              py={1.5}
              borderRadius="xl"
              cursor="pointer"
              bg="transparent"
              color="gray.500"
              fontWeight="semibold"
              fontSize="sm"
              transition="all 0.2s"
              _hover={{ bg: hoverBg, color: "gray.700" }}
            >
              <HStack spacing={1}>
                <Text>EN</Text>
                <Icon viewBox="0 0 20 20" fill="currentColor" boxSize={4}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </Icon>
              </HStack>
            </MenuButton>
            <MenuList borderRadius="xl" boxShadow="lg" borderColor={borderColor} p={1} minW="120px">
              <MenuItem fontSize="sm" fontWeight="semibold" borderRadius="md" _hover={{ bg: "gray.50" }}>
                <HStack spacing={2}>
                  <Text fontSize="xs" fontWeight="bold">EN</Text>
                  <Text>English</Text>
                </HStack>
              </MenuItem>
              <MenuItem fontSize="sm" fontWeight="semibold" borderRadius="md" _hover={{ bg: "gray.50" }}>
                <HStack spacing={2}>
                  <Text fontSize="xs" fontWeight="bold">KH</Text>
                  <Text>Khmer</Text>
                </HStack>
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Chat Support (Hidden on mobile phones, handled by BottomNav) */}
          <Box position="relative" display={{ base: "none", md: "inline-flex" }}>
            <IconButton
              as={NavLink}
              to="/dashboard/chat"
              variant="ghost"
              icon={<IoChatbubbleEllipsesOutline size={20} />}
              color="gray.500"
              _dark={{ color: "gray.400" }}
              _hover={{ bg: hoverBg, color: "gray.700", _dark: { color: "gray.200" } }}
              aria-label="Messages"
              borderRadius="xl"
              size="sm"
            />
            {unreadChatCount > 0 && (
              <Flex
                position="absolute"
                top={0}
                right={0}
                transform="translate(25%, -25%)"
                bg="red.500"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                h="4"
                w="4"
                borderRadius="full"
                justify="center"
                align="center"
                zIndex={1}
              >
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </Flex>
            )}
          </Box>

          {/* Notifications */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Box position="relative">
                <IconButton
                  variant="ghost"
                  icon={<IoNotificationsOutline size={20} />}
                  color="gray.500"
                  _dark={{ color: "gray.400" }}
                  _hover={{ bg: hoverBg, color: "gray.700", _dark: { color: "gray.200" } }}
                  aria-label="Notifications"
                  borderRadius="xl"
                  size="sm"
                />
                {unreadNotificationCount > 0 && (
                  <Flex
                    position="absolute"
                    top={0}
                    right={0}
                    transform="translate(25%, -25%)"
                    bg="blue.500"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                    h="4"
                    w="4"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    zIndex={1}
                  >
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </Flex>
                )}
              </Box>
            </PopoverTrigger>
            <PopoverContent 
              width={{ base: "300px", md: "400px" }} 
              borderRadius="xl" 
              boxShadow="2xl" 
              borderColor={borderColor}
              _focus={{ outline: "none" }}
            >
              <PopoverArrow />
              <PopoverBody p={0}>
                <Notification />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <Menu placement="bottom-end">
            <MenuButton
              as={Flex}
              alignItems="center"
              gap={2}
              px={3}
              py={1.5}
              ml={1}
              borderRadius="xl"
              cursor="pointer"
              bg="transparent"
              color="gray.600"
              fontWeight="semibold"
              fontSize="sm"
              transition="all 0.2s"
              _hover={{ bg: hoverBg, color: "gray.900" }}
              _focus={{ outline: "none" }}
            >
              <HStack spacing={2}>
                <Text display={{ base: "none", sm: "block" }}>{userDetails.name}</Text>
                <Avatar size="sm" name={userDetails.name} src={profile} bg="blue.600" color="white" fontWeight="black" />
              </HStack>
            </MenuButton>
            <MenuList 
              borderRadius="xl" 
              boxShadow="lg" 
              borderColor={borderColor} 
              p={1}
            >
              <MenuItem
                icon={<LuCircleUser size={18} />}
                fontSize="sm"
                fontWeight="semibold"
                borderRadius="md"
                _hover={{ bg: "gray.50", color: "blue.600" }}
              >
                Profile
              </MenuItem>
              <MenuItem
                icon={<LuSettings size={18} />}
                fontSize="sm"
                fontWeight="semibold"
                borderRadius="md"
                _hover={{ bg: "gray.50", color: "blue.600" }}
              >
                Settings
              </MenuItem>
              <MenuItem
                icon={<IoKeyOutline size={18} />}
                fontSize="sm"
                fontWeight="semibold"
                borderRadius="md"
                _hover={{ bg: "gray.50", color: "blue.600" }}
                onClick={onPasswordOpen}
              >
                Change Password
              </MenuItem>
              <MenuDivider borderColor={borderColor} />
              <MenuItem
                icon={<LuLogOut size={18} />}
                fontSize="sm"
                fontWeight="semibold"
                color="red.600"
                borderRadius="md"
                _hover={{ bg: "red.50" }}
                onClick={handleLogout}
              >
                Log Out
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
      
      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isPasswordOpen} onClose={onPasswordClose} />
    </Box>
  );
};

export default Topbar;
