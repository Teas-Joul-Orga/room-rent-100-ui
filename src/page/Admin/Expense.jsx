import React, { useState, useEffect } from "react";
import {
  Box, Flex, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Button, useColorModeValue, Select, HStack, Input, InputGroup,
  InputLeftElement, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormLabel, FormControl, IconButton, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Badge, SimpleGrid, Icon
} from "@chakra-ui/react";
import { FiSearch, FiPlus, FiTrash2, FiCalendar, FiDollarSign, FiDownload } from "react-icons/fi";
import { exportToExcel } from "../../utils/exportExcel";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const API = "http://localhost:8000/api/v1";
const fmt = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rateItem = localStorage.getItem("exchangeRate");
    const r = rateItem ? Number(rateItem) : 4000;
    return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const toUSD = (n, explicitCurrency) => {
  const c = explicitCurrency || localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return (num / r).toFixed(2);
  }
  return num;
};

function Expense() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [sortField, setSortField] = useState("expense_date");
  const [sortDir, setSortDir] = useState("desc");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", amount: "", expense_date: dayjs().format('YYYY-MM-DD'), room_id: "", description: "", reference_number: "", currency: localStorage.getItem("currency") || "$" });

  // Delete Alert State
  const [deleteId, setDeleteId] = useState(null);
  const cancelRef = React.useRef();

  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const thBg = useColorModeValue("gray.50", "#1c2333");
  const trHoverBg = useColorModeValue("gray.50", "#1c2333");

  const headers = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFilters = async () => {
    try {
      const [resRooms, resCats] = await Promise.all([
        fetch(`${API}/admin/rooms?per_page=all&minimal=true`, { headers: headers() }),
        fetch(`${API}/admin/expense-categories`, { headers: headers() })
      ]);
      if (resRooms.ok) setRooms((await resRooms.json()).data || []);
      if (resCats.ok) setCategories(await resCats.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: "all",
        sort: sortField,
        direction: sortDir,
      });
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (roomFilter) params.append("room_id", roomFilter);

      const res = await fetch(`${API}/admin/expenses?${params.toString()}`, {
        headers: { ...headers(), Accept: "application/json" }
      });
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (e) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchExpenses, 400);
    return () => clearTimeout(delay);
  }, [search, categoryFilter, roomFilter, sortField, sortDir]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/expenses`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({...form, amount: toUSD(form.amount, form.currency)})
      });
      
      if (res.ok) {
        toast.success("Expense recorded successfully");
        setIsOpen(false);
        setForm({ title: "", category: categories[0] || "", amount: "", expense_date: dayjs().format('YYYY-MM-DD'), room_id: "", description: "", reference_number: "", currency: localStorage.getItem("currency") || "$" });
        fetchExpenses();
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to save expense");
      }
    } catch (e) { toast.error("Network error"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API}/admin/expenses/${deleteId}`, {
        method: "DELETE",
        headers: { ...headers(), Accept: "application/json" }
      });
      if (res.ok) {
        toast.success("Expense deleted");
        fetchExpenses();
      } else {
        toast.error("Failed to delete expense");
      }
    } catch (e) { toast.error("Network error"); }
    setDeleteId(null);
  };

  const handleSort = (field) => {
    setSortDir(sortField === field && sortDir === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" letterSpacing="tight" color={textColor}>
            {t("expense.title")}
          </Text>
          <Text fontSize="sm" color={mutedText}>
            {t("expense.subtitle")}
          </Text>
        </Box>
        
        <HStack spacing={3} wrap="wrap">
          <InputGroup size="sm" w="200px">
            <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
            <Input placeholder={t("expense.search")} value={search} onChange={e => setSearch(e.target.value)} bg={bg} borderRadius="md" />
          </InputGroup>
          
          <Select size="sm" w="150px" bg={bg} borderRadius="md" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">{t("expense.all_categories")}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <Select size="sm" w="150px" bg={bg} borderRadius="md" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}>
            <option value="">{t("expense.all_units")}</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>

          <Button
            size="sm"
            colorScheme="green"
            variant="outline"
            leftIcon={<FiDownload />}
            onClick={() => {
              const dataToExport = expenses.map(e => ({
                "Date": e.expense_date,
                "Item": e.title,
                "Unit": e.room?.name || 'General Building',
                "Category": e.category,
                "Amount": Number(e.amount),
                "Created At": new Date(e.created_at).toLocaleDateString()
              }));
              exportToExcel(dataToExport, "All_Expenses_" + new Date().toISOString().split('T')[0]);
            }}
          >
            Export Excel
          </Button>
          <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setIsOpen(true)}>
            {t("expense.add")}
          </Button>
        </HStack>
      </Flex>

      <Box bg={bg} borderRadius="xl" border="1px solid" borderColor={borderColor} overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" py={20}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
          </Flex>
        ) : (
          <TableContainer>
            <Table variant="simple" size="md">
              <Thead bg={thBg}>
                <Tr>
                  <Th cursor="pointer" onClick={() => handleSort('expense_date')}>
                    <Flex align="center" gap={1}>{t("expense.date")} {sortField === 'expense_date' && (sortDir === 'asc' ? '↑' : '↓')}</Flex>
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('title')}>
                    <Flex align="center" gap={1}>{t("expense.item_unit")} {sortField === 'title' && (sortDir === 'asc' ? '↑' : '↓')}</Flex>
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('category')}>
                    <Flex align="center" gap={1}>{t("expense.category")} {sortField === 'category' && (sortDir === 'asc' ? '↑' : '↓')}</Flex>
                  </Th>
                  <Th isNumeric cursor="pointer" onClick={() => handleSort('amount')}>
                    <Flex justify="flex-end" align="center" gap={1}>{t("expense.amount")} {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}</Flex>
                  </Th>
                  <Th w="50px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {expenses.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={12} color={mutedText}>{t("expense.no_data")}</Td>
                  </Tr>
                ) : (
                  expenses.map((expense) => (
                    <Tr key={expense.id} _hover={{ bg: trHoverBg }}>
                      <Td>
                        <Flex align="center" gap={2}>
                          <Icon as={FiCalendar} color={mutedText} />
                          <Text fontSize="sm" fontWeight="bold" color={textColor}>{dayjs(expense.expense_date).format('MMM D, YYYY')}</Text>
                        </Flex>
                      </Td>
                      <Td maxW="250px">
                        <Text fontSize="sm" fontWeight="black" textTransform="uppercase" color={textColor} isTruncated title={expense.title}>
                          {expense.title}
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="blue.500" isTruncated title={expense.room?.name}>
                          {expense.room?.name || 'General Building'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="gray" variant="subtle" px={2} borderRadius="md" fontSize="10px">
                          {expense.category.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" fontWeight="black" color="red.500">
                          -{fmt(expense.amount)}
                        </Text>
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Delete Expense"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setDeleteId(expense.id)}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add Expense Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={bg}>
          <form onSubmit={handleSubmit}>
            <ModalHeader>{t("expense.record_new")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("expense.item_unit")}</FormLabel>
                <Input size="sm" bg={bg} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>{t("expense.category")}</FormLabel>
                  <Select size="sm" bg={bg} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">{t("expense.select_cat")}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" color={mutedText}>{t("expense.target_unit")}</FormLabel>
                  <Select size="sm" bg={bg} value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
                    <option value="">{t("expense.general")}</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>{t("expense.amount")}</FormLabel>
                  <Flex gap={2}>
                    <Select w="80px" size="md" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                      <option value="$">$</option>
                      <option value="៛">៛</option>
                    </Select>
                    <InputGroup size="md">
                      <Input type="number" step="0.01" min="0" bg={bg} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </InputGroup>
                  </Flex>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color={mutedText}>{t("expense.date")}</FormLabel>
                  <Input size="sm" type="date" bg={bg} value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                </FormControl>
              </SimpleGrid>

              <FormControl mb={4}>
                <FormLabel fontSize="sm" color={mutedText}>{t("expense.notes")}</FormLabel>
                <Input size="sm" bg={bg} placeholder={t("expense.opt_notes")} value={form.reference_number || form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </FormControl>

            </ModalBody>
            <ModalFooter>
              <Button size="sm" variant="ghost" mr={3} onClick={() => setIsOpen(false)}>{t("common.cancel")}</Button>
              <Button size="sm" colorScheme="blue" type="submit">{t("expense.save")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog isOpen={!!deleteId} leastDestructiveRef={cancelRef} onClose={() => setDeleteId(null)} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600">
          <AlertDialogContent bg={bg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">{t("expense.del_title")}</AlertDialogHeader>
            <AlertDialogBody>{t("expense.del_desc")}</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>{t("common.delete")}</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default Expense;
