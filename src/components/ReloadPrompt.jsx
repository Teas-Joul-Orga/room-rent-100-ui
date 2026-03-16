import React, { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import toast from "react-hot-toast";
import { Button, Flex, Text, Box, Icon } from "@chakra-ui/react";
import { IoRefreshOutline } from "react-icons/io5";

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("PWA Service Worker registered");
    },
    onRegisterError(error) {
      console.error("PWA Service Worker registration error", error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (needRefresh) {
      // Use react-hot-toast for the update notification
      toast(
        (t) => (
          <Flex align="center" gap={4} py={1}>
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.800">
                New Update Available
              </Text>
              <Text fontSize="xs" color="gray.500">
                Refresh to see the latest changes and fixes.
              </Text>
            </Box>
            <Button
              size="xs"
              colorScheme="blue"
              leftIcon={<Icon as={IoRefreshOutline} />}
              onClick={() => {
                updateServiceWorker(true);
                toast.dismiss(t.id);
              }}
              shadow="sm"
              _hover={{ transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
            >
              Update
            </Button>
          </Flex>
        ),
        {
          duration: Infinity,
          position: "bottom-right",
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#333",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #E2E8F0",
            maxWidth: "400px",
          },
        }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}

export default ReloadPrompt;
