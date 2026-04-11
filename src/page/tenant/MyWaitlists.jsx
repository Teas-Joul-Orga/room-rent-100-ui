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
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function MyWaitlists() {
  const [waitlists, setWaitlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  useEffect(() => {
    fetchWaitlists();
  }, []);

  const fetchWaitlists = async () => {
    try {
      const res = await api.get("/tenant/waitlists");
      setWaitlists(res.data);
    } catch (error) {
      toast.error("Failed to load waitlists");
    } finally {
      setIsLoading(false);
    }
  };

  const leaveWaitlist = async (id) => {
    try {
      await api.delete(`/tenant/waitlists/${id}`);
      toast.success("Left waitlist successfully");
      fetchWaitlists();
    } catch (error) {
      toast.error("Failed to leave waitlist");
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      waiting: "yellow",
      notified: "green",
      resolved: "gray",
    };
    return <Badge colorScheme={colorMap[status] || "gray"}>{status}</Badge>;
  };

  if (isLoading) {
    return <Spinner mt={10} />;
  }

  return (
    <Box p={6} bg={bg} borderRadius="lg" shadow="sm">
      <Heading size="lg" mb={6} color={textColor}>
        My Waitlists
      </Heading>
      {waitlists.length === 0 ? (
        <Text>You are not on any waitlists.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Room</Th>
                <Th>Status</Th>
                <Th>Joined At</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {waitlists.map((w) => (
                <Tr key={w.id}>
                  <Td>{w.room?.name}</Td>
                  <Td>{getStatusBadge(w.status)}</Td>
                  <Td>{new Date(w.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {w.status !== "resolved" && (
                      <Button size="sm" colorScheme="red" onClick={() => leaveWaitlist(w.id)}>
                        Leave Waitlist
                      </Button>
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
