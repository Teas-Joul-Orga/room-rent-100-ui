import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useColorModeValue,
  Spinner,
  Text,
  HStack,
  Flex
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminWaitlistManagement() {
  const [waitlists, setWaitlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  useEffect(() => {
    fetchWaitlists();
  }, []);

  const fetchWaitlists = async () => {
    try {
      const res = await api.get("/admin/waitlists");
      setWaitlists(res.data);
    } catch (error) {
      toast.error("Failed to load waitlists");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotify = async (id) => {
    if (!window.confirm("Mark this tenant as notified?")) return;
    try {
      await api.post(`/admin/waitlists/${id}/notify`);
      toast.success("Tenant marked as notified");
      fetchWaitlists();
    } catch (error) {
      toast.error("Failed to notify tenant");
    }
  };

  const handleResolve = async (id) => {
    if (!window.confirm("Mark this waitlist as resolved?")) return;
    try {
      await api.post(`/admin/waitlists/${id}/resolve`);
      toast.success("Waitlist resolved");
      fetchWaitlists();
    } catch (error) {
      toast.error("Failed to resolve waitlist");
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      waiting: "orange",
      notified: "blue",
      resolved: "green",
    };
    return <Badge colorScheme={colorMap[status] || "gray"} px={2} py={1} borderRadius="full">{status}</Badge>;
  };

  if (isLoading) return <Flex justify="center" p={10}><Spinner /></Flex>;

  return (
    <Box p={6} bg={bg} borderRadius="xl" shadow="sm" border="1px" borderColor={useColorModeValue("gray.200", "gray.700")}>
      <Heading size="lg" mb={2} color={textColor}>
        Waitlist Management
      </Heading>
      <Text mb={6} color={useColorModeValue("gray.500", "gray.400")}>
        Manage tenants waiting for occupied rooms. Mark them as notified when a room becomes available.
      </Text>
      
      {waitlists.length === 0 ? (
        <Flex p={10} justify="center" bg={useColorModeValue("gray.50", "gray.900")} borderRadius="lg" borderStyle="dashed" borderWidth="2px">
          <Text color="gray.500" fontWeight="bold">No tenants currently on any waitlists.</Text>
        </Flex>
      ) : (
        <Box overflowX="auto" bg={useColorModeValue("white", "gray.800")} borderRadius="lg" shadow="sm">
          <Table variant="simple">
            <Thead bg={useColorModeValue("gray.50", "gray.900")}>
              <Tr>
                <Th py={4}>Tenant</Th>
                <Th py={4}>Room</Th>
                <Th py={4}>Status</Th>
                <Th py={4}>Joined At</Th>
                <Th py={4} textAlign="right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {waitlists.map((w) => (
                <Tr key={w.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                  <Td fontWeight="bold" color={textColor}>{w.tenant?.name}</Td>
                  <Td>{w.room?.name}</Td>
                  <Td>{getStatusBadge(w.status)}</Td>
                  <Td color={useColorModeValue("gray.600", "gray.400")}>
                    {new Date(w.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Td>
                  <Td textAlign="right">
                    {w.status !== "resolved" && (
                      <HStack spacing={2} justify="flex-end">
                        {w.status === "waiting" && (
                          <Button size="sm" colorScheme="blue" onClick={() => handleNotify(w.id)} borderRadius="full" px={4}>
                            Mark Notified
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" colorScheme="green" onClick={() => handleResolve(w.id)} borderRadius="full" px={4}>
                          Resolve
                        </Button>
                      </HStack>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
