import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiFileText } from "react-icons/fi";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/api/v1/tenant";

const fmtDate = (d) => d ? dayjs(d).format("MMM D, YYYY") : "—";

export default function LeaseHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");

  const fetchLeases = async () => {
    try {
      const res = await fetch(`${API}/leases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLeases(data);
      } else {
        toast.error("Failed to load lease history");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="64">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Toaster position="top-right" />
      
      <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} letterSpacing="tight" color={textColor}>
            {t("lease.history") || "Lease History"}
          </Heading>
          <Text fontSize="sm" color={mutedText} mt={1}>
            View all your past and current rental agreements
          </Text>
        </Box>
      </Flex>

      {/* Desktop Table View */}
      <Box display={{ base: "none", md: "block" }} bg={bg} borderRadius="2xl" border="1px solid" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead bg={tableHBg}>
              <Tr>
                <Th>Room</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {leases.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={12}>
                    <VStack spacing={2}>
                      <Icon as={FiFileText} boxSize={10} color="gray.300" />
                      <Text color={mutedText}>No lease history found.</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                leases.map((lease) => (
                  <Tr 
                    key={lease.id} 
                    cursor="pointer" 
                    _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}
                    onClick={() => navigate(`/dashboard/lease/history/${lease.id}`)}
                  >
                    <Td fontSize="sm" fontWeight="bold" color={textColor}>
                      {lease.room?.name || "N/A"}
                    </Td>
                    <Td fontSize="sm" color={mutedText}>{fmtDate(lease.start_date)}</Td>
                    <Td fontSize="sm" color={mutedText}>{fmtDate(lease.end_date)}</Td>
                    <Td>
                      <Badge 
                        colorScheme={
                          lease.status === 'active' ? 'green' : 
                          lease.status === 'ended' ? 'gray' : 
                          lease.status === 'terminated' ? 'red' : 'orange'
                        }
                        textTransform="uppercase"
                        fontSize="10px"
                        px={2}
                        borderRadius="full"
                      >
                        {lease.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Card View */}
      <VStack display={{ base: "flex", md: "none" }} spacing={4} align="stretch">
        {leases.length === 0 ? (
          <Box bg={bg} p={8} textAlign="center" borderRadius="2xl" border="1px solid" borderColor={borderColor}>
            <Icon as={FiFileText} boxSize={10} color="gray.300" mb={2} />
            <Text color={mutedText}>No lease history found.</Text>
          </Box>
        ) : (
          leases.map((lease) => (
            <Box
              key={lease.id}
              bg={bg}
              p={5}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              onClick={() => navigate(`/dashboard/lease/history/${lease.id}`)}
              cursor="pointer"
              _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="bold" fontSize="lg" color={textColor}>
                  {lease.room?.name || "N/A"}
                </Text>
                <Badge
                  colorScheme={
                    lease.status === 'active' ? 'green' : 
                    lease.status === 'ended' ? 'gray' : 
                    lease.status === 'terminated' ? 'red' : 'orange'
                  }
                  textTransform="uppercase"
                  fontSize="10px"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {lease.status}
                </Badge>
              </Flex>
              
              <Flex justify="space-between" align="center" mt={2} pt={3} borderTop="1px solid" borderColor={borderColor}>
                <Box>
                  <Text fontSize="xs" color={mutedText} fontWeight="bold" textTransform="uppercase">Start Date</Text>
                  <Text fontSize="sm" color={textColor}>{fmtDate(lease.start_date)}</Text>
                </Box>
                <Box textAlign="right">
                  <Text fontSize="xs" color={mutedText} fontWeight="bold" textTransform="uppercase">End Date</Text>
                  <Text fontSize="sm" color={textColor}>{fmtDate(lease.end_date)}</Text>
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}