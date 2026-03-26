import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  Box, Flex, Text, Heading, Badge, Spinner, Button, Avatar,
  SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, useDisclosure, FormControl, FormLabel,
  Input, Select, Textarea, Checkbox, IconButton, Tooltip,
  useColorModeValue, Divider, VStack, HStack, Stack, Icon, Image,
  Stat, StatLabel, StatNumber, StatHelpText, StatGroup, Grid, GridItem
} from "@chakra-ui/react";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiPrinter, FiDollarSign, FiBell,
  FiRefreshCw, FiXCircle, FiClock, FiCheckCircle, FiAlertCircle,
  FiTool, FiTrendingDown, FiZap, FiDroplet, FiImage
} from "react-icons/fi";

const API = "http://localhost:8000/api/v1/admin";

const getDefaultRate = (type) => {
  const rawUSD = type === "electricity" ? localStorage.getItem("utility_rate_electricity")
                : type === "water"       ? localStorage.getItem("utility_rate_water")
                : null;
  if (!rawUSD) return "";
  const c = localStorage.getItem("currency") || "$";
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const rate = Number(localStorage.getItem("exchangeRate") || 4000);
    return (Number(rawUSD) * rate).toFixed(0);
  }
  return rawUSD;
};

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

const toCurrent = (n) => {
  const c = localStorage.getItem("currency") || "$";
  const num = Number(n || 0);
  if (c === "៛" || c === "KHR" || c === "Riel") {
    const r = Number(localStorage.getItem("exchangeRate") || 4000);
    return Math.round(num * r);
  }
  return num;
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

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function ViewLease() {
  const { id } = useParams(); // uid
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lease, setLease] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  // Payment modal
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure();
  const [payForm, setPayForm] = useState({ type: "rent", amount_paid: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], notes: "", currency: localStorage.getItem("currency") || "$" });
  const [isSavingPay, setIsSavingPay] = useState(false);

  // Bill modal
  const { isOpen: isBillOpen, onOpen: onBillOpen, onClose: onBillClose } = useDisclosure();
  const [billForm, setBillForm] = useState({ type: "electricity", amount: "", due_date: "", status: "unpaid", description: "", previous_reading: "", current_reading: "", cost_per_unit: getDefaultRate("electricity"), currency: localStorage.getItem("currency") || "$" });
  const [isSavingBill, setIsSavingBill] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [lastReading, setLastReading] = useState(0);

  const isMetered = ["electricity", "water"].includes(billForm.type);
  const usage = isMetered ? Math.max(0, Number(billForm.current_reading || 0) - Number(billForm.previous_reading || 0)) : 0;

  // Pay-All/Selected modal
  const { isOpen: isPayAllOpen, onOpen: onPayAllOpen, onClose: onPayAllClose } = useDisclosure();
  const [payAllForm, setPayAllForm] = useState({ payment_date: new Date().toISOString().split("T")[0], payment_method: "cash", notes: "" });
  const [isPayingAll, setIsPayingAll] = useState(false);

  // Refund modal
  const { isOpen: isRefundOpen, onOpen: onRefundOpen, onClose: onRefundClose } = useDisclosure();
  const [refundForm, setRefundForm] = useState({ amount: "", notes: "" });
  const [isRefunding, setIsRefunding] = useState(false);

  // Edit Lease modal
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editForm, setEditForm] = useState({ tenant_id: "", room_id: "", start_date: "", end_date: "", rent_amount: "", security_deposit: 0, status: "active", deposit_status: "unpaid" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPrintingContract, setIsPrintingContract] = useState(false);
  const [allTenants, setAllTenants] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [tenantSearch, setTenantSearch] = useState("");
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  // Renew Lease modal
  const { isOpen: isRenewOpen, onOpen: onRenewOpen, onClose: onRenewClose } = useDisclosure();
  const [renewForm, setRenewForm] = useState({ start_date: "", end_date: "", rent_amount: "" });
  const [isRenewing, setIsRenewing] = useState(false);

  // Terminate Lease modal
  const { isOpen: isTerminateOpen, onOpen: onTerminateOpen, onClose: onTerminateClose } = useDisclosure();
  const [isTerminating, setIsTerminating] = useState(false);

  // Rent notification
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isGeneratingRent, setIsGeneratingRent] = useState(false);

  // Maintenance
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isFetchingMaintenance, setIsFetchingMaintenance] = useState(false);
  const { isOpen: isMaintOpen, onOpen: onMaintOpen, onClose: onMaintClose } = useDisclosure();
  const [maintForm, setMaintForm] = useState({ title: "", description: "", priority: "normal", status: "pending" });
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  // Expenses
  const [roomExpenses, setRoomExpenses] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isFetchingExpenses, setIsFetchingExpenses] = useState(false);
  const { isOpen: isExpOpen, onOpen: onExpOpen, onClose: onExpClose } = useDisclosure();
  const [expForm, setExpForm] = useState({ title: "", category: "Repairs", amount: "", expense_date: new Date().toISOString().split("T")[0], description: "" });
  const [isSavingExp, setIsSavingExp] = useState(false);

  const bg = useColorModeValue("gray.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const tableHBg = useColorModeValue("gray.50", "#1c2333");
  const inputBg = useColorModeValue("white", "#0d1117");
  const subCardBg = useColorModeValue("gray.50", "#1c2128");
  const highlightBg = useColorModeValue("yellow.50", "yellow.900");
  const successBg = useColorModeValue("green.50", "green.900");
  const purpleBg = useColorModeValue("purple.50", "purple.900");
  const dangerBg = useColorModeValue("red.50", "red.900");
  const warningBg = useColorModeValue("orange.50", "orange.900");
  const cautionBg = useColorModeValue("yellow.50", "yellow.900");

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const fetchMaintenance = useCallback(async (roomId) => {
    if (!roomId) return;
    setIsFetchingMaintenance(true);
    try {
      const res = await fetch(`${API}/maintenance?room_id=${roomId}`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setMaintenanceRequests(data.data || data);
    } catch (e) { console.error(e);  console.error(e); }
    finally { setIsFetchingMaintenance(false); }
  }, []);

  const fetchExpenses = useCallback(async (roomId) => {
    if (!roomId) return;
    setIsFetchingExpenses(true);
    try {
      const res = await fetch(`${API}/expenses?room_id=${roomId}`, { headers: headers() });
      const data = await res.json();
      if (res.ok) setRoomExpenses(data.data || data);
    } catch (e) { console.error(e);  console.error(e); }
    finally { setIsFetchingExpenses(false); }
  }, []);

  const fetchLease = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API}/leases/${id}`, { headers: headers() });
      const data = await resp.json();
      if (resp.ok) {
        const leaseData = data.data || data;
        setLease(leaseData);
        fetchMaintenance(leaseData.room_id);
        fetchExpenses(leaseData.room_id);
      } else {
        toast.error("Failed to load lease details");
      }
    } catch (e) { console.error(e); 
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchMaintenance, fetchExpenses]);

  useEffect(() => { fetchLease(); }, [fetchLease]);

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      const res = await fetch(`${API}/payments/${paymentId}`, { method: "DELETE", headers: headers() });
      if (res.ok) { toast.success("Payment deleted"); fetchLease(); }
      else toast.error("Failed to delete payment");
    } catch (e) { console.error(e);  toast.error("Network error"); }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Delete this utility bill?")) return;
    try {
      const res = await fetch(`${API}/utility-bills/${billId}`, { method: "DELETE", headers: headers() });
      if (res.ok) { toast.success("Bill deleted"); fetchLease(); }
      else toast.error("Failed to delete bill");
    } catch (e) { console.error(e);  toast.error("Network error"); }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setIsSavingPay(true);
    try {
      const res = await fetch(`${API}/payments`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ 
          ...payForm, 
          amount_paid: toUSD(payForm.amount_paid, payForm.currency),
          lease_id: lease.id 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payment recorded");
        onPayClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to save payment");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSavingPay(false); }
  };

  // Fetch last meter reading when bill type changes
  const fetchLastReading = async (type) => {
    if (!lease || !["electricity", "water"].includes(type)) { setLastReading(0); return; }
    try {
      const res = await fetch(`${API}/utility-bills/last-reading/${lease.room_id}?type=${type}`, { headers: headers() });
      const data = await res.json();
      const reading = parseFloat(data.reading) || 0;
      setLastReading(reading);
      setBillForm(prev => ({ ...prev, previous_reading: reading }));
    } catch (e) { console.error(e);  setLastReading(0); }
  };

  // Auto-calculate amount when meter values change
  useEffect(() => {
    if (isMetered && billForm.cost_per_unit) {
      const calc = (usage * Number(billForm.cost_per_unit)).toFixed(2);
      setBillForm(prev => ({ ...prev, amount: calc }));
    }
  }, [billForm.current_reading, billForm.previous_reading, billForm.cost_per_unit]);

  // Fetch reading when bill type changes and auto-populate rate
  useEffect(() => {
    if (isBillOpen) {
      fetchLastReading(billForm.type);
      // Auto-fill rate from settings if field is empty
      const savedRate = getDefaultRate(billForm.type);
      if (savedRate) {
        setBillForm(prev => ({ ...prev, cost_per_unit: savedRate }));
      }
    }
  }, [billForm.type, isBillOpen]);

  const handleSaveBill = async (e) => {
    e.preventDefault();
    setIsSavingBill(true);
    try {
      const res = await fetch(`${API}/utility-bills`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ 
          ...billForm, 
          amount: toUSD(billForm.amount, billForm.currency),
          cost_per_unit: toUSD(billForm.cost_per_unit, billForm.currency),
          room_id: lease.room_id, 
          lease_id: lease.id 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Utility bill added");
        onBillClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to save bill");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSavingBill(false); }
  };

  // Pay Selected Bills
  const handlePaySelected = async (e) => {
    e.preventDefault();
    if (selectedBillIds.length === 0) { toast.error("Select bills to pay first."); return; }
    setIsPayingAll(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}/utility-bills/pay-selected`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ bill_ids: selectedBillIds, ...payAllForm }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Bills paid successfully");
        onPayAllClose();
        setSelectedBillIds([]);
        fetchLease();

        // Auto-print receipt
        if (data.payment_id) {
          try {
            const receiptRes = await fetch(`${API}/payments/print-receipt`, {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ payment_ids: [data.payment_id] }),
            });
            if (receiptRes.ok) {
              const blob = await receiptRes.blob();
              const url = window.URL.createObjectURL(blob);
              window.open(url, "_blank");
            }
          } catch (err) { console.error("Failed to auto-print receipt:", err); }
        }
      } else {
        toast.error(data.error || data.message || "Failed to pay bills");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsPayingAll(false); }
  };

  // Refund Deposit
  const handleRefundDeposit = async (e) => {
    e.preventDefault();
    setIsRefunding(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}/refund-deposit`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...refundForm,
          amount: toUSD(refundForm.amount)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Deposit refunded");
        onRefundClose();
        fetchLease();
      } else {
        toast.error(data.error || data.message || "Failed to refund deposit");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsRefunding(false); }
  };

  // Edit Lease
  const handleEditLease = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          ...editForm,
          rent_amount: toUSD(editForm.rent_amount),
          security_deposit: toUSD(editForm.security_deposit)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Lease updated successfully");
        onEditClose();
        fetchLease();
      } else {
        toast.error(data.message || "Failed to update lease");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSavingEdit(false); }
  };

  // Send Bill Notification
  const handleSendNotification = async (billId) => {
    if (!window.confirm("Send a reminder notification for this bill?")) return;
    try {
      const res = await fetch(`${API}/utility-bills/${billId}/notify`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message || "Notification sent");
      else toast.error(data.error || "Failed to send notification");
    } catch (e) { console.error(e);  toast.error("Network error"); }
  };

  // Print Invoice for selected bills
  const handlePrintInvoice = () => {
    if (selectedBillIds.length === 0) { toast.error("Select bills to print."); return; }
    
    const queryParams = new URLSearchParams();
    selectedBillIds.forEach(id => queryParams.append('bill_ids[]', id));
    queryParams.append('token', localStorage.getItem("token"));
    
    const printUrl = `http://localhost:8000/api/v1/admin/print/invoice?${queryParams.toString()}`;
    window.open(printUrl, "_blank");
  };

  // Print Receipt for selected/given payment IDs
  const handlePrintReceipt = (paymentIds) => {
    const ids = Array.isArray(paymentIds) ? paymentIds : [paymentIds];
    if (ids.length === 0) { toast.error("Select payments to print."); return; }
    
    const queryParams = new URLSearchParams();
    ids.forEach(id => queryParams.append('payment_ids[]', id));
    queryParams.append('token', localStorage.getItem("token"));
    
    const printUrl = `http://localhost:8000/api/v1/admin/print/receipt?${queryParams.toString()}`;
    window.open(printUrl, "_blank");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return { bg: "green.100", color: "green.700" };
      case "expired": return { bg: "red.100", color: "red.700" };
      case "terminated": return { bg: "gray.200", color: "gray.700" };
      default: return { bg: "gray.100", color: "gray.600" };
    }
  };

  const handlePrintContract = () => {
    setIsPrintingContract(true);
    const printUrl = `http://localhost:8000/api/v1/admin/print/contract/${id}?token=${localStorage.getItem("token")}`;
    window.open(printUrl, "_blank");
    setTimeout(() => setIsPrintingContract(false), 1000);
  };

  // Renew Lease
  const handleRenewLease = async (e) => {
    e.preventDefault();
    setIsRenewing(true);
    try {
      const res = await fetch(`${API}/leases/bulk-renew`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          renewals: [{
            id: lease.id,
            start_date: renewForm.start_date,
            end_date: renewForm.end_date,
            rent_amount: toUSD(renewForm.rent_amount),
          }]
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Lease renewed successfully!");
        onRenewClose();
        fetchLease();
      } else {
        toast.error(data.error || data.message || "Failed to renew lease");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsRenewing(false); }
  };

  // Terminate Lease
  const handleTerminateLease = async () => {
    setIsTerminating(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          tenant_id: lease.tenant?.id,
          room_id: lease.room?.id,
          start_date: lease.start_date?.split("T")[0],
          end_date: lease.end_date?.split("T")[0],
          rent_amount: lease.rent_amount,
          security_deposit: lease.security_deposit,
          deposit_status: lease.deposit_status || "unpaid",
          status: "terminated",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Lease terminated. Room is now available.");
        onTerminateClose();
        fetchLease();
      } else {
        toast.error(data.error || data.message || "Failed to terminate lease");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsTerminating(false); }
  };

  // Send Rent Reminder
  const handleSendRentReminder = async () => {
    setIsSendingReminder(true);
    try {
      const res = await fetch(`${API}/leases/${lease.uid}/notify-rent`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Rent reminder sent!");
      } else {
        toast.error(data.error || "Failed to send reminder");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSendingReminder(false); }
  };

  // Generate Monthly Rent
  const handleGenerateRent = async () => {
    setIsGeneratingRent(true);
    try {
      const res = await fetch(`${API}/leases/generate-rent`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ lease_id: lease.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Monthly rent generated!");
        fetchLease();
      } else {
        toast.error(data.error || "Failed to generate rent");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsGeneratingRent(false); }
  };

  // Maintenance Handlers
  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setIsSavingMaint(true);
    try {
      const res = await fetch(`${API}/maintenance`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...maintForm,
          room_id: lease.room_id,
          tenant_id: lease.tenant_id,
        })
      });
      if (res.ok) {
        toast.success("Maintenance request created!");
        onMaintClose();
        fetchMaintenance(lease.room_id);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create request");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSavingMaint(false); }
  };

  const handleUpdateMaintStatus = async (maintId, status) => {
    try {
      const res = await fetch(`${API}/maintenance/${maintId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success("Status updated!");
        fetchMaintenance(lease.room_id);
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
  };

  // Expense Handlers
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setIsSavingExp(true);
    try {
      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...expForm,
          room_id: lease.room_id
        })
      });
      if (res.ok) {
        toast.success("Expense recorded!");
        onExpClose();
        fetchExpenses(lease.room_id);
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to record expense");
      }
    } catch (e) { console.error(e);  toast.error("Network error"); }
    finally { setIsSavingExp(false); }
  };

  const totalContractValue = lease ? Number(lease.rent_amount) * (
    Math.max(1, Math.round((new Date(lease.end_date) - new Date(lease.start_date)) / (1000 * 60 * 60 * 24 * 30)))
  ) : 0;
  const totalRentPaid = lease ? (lease.payments || []).filter(p => p.type === "rent").reduce((s, p) => s + Number(p.amount_paid), 0) : 0;
  const unpaidBillsTotal = lease ? (lease.utility_bills || []).filter(b => b.status === "unpaid").reduce((s, b) => s + Number(b.amount), 0) : 0;

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (!lease) {
    return (
      <Box minH="100vh" bg={bg} display="flex" alignItems="center" justifyContent="center">
        <Text color={mutedText}>Lease not found.</Text>
      </Box>
    );
  }

  const statusBadge = getStatusBadge(lease.status);

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Toaster position="top-right" />
      <Box maxW="full" mx="auto">

        {/* Header */}
        <Flex align="center" justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Flex align="center" gap={3}>
            <IconButton
              icon={<FiArrowLeft />}
              size="sm"
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="Back"
            />
            <Box>
              <Heading size="md" color={textColor}>{t("lease.statement")}</Heading>
              <Text fontSize="sm" fontWeight="black" color={mutedText} mt={0.5}>
                Lease Reference: #{String(lease.uid).substring(0,8)}
              </Text>
            </Box>
          </Flex>
          <Flex gap={2} flexWrap="wrap">
            {/* Rent Reminder — only if outstanding rent */}
            {lease.status === "active" && totalRentPaid < totalContractValue && (
              <Button
                leftIcon={<FiBell />}
                size="sm"
                colorScheme="orange"
                variant="outline"
                isLoading={isSendingReminder}
                loadingText="Sending..."
                onClick={handleSendRentReminder}
              >
                Rent Reminder
              </Button>
            )}

            <Button
              leftIcon={<FiPrinter />}
              size="sm"
              colorScheme="purple"
              variant="outline"
              isLoading={isPrintingContract}
              loadingText="Generating..."
              onClick={handlePrintContract}
            >
              Print Contract
            </Button>

            {/* Renew — only for active/expired leases */}
            {(lease.status === "active" || lease.status === "expired") && (
              <Button
                leftIcon={<FiRefreshCw />}
                size="sm"
                colorScheme="teal"
                variant="solid"
                onClick={() => {
                  const endDate = lease.end_date ? lease.end_date.split("T")[0] : new Date().toISOString().split("T")[0];
                  const newEnd = new Date(endDate);
                  newEnd.setFullYear(newEnd.getFullYear() + 1);
                  setRenewForm({
                    start_date: endDate,
                    end_date: newEnd.toISOString().split("T")[0],
                    rent_amount: toCurrent(lease.rent_amount),
                  });
                  onRenewOpen();
                }}
              >
                Renew
              </Button>
            )}

            <Button
              leftIcon={<FiEdit2 />}
              size="sm"
              colorScheme="gray"
              onClick={() => {
                setEditForm({
                  tenant_id: lease.tenant?.id || "",
                  room_id: lease.room?.id || "",
                  start_date: lease.start_date ? lease.start_date.split("T")[0] : "",
                  end_date: lease.end_date ? lease.end_date.split("T")[0] : "",
                  rent_amount: toCurrent(lease.rent_amount),
                  security_deposit: toCurrent(lease.security_deposit),
                  status: lease.status || "active",
                  deposit_status: lease.deposit_status || "unpaid",
                });
                setTenantSearch("");
                setShowTenantDropdown(false);
                onEditOpen();
                const token = localStorage.getItem("token");
                const h = { Authorization: `Bearer ${token}`, Accept: "application/json" };
                Promise.all([
                  fetch(`${API}/tenants?per_page=all`, { headers: h }),
                  fetch(`${API}/rooms?per_page=all`, { headers: h }),
                ]).then(async ([tRes, rRes]) => {
                  if (tRes.ok) { const d = await tRes.json(); setAllTenants(d.data || d); }
                  if (rRes.ok) { const d = await rRes.json(); setAllRooms(d.data || d); }
                }).catch(err => console.error(err));
              }}
            >
              Edit
            </Button>

            {/* Terminate — only for active leases */}
            {lease.status === "active" && (
              <Button
                leftIcon={<FiXCircle />}
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={onTerminateOpen}
              >
                Terminate
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Resident & Lease Profile */}
        <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} p={8} mb={6}>
          <Flex direction={{ base: "column", xl: "row" }} gap={8} align={{ xl: "start" }}>

            {/* Avatar + Status */}
            <Flex direction="column" align="center" gap={3} flexShrink={0}>
              <Box position="relative">
                <Avatar
                  name={lease.tenant?.name}
                  src={lease.tenant?.photo_path ? `http://localhost:8000/storage/${lease.tenant.photo_path}` : undefined}
                  size="xl"
                  borderRadius="xl"
                  shadow="lg"
                />
                <Box
                  position="absolute"
                  bottom="-2"
                  right="-2"
                  bg="white"
                  p={1}
                  borderRadius="lg"
                  shadow="md"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Box
                    h={3} w={3}
                    borderRadius="full"
                    bg={lease.status === "active" ? "green.500" : "red.500"}
                  />
                </Box>
              </Box>
              <Badge
                bg={statusBadge.bg}
                color={statusBadge.color}
                px={4} py={1.5}
                borderRadius="full"
                fontSize="xs"
                fontWeight="black"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {lease.status}
              </Badge>
            </Flex>

            {/* Info */}
            <Box flex={1}>
              <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} borderBottom="1px solid" borderColor={borderColor} pb={5} mb={5}>
                <Box>
                  <Heading size="lg" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    {lease.room?.name || "Unknown Room"}
                  </Heading>
                  <Text fontSize="sm" fontWeight="black" color={mutedText} mt={1} textTransform="uppercase" letterSpacing="tight">
                    {fmtDate(lease.start_date)} — {fmtDate(lease.end_date)}
                  </Text>
                </Box>
                <Box textAlign={{ md: "right" }} mt={{ base: 3, md: 0 }}>
                  <Text fontSize="md" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    {lease.tenant?.name || "Unknown"}
                  </Text>
                  <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={1}>
                    Resident Profile
                  </Text>
                </Box>
              </Flex>

              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                <Box>
                   <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("lease.email")}</Text>
                  <Text fontSize="md" fontWeight="bold" color={textColor} wordBreak="break-all">{lease.tenant?.email || "—"}</Text>
                </Box>
                <Box>
                   <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("lease.phone")}</Text>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>{lease.tenant?.phone || "N/A"}</Text>
                </Box>
                <Box>
                   <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("lease.occupation")}</Text>
                  <Text fontSize="md" fontWeight="bold" color={textColor} textTransform="uppercase">{lease.tenant?.job || "N/A"}</Text>
                </Box>
                <Box>
                   <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>{t("lease.deposit_status")}</Text>
                  <Badge
                    fontSize="xs"
                    px={3} py={1}
                    colorScheme={lease.deposit_status === "held" ? "green" : lease.deposit_status === "refunded" ? "gray" : "orange"}
                    textTransform="uppercase"
                  >
                    {lease.deposit_status || "unpaid"}
                  </Badge>
                </Box>
              </SimpleGrid>

              {/* Room Details Row */}
              <Divider my={6} borderColor={borderColor} />
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <FiZap size={14} color="#ECC94B" />
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Floor & Size</Text>
                  </Flex>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>
                    Floor {lease.room?.floor || "—"} • {lease.room?.size || "—"} m²
                  </Text>
                </Box>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <FiZap size={14} color="#ECC94B" />
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Electricity Reading</Text>
                  </Flex>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>{lease.room?.electricity_reading || "0"} kWh</Text>
                </Box>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <FiDroplet size={14} color="#4299E1" />
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Water Reading</Text>
                  </Flex>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>{lease.room?.water_reading || "0"} m³</Text>
                </Box>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <FiZap size={14} color="#ECC94B" />
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Base Price</Text>
                  </Flex>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>{fmt(lease.room?.base_rent_price)}</Text>
                </Box>
              </SimpleGrid>
            </Box>
          </Flex>
        </Box>



        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          {/* Monthly Rent */}
          <Box bg={cardBg} p={8} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">{t("lease.monthly_rent")}</Text>
              {lease.status === "active" && (
                <Tooltip label="Generate Invoice for This Month" hasArrow>
                  <IconButton
                    icon={<FiPlus />}
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    isLoading={isGeneratingRent}
                    onClick={handleGenerateRent}
                    aria-label="Generate rent"
                  />
                </Tooltip>
              )}
            </Flex>
            <Heading size="xl" fontWeight="black" color={textColor}>{fmt(lease.rent_amount)}</Heading>
            {totalRentPaid >= totalContractValue ? (
              <Text mt={4} fontSize="xs" fontWeight="black" textTransform="uppercase" color="green.600">
                ✓ Fully Paid
              </Text>
            ) : (
              <Button mt={4} size="sm" colorScheme="blue" variant="link" leftIcon={<FiDollarSign />} onClick={() => { setPayForm({ ...payForm, type: "rent", amount_paid: toCurrent(lease.rent_amount), currency: localStorage.getItem("currency") || "$" }); onPayOpen(); }}>
                {t("lease.record_payment")} →
              </Button>
            )}
          </Box>

          {/* Security Deposit */}
          <Box bg={cardBg} p={8} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} position="relative">
            <Badge position="absolute" top={8} right={8} fontSize="xs" fontWeight="black" textTransform="uppercase" colorScheme={lease.deposit_status === "held" ? "green" : "gray"} variant="outline" px={3} py={1}>
              {lease.deposit_status || "unpaid"}
            </Badge>
            <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>{t("lease.security_deposit")}</Text>
            <Heading size="xl" fontWeight="black" color={textColor}>{fmt(lease.security_deposit)}</Heading>
            {(!lease.deposit_status || lease.deposit_status === "unpaid") && (
              <Button mt={4} size="sm" colorScheme="green" variant="link" onClick={() => { setPayForm({ ...payForm, type: "deposit", amount_paid: toCurrent(lease.security_deposit), currency: localStorage.getItem("currency") || "$" }); onPayOpen(); }}>
                {t("lease.collect_deposit")} →
              </Button>
            )}
            {lease.deposit_status === "held" && (
              <Button mt={4} size="sm" colorScheme="orange" variant="link" onClick={() => { setRefundForm({ amount: toCurrent(lease.security_deposit), notes: "" }); onRefundOpen(); }}>
                {t("lease.initiate_refund")} →
              </Button>
            )}
          </Box>

          {/* Unpaid Utilities */}
          <Box bg="gray.900" p={8} borderRadius="xl" shadow="xl">
            <Text fontSize="xs" fontWeight="black" color="blue.400" textTransform="uppercase" letterSpacing="wider" mb={2}>{t("lease.unpaid_utilities")}</Text>
            <Heading size="xl" fontWeight="black" color="white">{fmt(unpaidBillsTotal)}</Heading>
            <Button mt={4} size="sm" color="blue.400" variant="link" _hover={{ color: "white" }}>
               {t("lease.manage_bills")} →
            </Button>
          </Box>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs variant="line" colorScheme="blue" isLazy>
          <Flex direction={{ base: "column", md: "row" }} align={{ md: "center" }} justify="space-between" borderBottom="1px solid" borderColor={borderColor} mb={0}>
            <TabList border="none">
              <Tab fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                {t("lease.utility_statement")}
              </Tab>
              <Tab fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                {t("lease.payment_ledger")}
              </Tab>
              <Tab fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                <Flex align="center" gap={1.5}><FiTool size={13} /> Maintenance</Flex>
              </Tab>
              <Tab fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                <Flex align="center" gap={1.5}><FiTrendingDown size={13} /> Expenses</Flex>
              </Tab>
              <Tab fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" pb={4}>
                <Flex align="center" gap={1.5}><FiClock size={13} /> Timeline</Flex>
              </Tab>
            </TabList>
            <Text fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color="gray.400" pb={{ md: 2 }}>
              Transaction History
            </Text>
          </Flex>

          <TabPanels>
            {/* ===== UTILITY BILLS TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                    {t("lease.utility_statement")}
                  </Text>
                  <Flex align="center" gap={4}>
                    {selectedBillIds.length > 0 && (
                      <Button size="xs" colorScheme="purple" variant="link" leftIcon={<FiPrinter />} onClick={handlePrintInvoice}>
                        Print Invoice ({selectedBillIds.length})
                      </Button>
                    )}
                    <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onBillOpen}>
                      {t("lease.add_new_bill")}
                    </Button>
                    {unpaidBillsTotal > 0 && (
                      <Button
                        size="xs"
                        colorScheme={selectedBillIds.length > 0 ? "green" : "gray"}
                        onClick={onPayAllOpen}
                      >
                        {selectedBillIds.length > 0 ? `Pay Selected (${selectedBillIds.length})` : t("lease.pay_bills")}
                      </Button>
                    )}
                  </Flex>
                </Flex>

                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th w="40px"><Checkbox onChange={(e) => {
                          const bills = lease.utility_bills || [];
                          setSelectedBillIds(e.target.checked ? bills.map(b => b.id) : []);
                        }} /></Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.type")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.amount")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("lease.due_date") || "Due Date"}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.status")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.description")}</Th>
                        <Th textAlign="right" py={4}></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(lease.utility_bills || []).length === 0 ?
                        <Tr><Td colSpan={7} textAlign="center" py={10} color={mutedText}>{t("utility.no_bills")}</Td></Tr>
                      :
                        [...(lease.utility_bills || [])].sort((a, b) => new Date(b.due_date) - new Date(a.due_date)).map(bill => {
                          return (
                            <Tr key={bill.id} bg={selectedBillIds.includes(bill.id) ? successBg : "transparent"}>
                              <Td><Checkbox isChecked={selectedBillIds.includes(bill.id)} onChange={(e) => {
                                setSelectedBillIds(e.target.checked ? [...selectedBillIds, bill.id] : selectedBillIds.filter(i => i !== bill.id));
                              }} /></Td>
                              <Td>
                                <Badge fontSize="xs" fontWeight="black" textTransform="uppercase" colorScheme={
                                  bill.type === "electricity" ? "yellow" : bill.type === "water" ? "blue" : "gray"
                                } px={3} py={1}>{t(`utility.${bill.type}`)}</Badge>
                              </Td>
                              <Td fontWeight="black" fontSize="sm" color={textColor}>{fmt(bill.amount)}</Td>
                              <Td fontSize="xs" color={mutedText} fontWeight="bold">{fmtDate(bill.due_date)}</Td>
                              <Td>
                                <Badge fontSize="xs" fontWeight="black" textTransform="uppercase" colorScheme={bill.status === "paid" ? "green" : "red"} px={3} py={1}>
                                  {t(`utility.${bill.status}`)}
                                </Badge>
                              </Td>
                              <Td fontSize="xs" color={mutedText}>{bill.description || "—"}</Td>
                              <Td textAlign="right">
                                <Flex justify="flex-end" gap={1}>
                                  {bill.status === "unpaid" && (
                                    <Tooltip label="Send Reminder" hasArrow>
                                      <IconButton icon={<FiBell />} size="xs" colorScheme="orange" variant="ghost" onClick={() => handleSendNotification(bill.id)} aria-label="Send notification" />
                                    </Tooltip>
                                  )}
                                  <Tooltip label="Delete" hasArrow>
                                    <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeleteBill(bill.id)} aria-label="Delete bill" />
                                  </Tooltip>
                                </Flex>
                              </Td>
                            </Tr>
                          )
                        })
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== PAYMENTS TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Flex align="center" gap={3}>
                    <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                      {t("lease.payment_ledger")}
                    </Text>
                    {selectedPayments.length > 0 && (
                      <Badge colorScheme="purple" fontSize="xs">{selectedPayments.length} selected</Badge>
                    )}
                  </Flex>
                  <Flex align="center" gap={3}>
                    {selectedPayments.length > 0 && (
                      <Button size="xs" colorScheme="purple" variant="link" leftIcon={<FiPrinter />} onClick={() => handlePrintReceipt(selectedPayments)}>
                        Print Receipt ({selectedPayments.length})
                      </Button>
                    )}
                    <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onPayOpen}>
                      {t("lease.new_entry")}
                    </Button>
                  </Flex>
                </Flex>

                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th w="40px"><Checkbox onChange={(e) => {
                          const payments = lease.payments || [];
                          setSelectedPayments(e.target.checked ? payments.map(p => p.id) : []);
                        }} /></Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.date")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.amount")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.type")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.method")}</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>{t("common.notes")}</Th>
                        <Th textAlign="right" py={4}></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(lease.payments || []).length === 0 ?
                        <Tr><Td colSpan={7} textAlign="center" py={10} color={mutedText}>{t("payment.no_records")}</Td></Tr>
                      :
                        [...(lease.payments || [])].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)).map(payment => {
                          return (
                            <Tr key={payment.id} bg={selectedPayments.includes(payment.id) ? purpleBg : "transparent"}>
                              <Td><Checkbox isChecked={selectedPayments.includes(payment.id)} onChange={(e) => {
                                setSelectedPayments(e.target.checked ? [...selectedPayments, payment.id] : selectedPayments.filter(i => i !== payment.id));
                              }} /></Td>
                              <Td fontSize="xs" color={mutedText} fontWeight="bold">{fmtDate(payment.payment_date)}</Td>
                              <Td fontWeight="black" fontSize="sm" color={textColor}>{fmt(payment.amount_paid)}</Td>
                              <Td>
                                <Badge fontSize="xs" fontWeight="black" textTransform="uppercase" colorScheme="purple" px={3} py={1}>{payment.type || "rent"}</Badge>
                              </Td>
                              <Td fontSize="sm" fontWeight="bold" color={textColor} textTransform="uppercase">{payment.payment_method}</Td>
                              <Td fontSize="xs" color={mutedText} maxW="400px">{(payment.notes || "—").replace(/\(Hash: [^\)]+\)/gi, "").trim()}</Td>
                              <Td textAlign="right">
                                <Flex gap={1} justify="flex-end">
                                  <Tooltip label="Print Receipt" hasArrow>
                                    <IconButton icon={<FiPrinter />} size="xs" colorScheme="purple" variant="ghost" onClick={() => handlePrintReceipt(payment.id)} aria-label="Print receipt" />
                                  </Tooltip>
                                  <Tooltip label="Delete" hasArrow>
                                    <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => handleDeletePayment(payment.id)} aria-label="Delete payment" />
                                  </Tooltip>
                                </Flex>
                              </Td>
                            </Tr>
                          )
                        })
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== MAINTENANCE TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Flex align="center" gap={2}>
                    <FiTool color={mutedText} size={15}/>
                    <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                      Maintenance Requests
                    </Text>
                  </Flex>
                  <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onMaintOpen}>
                    New Request
                  </Button>
                </Flex>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Title</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Priority</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Status</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Reported</Th>
                        <Th textAlign="right" py={4}></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {maintenanceRequests.length === 0 ?
                        <Tr><Td colSpan={5} textAlign="center" py={10} color={mutedText}>No maintenance requests found.</Td></Tr>
                      :
                        maintenanceRequests.map(req => {
                          return (
                            <Tr key={req.id}>
                              <Td>
                                <Text fontSize="sm" fontWeight="bold" color={textColor}>{req.title}</Text>
                                <Text fontSize="xs" color={mutedText} noOfLines={1}>{req.description}</Text>
                              </Td>
                              <Td>
                                <Badge size="sm" colorScheme={req.priority === "emergency" ? "red" : req.priority === "urgent" ? "orange" : "blue"}>
                                  {req.priority}
                                </Badge>
                              </Td>
                              <Td>
                                <Select
                                  size="xs"
                                  value={req.status}
                                  variant="filled"
                                  borderRadius="md"
                                  w="140px"
                                  onChange={(e) => handleUpdateMaintStatus(req.uid, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="cancelled">Cancelled</option>
                                </Select>
                              </Td>
                              <Td fontSize="xs" color={mutedText}>{fmtDate(req.created_at)}</Td>
                              <Td textAlign="right">
                                 <Tooltip label="View Details" hasArrow>
                                    <IconButton icon={<FiImage />} size="xs" variant="ghost" onClick={() => window.open(`http://localhost:8000/storage/${req.photo_path}`, '_blank')} isDisabled={!req.photo_path} aria-label="View photo" />
                                 </Tooltip>
                              </Td>
                            </Tr>
                          )
                        })
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== EXPENSES TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
                <Flex align="center" justify="space-between" px={6} py={4} bg={tableHBg} borderBottom="1px solid" borderColor={borderColor}>
                  <Flex align="center" gap={2}>
                    <FiTrendingDown color={mutedText} size={15}/>
                    <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="tight" color={textColor}>
                      Room Expenses
                    </Text>
                  </Flex>
                  <Button size="xs" colorScheme="blue" variant="link" leftIcon={<FiPlus />} onClick={onExpOpen}>
                    Record Expense
                  </Button>
                </Flex>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Title</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Category</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Amount</Th>
                        <Th fontSize="xs" fontWeight="black" textTransform="uppercase" letterSpacing="wider" py={4}>Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {roomExpenses.length === 0 ?
                        <Tr><Td colSpan={4} textAlign="center" py={10} color={mutedText}>No expenses recorded for this room.</Td></Tr>
                      :
                                                roomExpenses.map(exp => {
                          return (
                            <Tr key={exp.id}>
                              <Td fontSize="sm" fontWeight="bold" color={textColor}>{exp.title}</Td>
                              <Td><Badge size="sm" variant="outline">{exp.category}</Badge></Td>
                              <Td fontSize="sm" fontWeight="black" color="red.500">{fmt(exp.amount)}</Td>
                              <Td fontSize="xs" color={mutedText}>{fmtDate(exp.expense_date)}</Td>
                            </Tr>
                          )
                        })
                      }
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            {/* ===== TIMELINE TAB ===== */}
            <TabPanel px={0} pt={6}>
              <Box bg={cardBg} borderRadius="xl" shadow="sm" border="1px solid" borderColor={borderColor} p={8}>
                <Flex align="center" gap={2} mb={6}>
                  <FiClock size={18} />
                  <Text fontSize="sm" fontWeight="black" textTransform="uppercase" letterSpacing="wider" color={textColor}>
                    Activity Timeline
                  </Text>
                </Flex>
                {(() => {
                  // Build timeline events from existing data
                  const events = [];
                  // Lease created
                  if (lease.created_at) {
                    events.push({ date: lease.created_at, type: "lease", icon: <FiCheckCircle />, color: "blue", title: "Lease Created", desc: `${lease.room?.name} assigned to ${lease.tenant?.name}. Rent: ${fmt(lease.rent_amount)}/mo` });
                  }
                  // Payments
                  (lease.payments || []).forEach(p => {
                    events.push({ date: p.payment_date || p.created_at, type: "payment", icon: <FiDollarSign />, color: "green", title: `${(p.type || "rent").charAt(0).toUpperCase() + (p.type || "rent").slice(1)} Payment`, desc: `${fmt(p.amount_paid)} via ${p.payment_method}${p.notes ? " — " + p.notes.replace(/\(Hash: [^\)]+\)/gi, "").trim() : ""}` });
                  });
                  // Utility bills
                  (lease.utility_bills || []).forEach(b => {
                    events.push({ date: b.created_at || b.due_date, type: "bill", icon: <FiAlertCircle />, color: b.status === "paid" ? "teal" : "orange", title: `${b.type.charAt(0).toUpperCase() + b.type.slice(1)} Bill${b.status === "paid" ? " (Paid)" : ""}`, desc: `${fmt(b.amount)} — Due ${fmtDate(b.due_date)}${b.description ? ". " + b.description : ""}` });
                  });
                  // Deposit events
                  if (lease.deposit_status === "held") {
                    events.push({ date: lease.updated_at || lease.created_at, type: "deposit", icon: <FiCheckCircle />, color: "green", title: "Security Deposit Collected", desc: fmt(lease.security_deposit) });
                  }
                  if (lease.deposit_status === "refunded") {
                    events.push({ date: lease.updated_at || lease.created_at, type: "deposit", icon: <FiDollarSign />, color: "purple", title: "Security Deposit Refunded", desc: `${fmt(lease.security_deposit)}${lease.deposit_notes ? " — " + lease.deposit_notes : ""}` });
                  }
                  // Sort by date, newest first
                  events.sort((a, b) => new Date(b.date) - new Date(a.date));

                  if (events.length === 0) return <Text py={10} textAlign="center" color={mutedText}>No activity yet.</Text>;

                  return (
                    <Box position="relative" pl={8}>
                      {/* Vertical line */}
                      <Box position="absolute" left="15px" top={0} bottom={0} w="2px" bg={borderColor} />
                      {events.map((ev, i) => (
                        <Flex key={i} mb={6} align="flex-start" position="relative">
                          {/* Dot */}
                          <Box
                            position="absolute" left="-24px" top="4px"
                            w="20px" h="20px" borderRadius="full"
                            bg={`${ev.color}.500`} color="white"
                            display="flex" alignItems="center" justifyContent="center"
                            fontSize="10px" zIndex={1}
                          >
                            {ev.icon}
                          </Box>
                          <Box ml={2} flex={1}>
                            <Flex align="center" gap={2} mb={0.5}>
                              <Text fontSize="sm" fontWeight="black" color={textColor}>{ev.title}</Text>
                              <Badge fontSize="10px" colorScheme={ev.color} variant="subtle" px={2} py={0.5}>{ev.type}</Badge>
                            </Flex>
                            <Text fontSize="xs" color={mutedText}>{ev.desc}</Text>
                            <Text fontSize="10px" fontWeight="bold" color="gray.400" mt={1}>{fmtDate(ev.date)}</Text>
                          </Box>
                        </Flex>
                      ))}
                    </Box>
                  );
                })()}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

      </Box>

      {/* ===== RENEW LEASE MODAL ===== */}
      <Modal isOpen={isRenewOpen} onClose={onRenewClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleRenewLease}>
            <ModalHeader color={textColor}>
              <Flex align="center" gap={2}>
                <FiRefreshCw />
                <Text>Renew Lease</Text>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {/* Current lease summary */}
              <Box bg={subCardBg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor} mb={5}>
                <SimpleGrid columns={2} spacing={3}>
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Room</Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{lease.room?.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Tenant</Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{lease.tenant?.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Current Term</Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmtDate(lease.start_date)} — {fmtDate(lease.end_date)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="wider">Current Rent</Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{fmt(lease.rent_amount)}</Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <Text fontSize="xs" fontWeight="black" color="teal.500" textTransform="uppercase" letterSpacing="wider" mb={4}>
                New Term Details
              </Text>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>New Start Date</FormLabel>
                  <Input size="sm" type="date" bg={inputBg} borderColor={borderColor} value={renewForm.start_date} onChange={e => setRenewForm({ ...renewForm, start_date: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>New End Date</FormLabel>
                  <Input size="sm" type="date" bg={inputBg} borderColor={borderColor} value={renewForm.end_date} onChange={e => setRenewForm({ ...renewForm, end_date: e.target.value })} />
                </FormControl>
                <FormControl isRequired gridColumn="span 2">
                  <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Monthly Rent ({localStorage.getItem("currency") || "$"})</FormLabel>
                  <Input size="md" type="number" step="0.01" bg={inputBg} borderColor="teal.400" fontWeight="bold" value={renewForm.rent_amount} onChange={e => setRenewForm({ ...renewForm, rent_amount: e.target.value })} />
                  <Text fontSize="xs" color={mutedText} mt={1}>Adjust if needed, or keep the same.</Text>
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onRenewClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="teal" type="submit" size="sm" isLoading={isRenewing} leftIcon={<FiRefreshCw />}>Confirm Renewal</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== TERMINATE LEASE MODAL ===== */}
      <Modal isOpen={isTerminateOpen} onClose={onTerminateClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <ModalHeader color="red.500">
            <Flex align="center" gap={2}>
              <FiXCircle />
              <Text>Terminate Lease</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="sm" color={textColor} mb={4}>
              Are you sure you want to terminate this lease for <Text as="span" fontWeight="black">{lease.tenant?.name}</Text> in <Text as="span" fontWeight="black">{lease.room?.name}</Text>?
            </Text>
            <Box bg={dangerBg} p={4} borderRadius="lg" border="1px solid" borderColor="red.200" mb={4}>
              <Text fontSize="xs" fontWeight="black" color="red.600" textTransform="uppercase" letterSpacing="wider" mb={2}>This action will:</Text>
              <Text fontSize="sm" color={textColor}>• Set lease status to <strong>Terminated</strong></Text>
              <Text fontSize="sm" color={textColor}>• Mark the room as <strong>Available</strong></Text>
              <Text fontSize="sm" color={textColor}>• Leave payments and bills unchanged</Text>
            </Box>
            {(lease.deposit_status === "held") && (
              <Box bg={warningBg} p={4} borderRadius="lg" border="1px solid" borderColor="orange.200" mb={4}>
                <Text fontSize="xs" fontWeight="black" color="orange.600" textTransform="uppercase" letterSpacing="wider" mb={1}>Deposit Notice</Text>
                <Text fontSize="sm" color={textColor}>Security deposit of {fmt(lease.security_deposit)} is still <strong>held</strong>. You may want to process a refund separately.</Text>
              </Box>
            )}
            {unpaidBillsTotal > 0 && (
              <Box bg={cautionBg} p={4} borderRadius="lg" border="1px solid" borderColor="yellow.200">
                <Text fontSize="xs" fontWeight="black" color="yellow.600" textTransform="uppercase" letterSpacing="wider" mb={1}>Outstanding Bills</Text>
                <Text fontSize="sm" color={textColor}>There are {fmt(unpaidBillsTotal)} in unpaid utility bills.</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTerminateClose} variant="ghost" mr={3} size="sm">Cancel</Button>
            <Button colorScheme="red" size="sm" isLoading={isTerminating} leftIcon={<FiXCircle />} onClick={handleTerminateLease}>Confirm Termination</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== RECORD PAYMENT MODAL ===== */}
      <Modal isOpen={isPayOpen} onClose={onPayClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSavePayment}>
            <ModalHeader color={textColor}>{t("lease.record_payment")}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Payment Type</FormLabel>
                  <Select size="sm" value={payForm.type} onChange={e => setPayForm({ ...payForm, type: e.target.value })}>
                    <option value="rent">Rent</option>
                    <option value="deposit">Security Deposit</option>
                    <option value="utility">Utility Bill</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Amount</FormLabel>
                  <Flex gap={2}>
                    <Select w="80px" size="md" value={payForm.currency} onChange={e => setPayForm({ ...payForm, currency: e.target.value })}>
                      <option value="$">$</option>
                      <option value="៛">៛</option>
                    </Select>
                    <Input size="md" type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={payForm.amount_paid} onChange={e => setPayForm({ ...payForm, amount_paid: e.target.value })} />
                  </Flex>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Payment Method</FormLabel>
                  <Select size="sm" bg={inputBg} borderColor={borderColor} value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Date</FormLabel>
                  <Input size="sm" type="date" bg={inputBg} borderColor={borderColor} value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                </FormControl>
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Notes (optional)</FormLabel>
                  <Textarea size="sm" rows={2} bg={inputBg} borderColor={borderColor} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPayClose} variant="ghost" mr={3} size="sm">{t("common.cancel")}</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingPay}>{t("common.save")}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== ADD BILL MODAL ===== */}
      <Modal isOpen={isBillOpen} onClose={onBillClose} isCentered size="4xl">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveBill}>
            <ModalHeader color={textColor} textTransform="uppercase" fontWeight="black">Add New Utility Bill</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {/* Room (read-only) */}
              <FormControl mb={4}>
                <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Room</FormLabel>
                <Box p={3} bg={subCardBg} border="1px solid" borderColor={borderColor} borderRadius="md" fontWeight="bold" color={textColor} fontSize="sm">
                  {lease.room?.name || "—"} <Text as="span" fontSize="xs" fontWeight="normal" color={mutedText}>(Current Room)</Text>
                </Box>
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                {/* Bill Type */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Bill Type</FormLabel>
                  <Select size="sm" bg={inputBg} borderColor={borderColor} value={billForm.type} onChange={e => setBillForm({ ...billForm, type: e.target.value })}>
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="trash">Trash (Fixed)</option>
                    <option value="internet">Internet (Fixed)</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <Box /> {/* spacer */}

                {/* Meter Reading Section — only for electricity/water */}
                {isMetered && (
                  <Box gridColumn="span 2" bg={subCardBg} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <SimpleGrid columns={3} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Previous Reading</FormLabel>
                        <Input size="sm" type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={billForm.previous_reading} 
                          onChange={e => setBillForm({ ...billForm, previous_reading: e.target.value })} />
                        <Text fontSize="xs" color={mutedText} mt={1}>Auto-fetched, but editable.</Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Current Reading</FormLabel>
                        <Input size="sm" type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={billForm.current_reading} onChange={e => setBillForm({ ...billForm, current_reading: e.target.value })} />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Rate per Unit</FormLabel>
                        <Flex gap={2}>
                           <Select w="80px" size="md" value={billForm.currency} onChange={e => setBillForm({ ...billForm, currency: e.target.value })}>
                             <option value="$">$</option>
                             <option value="៛">៛</option>
                           </Select>
                           <Input size="md" type="number" step="0.01" bg={inputBg} borderColor={borderColor} value={billForm.cost_per_unit} onChange={e => setBillForm({ ...billForm, cost_per_unit: e.target.value })} />
                        </Flex>
                      </FormControl>
                    </SimpleGrid>
                    <Text fontSize="sm" fontWeight="bold" color={mutedText} textAlign="right" mt={2}>
                      Usage: <Text as="span" fontWeight="black" color={textColor}>{usage}</Text> units
                    </Text>
                  </Box>
                )}

                {/* Total Amount */}
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Total Amount</FormLabel>
                  <Flex gap={2}>
                    {(!isMetered) && (
                      <Select w="80px" size="md" value={billForm.currency} onChange={e => setBillForm({ ...billForm, currency: e.target.value })}>
                        <option value="$">$</option>
                        <option value="៛">៛</option>
                      </Select>
                    )}
                    {isMetered && (
                       <Box w="80px" display="flex" alignItems="center" justifyContent="center" bg={inputBg} border="1px solid" borderColor={borderColor} borderRadius="md" fontWeight="bold" color={textColor}>
                         {billForm.currency}
                       </Box>
                    )}
                    <Input size="md" type="number" step="0.01" bg={isMetered ? highlightBg : inputBg} borderColor={borderColor} fontWeight="bold" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })} />
                  </Flex>
                  {isMetered && <Text fontSize="xs" color={mutedText} mt={1}>Auto-calculated, but you can override.</Text>}
                </FormControl>

                {/* Due Date */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Due Date</FormLabel>
                  <Input size="sm" type="date" bg={inputBg} borderColor={borderColor} value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })} />
                </FormControl>

                {/* Status */}
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Status</FormLabel>
                  <Select size="sm" bg={inputBg} borderColor={borderColor} value={billForm.status} onChange={e => setBillForm({ ...billForm, status: e.target.value })}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </Select>
                </FormControl>
                <Box /> {/* spacer */}

                {/* Description */}
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Description (Optional)</FormLabel>
                  <Textarea size="sm" rows={2} bg={inputBg} borderColor={borderColor} value={billForm.description} onChange={e => setBillForm({ ...billForm, description: e.target.value })} placeholder="e.g., September 2023 Usage" />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onBillClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingBill}>Create Bill</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== PAY SELECTED BILLS MODAL ===== */}
      <Modal isOpen={isPayAllOpen} onClose={onPayAllClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handlePaySelected}>
            <ModalHeader color={textColor}>Pay Selected Bills</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {/* Bill list */}
              <Box maxH="200px" overflowY="auto" border="1px solid" borderColor={borderColor} borderRadius="lg" mb={4}>
                {(lease.utility_bills || []).filter(b => b.status === "unpaid").map(bill => (
                  <Flex key={bill.id} align="center" justify="space-between" px={3} py={2} borderBottom="1px solid" borderColor={borderColor} bg={selectedBillIds.includes(bill.id) ? successBg : "transparent"}>
                    <Flex align="center" gap={2}>
                      <Checkbox
                        isChecked={selectedBillIds.includes(bill.id)}
                        onChange={(e) => setSelectedBillIds(e.target.checked ? [...selectedBillIds, bill.id] : selectedBillIds.filter(i => i !== bill.id))}
                      />
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">{bill.type}</Text>
                        <Text fontSize="10px" color={mutedText}>Due: {fmtDate(bill.due_date)}</Text>
                      </Box>
                    </Flex>
                    <Text fontWeight="black">{fmt(bill.amount)}</Text>
                  </Flex>
                ))}
              </Box>

              {/* Total */}
              <Flex justify="space-between" align="flex-end" borderTop="1px solid" borderColor={borderColor} pt={3} mb={4}>
                <Text fontSize="xs" fontWeight="black" textTransform="uppercase" color={mutedText}>Total To Pay</Text>
                <Text fontSize="xl" fontWeight="black" color="green.600">
                  {fmt((lease.utility_bills || []).filter(b => b.status === "unpaid" && selectedBillIds.includes(b.id)).reduce((s, b) => s + Number(b.amount), 0))}
                </Text>
              </Flex>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Date</FormLabel>
                  <Input size="sm" type="date" value={payAllForm.payment_date} onChange={e => setPayAllForm({ ...payAllForm, payment_date: e.target.value })} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Method</FormLabel>
                  <Select size="sm" value={payAllForm.payment_method} onChange={e => setPayAllForm({ ...payAllForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </Select>
                </FormControl>
                <FormControl gridColumn="span 2">
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Notes (optional)</FormLabel>
                  <Textarea size="sm" rows={2} value={payAllForm.notes} onChange={e => setPayAllForm({ ...payAllForm, notes: e.target.value })} placeholder="e.g. Cleared by tenant" />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onPayAllClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="green" type="submit" size="sm" isLoading={isPayingAll} isDisabled={selectedBillIds.length === 0}>Confirm Pay</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== REFUND DEPOSIT MODAL ===== */}
      <Modal isOpen={isRefundOpen} onClose={onRefundClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleRefundDeposit}>
            <ModalHeader color={textColor}>Deposit Refund</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={1} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Amount to Refund ({localStorage.getItem("currency") || "$"})</FormLabel>
                  <Input size="md" type="number" step="0.01" max={toCurrent(lease.security_deposit)} value={refundForm.amount} onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Settlement Notes</FormLabel>
                  <Textarea size="sm" rows={3} value={refundForm.notes} onChange={e => setRefundForm({ ...refundForm, notes: e.target.value })} />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onRefundClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="orange" type="submit" size="sm" isLoading={isRefunding}>Confirm Settlement</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== EDIT LEASE MODAL ===== */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="5xl" scrollBehavior="inside" motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl" maxH="85vh" my="auto" display="flex" flexDirection="column">
          <form onSubmit={handleEditLease} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
            <ModalHeader color={textColor} fontSize="lg" fontWeight="black" textTransform="uppercase" letterSpacing="tight">
              Edit Lease Agreement
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>

              {/* 1. Select Tenant */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>1. Select Tenant</Text>
                <Box position="relative">
                  {/* Selected tenant display */}
                  <Box
                    border="1px solid" borderColor={borderColor} borderRadius="md" p={2.5} cursor="pointer"
                    onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                    display="flex" justifyContent="space-between" alignItems="center"
                    _hover={{ borderColor: "blue.400" }}
                  >
                    <Text fontSize="sm" color={editForm.tenant_id ? textColor : mutedText}>
                      {editForm.tenant_id
                        ? (() => { const t = allTenants.find(t => t.id === editForm.tenant_id); return t ? `${t.name} (${t.email})` : "Select..." })()
                        : "Select Tenant..."}
                    </Text>
                    <Text color={mutedText} fontSize="xs">▼</Text>
                  </Box>

                  {/* Dropdown */}
                  {showTenantDropdown && (
                    <Box
                      position="absolute" top="100%" left={0} right={0} zIndex={20}
                      bg={cardBg} border="1px solid" borderColor="blue.400" borderRadius="md"
                      shadow="lg" maxH="220px" overflowY="auto"
                    >
                      <Box p={2} borderBottom="1px solid" borderColor={borderColor}>
                        <Input
                          size="sm" placeholder="Search name or email..." autoFocus
                          value={tenantSearch}
                          onChange={e => setTenantSearch(e.target.value)}
                          borderColor="blue.400"
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        />
                      </Box>
                      {allTenants
                        .filter(t => {
                          const q = tenantSearch.toLowerCase();
                          return !q || (t.name || "").toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q);
                        })
                        .map(t => (
                          <Box
                            key={t.id}
                            px={3} py={2}
                            cursor="pointer"
                            bg={editForm.tenant_id === t.id ? "blue.50" : "transparent"}
                            _hover={{ bg: "gray.50" }}
                            onClick={() => { setEditForm({ ...editForm, tenant_id: t.id }); setShowTenantDropdown(false); setTenantSearch(""); }}
                            display="flex" alignItems="center" gap={2}
                          >
                            {editForm.tenant_id === t.id && <Text color="blue.500" fontWeight="bold">✓</Text>}
                            <Text fontSize="sm" fontWeight="bold" color={textColor}>{t.name}</Text>
                            <Text fontSize="xs" color={mutedText}>{t.email}</Text>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 2. Select Room */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>2. Select Property / Room</Text>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                  {allRooms.map(room => {
                    const isSelected = editForm.room_id === room.id;
                    const isOccupied = room.status === "occupied" && !isSelected;
                    return (
                      <Box
                        key={room.id}
                        border="2px solid"
                        borderColor={isSelected ? "blue.500" : borderColor}
                        borderRadius="lg"
                        p={4}
                        cursor={isOccupied ? "not-allowed" : "pointer"}
                        opacity={isOccupied ? 0.5 : 1}
                        bg={isSelected ? "blue.50" : cardBg}
                        _hover={!isOccupied ? { borderColor: "blue.400", shadow: "md" } : {}}
                        transition="all 0.2s"
                        onClick={() => {
                          if (isOccupied) return;
                          setEditForm({ ...editForm, room_id: room.id, rent_amount: toCurrent(room.price) || editForm.rent_amount });
                        }}
                      >
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{room.name}</Text>
                        <Text fontSize="xs" color={mutedText}>Size: {room.size || "N/A"}</Text>
                        <Text fontSize="xs" fontWeight="bold" color={isOccupied ? "red.500" : isSelected ? "blue.500" : "green.500"} mt={1}>
                          {isOccupied ? "Occupied" : isSelected ? "Available / Selected" : "Available"}
                        </Text>
                        <Text fontWeight="black" color={textColor} mt={2} fontSize="md">{fmt(room.price || 0)}</Text>
                        <Text fontSize="9px" fontWeight="bold" color={mutedText} textTransform="uppercase">/ Month</Text>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              <Divider mb={6} />

              {/* 3. Lease Details & Financials */}
              <Box mb={6}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>3. Lease Details & Financials</Text>
                <Flex gap={4} mb={4} direction={{ base: "column", md: "row" }}>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Start Date</FormLabel>
                    <Input size="sm" type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>End Date</FormLabel>
                    <Input size="sm" type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Agreed Monthly Rent ({localStorage.getItem("currency") || "$"})</FormLabel>
                    <Input size="md" type="number" step="0.01" value={editForm.rent_amount} onChange={e => setEditForm({ ...editForm, rent_amount: e.target.value })} borderColor="blue.400" />
                  </FormControl>
                </Flex>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" fontWeight="bold" color={mutedText}>Security Deposit ({localStorage.getItem("currency") || "$"})</FormLabel>
                  <Input size="md" type="number" step="0.01" value={editForm.security_deposit} onChange={e => setEditForm({ ...editForm, security_deposit: e.target.value })} />
                </FormControl>

                {/* Lease Status */}
                <Box mb={4}>
                  <Text fontSize="xs" fontWeight="bold" color={mutedText} mb={2}>Lease Status</Text>
                  <SimpleGrid columns={3} spacing={2}>
                    {["active", "expired", "ended"].map(s => (
                      <Button
                        key={s} type="button" size="sm" variant={editForm.status === s ? "solid" : "outline"}
                        colorScheme={editForm.status === s ? (s === "active" ? "green" : s === "expired" ? "orange" : "gray") : "gray"}
                        onClick={() => setEditForm({ ...editForm, status: s })}
                        textTransform="uppercase" fontWeight="black" fontSize="10px" letterSpacing="wider"
                      >
                        {s}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Deposit Status */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color={mutedText} mb={2}>Deposit Status</Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                    {["unpaid", "held", "refunded", "forfeited"].map(s => (
                      <Button
                        key={s} type="button" size="sm" variant={editForm.deposit_status === s ? "solid" : "outline"}
                        colorScheme={editForm.deposit_status === s ? (s === "held" ? "green" : s === "refunded" ? "blue" : s === "forfeited" ? "red" : "gray") : "gray"}
                        onClick={() => setEditForm({ ...editForm, deposit_status: s })}
                        textTransform="capitalize" fontWeight="bold" fontSize="xs"
                      >
                        {s}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>
              </Box>

            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor}>
              <Button onClick={onEditClose} variant="ghost" mr={3} size="sm" fontWeight="bold">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingEdit} fontWeight="bold" px={6}>Update Agreement</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== MAINTENANCE MODAL ===== */}
      <Modal isOpen={isMaintOpen} onClose={onMaintClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveMaintenance}>
            <ModalHeader color={textColor}>New Maintenance Request</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
               <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Issue Title</FormLabel>
                    <Input size="sm" bg={inputBg} borderColor={borderColor} placeholder="e.g. Broken AC, Leaking Sink" value={maintForm.title} onChange={e => setMaintForm({...maintForm, title: e.target.value})} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Priority</FormLabel>
                    <Select size="sm" bg={inputBg} borderColor={borderColor} value={maintForm.priority} onChange={e => setMaintForm({...maintForm, priority: e.target.value})}>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Description</FormLabel>
                    <Textarea size="sm" bg={inputBg} borderColor={borderColor} rows={4} value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} />
                  </FormControl>
               </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onMaintClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingMaint}>Submit Ticket</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ===== EXPENSE MODAL ===== */}
      <Modal isOpen={isExpOpen} onClose={onExpClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg={cardBg} borderRadius="xl">
          <form onSubmit={handleSaveExpense}>
            <ModalHeader color={textColor}>Record Room Expense</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
               <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Title</FormLabel>
                    <Input size="sm" bg={inputBg} borderColor={borderColor} value={expForm.title} onChange={e => setExpForm({...expForm, title: e.target.value})} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Category</FormLabel>
                    <Select size="sm" bg={inputBg} borderColor={borderColor} value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value})}>
                      <option value="Repairs">Repairs</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Other">Other</option>
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Amount ({localStorage.getItem("currency") || "$"})</FormLabel>
                    <Input size="sm" bg={inputBg} borderColor={borderColor} type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold" color={mutedText}>Date</FormLabel>
                    <Input size="sm" bg={inputBg} borderColor={borderColor} type="date" value={expForm.expense_date} onChange={e => setExpForm({...expForm, expense_date: e.target.value})} />
                  </FormControl>
               </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onExpClose} variant="ghost" mr={3} size="sm">Cancel</Button>
              <Button colorScheme="blue" type="submit" size="sm" isLoading={isSavingExp}>Save Expense</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </Box>
  );
}
