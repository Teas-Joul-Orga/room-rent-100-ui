import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Flex,
  Text,
  useColorModeValue,
  Spinner,
  Center,
  HStack,
  Button,
} from "@chakra-ui/react";
import EmptyState from "./EmptyState";

const DataTable = ({
  columns,
  data,
  isLoading,
  onSort,
  sortField,
  sortDir,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  pagination,
  emptyStateProps,
}) => {
  const tableHeaderBg = useColorModeValue("gray.50", "#1c2333");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const hoverBg = useColorModeValue("gray.50", "#21262d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  if (isLoading && (!data || data.length === 0)) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState {...emptyStateProps} />;
  }

  return (
    <Box w="full">
      <TableContainer 
        bg={useColorModeValue("white", "#161b22")} 
        borderRadius="xl" 
        border="1px solid" 
        borderColor={borderColor}
        shadow="sm"
        overflowY="auto"
      >
        <Table variant="simple" size="sm">
          <Thead bg={tableHeaderBg}>
            <Tr>
              {onSelectAll && (
                <Th w="50px">
                  <Checkbox
                    isChecked={data.length > 0 && selectedIds.length === data.length}
                    isIndeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    colorScheme="blue"
                  />
                </Th>
              )}
              {columns.map((col) => (
                <Th
                  key={col.key}
                  cursor={col.sortable ? "pointer" : "default"}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                  whiteSpace="nowrap"
                  py={4}
                  color={mutedText}
                  fontWeight="black"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  fontSize="10px"
                >
                  <Flex align="center" gap={2}>
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      <Text as="span" color="blue.500">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </Text>
                    )}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, index) => (
              <Tr 
                key={item.id || item.uid || index} 
                _hover={{ bg: hoverBg }} 
                transition="all 0.2s"
              >
                {onSelectOne && (
                  <Td>
                    <Checkbox
                      isChecked={selectedIds.includes(item.uid || item.id)}
                      onChange={(e) => onSelectOne(item.uid || item.id, e.target.checked)}
                      colorScheme="blue"
                    />
                  </Td>
                )}
                {columns.map((col) => (
                  <Td key={col.key} py={4} color={textColor} fontWeight="medium">
                    {col.render ? col.render(item) : (item[col.key] || "N/A")}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {pagination && (
        <Flex justify="space-between" align="center" mt={4} px={2}>
          <Text fontSize="xs" color={mutedText} fontWeight="bold">
            Showing {data.length} results
          </Text>
          <HStack spacing={2}>
            <Button
              size="xs"
              variant="outline"
              isDisabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              fontWeight="bold"
            >
              Prev
            </Button>
            <Text fontSize="xs" fontWeight="black" px={2}>
              {pagination.currentPage} / {pagination.totalPages || 1}
            </Text>
            <Button
              size="xs"
              variant="outline"
              isDisabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              fontWeight="bold"
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

// Wrap in Box to avoid TableContainer overflow issues
import { Box } from "@chakra-ui/react";

export default DataTable;
