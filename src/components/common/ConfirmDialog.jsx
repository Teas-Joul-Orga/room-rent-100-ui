import React from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Icon,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  type = "danger",
  isLoading = false 
}) => {
  const cancelRef = React.useRef();
  
  const headerBg = useColorModeValue("gray.50", "#161b22");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  
  const colorScheme = type === "danger" ? "red" : "blue";
  const iconColor = type === "danger" ? "red.500" : "blue.500";
  const iconBg = type === "danger" ? "red.50" : "blue.50";
  const iconBgDark = type === "danger" ? "red.900" : "blue.900";

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay backdropFilter="blur(4px)">
        <AlertDialogContent bg={cardBg} borderRadius="2xl" overflow="hidden" shadow="2xl" border="1px solid" borderColor={useColorModeValue("gray.100", "#30363d")}>
          <AlertDialogHeader px={6} pt={6} pb={0} fontSize="lg" fontWeight="black" color={textColor}>
            <Flex align="center" gap={3}>
              <Flex 
                p={2} 
                borderRadius="xl" 
                bg={useColorModeValue(iconBg, iconBgDark)} 
                color={iconColor}
              >
                <Icon as={FiAlertTriangle} boxSize={5} />
              </Flex>
              {title}
            </Flex>
          </AlertDialogHeader>

          <AlertDialogBody px={6} py={6}>
            <Text color={mutedText} fontSize="md">
              {message}
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter bg={headerBg} px={6} py={4} gap={3}>
            <Button ref={cancelRef} onClick={onClose} variant="ghost" fontWeight="bold">
              Cancel
            </Button>
            <Button 
              colorScheme={colorScheme} 
              onClick={onConfirm} 
              isLoading={isLoading}
              px={6}
              fontWeight="black"
              textTransform="uppercase"
              fontSize="xs"
              letterSpacing="widest"
              borderRadius="xl"
              shadow="md"
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmDialog;
