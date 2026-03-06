import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Select, Textarea, SimpleGrid, useColorModeValue,
  Box, Text, Spinner, Flex
} from "@chakra-ui/react";
import toast from "react-hot-toast";

const API = "http://localhost:8000/api/v1/admin";

export default function RecordPaymentModal({ isOpen, onClose, onSuccess, initialData = {} }) {
  const curr = localStorage.getItem("currency") || "$";
  
  const fmt = (n) => {
    const c = localStorage.getItem("currency") || "$";
    const num = Number(n || 0);
    if (c === "៛") {
      const r = Number(localStorage.getItem("exchangeRate") || 4000);
      return "៛" + (num * r).toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [formData, setFormData] = useState({
    lease_id: "",
    type: "rent",
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    notes: "",
    bill_id: "",
    discount_type: "fixed",
    discount_value: 0
  });

  const [leases, setLeases] = useState([]);
  const [utilityBills, setUtilityBills] = useState([]);
  const [isLoadingLeases, setIsLoadingLeases] = useState(false);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const modalBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (isOpen) {
      const safeData = initialData || {};
      setFormData(prev => ({
        ...prev,
        lease_id: safeData.lease_id || "",
        type: safeData.type || "rent",
        amount_paid: safeData.amount || "",
        bill_id: safeData.bill_id || "",
        notes: safeData.notes || ""
      }));
      fetchLeases();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const fetchLeases = async () => {
    setIsLoadingLeases(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/leases?per_page=all&minimal=true&status=active`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setLeases(data.data || data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeases(false);
    }
  };

  const fetchUtilityBills = async (leaseId) => {
    if (!leaseId) { setUtilityBills([]); return; }
    setIsLoadingBills(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/utility-bills?lease_id=${leaseId}&status=unpaid`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setUtilityBills(data.data || data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBills(false);
    }
  };

  useEffect(() => {
    if (formData.lease_id && formData.type === "utility") {
      fetchUtilityBills(formData.lease_id);
    } else {
      setUtilityBills([]);
      // If we switch away from utility, clear the bill_id
      if (formData.type !== "utility" && formData.bill_id) {
        setFormData(prev => ({ ...prev, bill_id: "" }));
      }
    }
  }, [formData.lease_id, formData.type]);

  const handleBillSelect = (billId) => {
    const bill = utilityBills.find(b => b.id.toString() === billId.toString());
    if (bill) {
      const remaining = Number(bill.amount) - Number(bill.payments_sum_amount_paid || 0);
      setFormData(prev => ({ 
        ...prev, 
        bill_id: billId, 
        amount_paid: remaining > 0 ? remaining : 0,
        notes: `Payment for ${bill.type} bill (Due: ${fmtDate(bill.due_date)})`
      }));
    } else {
      setFormData(prev => ({ ...prev, bill_id: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lease_id || !formData.amount_paid || !formData.payment_date) {
      toast.error("Please fill required fields (Lease, Amount, Date)");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Auth token missing");
        return;
      }
      const res = await fetch(`${API}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Payment recorded successfully");
        if (onSuccess) onSuccess(data);
        onClose();
      } else {
        toast.error(data.message || "Failed to record payment");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <ModalContent bg={modalBg} borderRadius="2xl" overflow="hidden" shadow="2xl" border="1px solid" borderColor={borderColor}>
        <form onSubmit={handleSubmit}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
            <Text fontSize="lg" fontWeight="black" textTransform="uppercase">Record Payment</Text>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <SimpleGrid columns={1} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold">Select Tenant / Lease</FormLabel>
                {isLoadingLeases ? (
                  <Flex align="center" gap={2}><Spinner size="sm" /> <Text fontSize="xs">Loading leases...</Text></Flex>
                ) : (
                  <Select 
                    placeholder="Select Lease" 
                    value={formData.lease_id}
                    onChange={(e) => setFormData({ ...formData, lease_id: e.target.value })}
                  >
                    {leases.map(l => {
                      const rentPaid = Number(l.payments_sum_amount_paid || 0);
                      const rentTotal = Number(l.total_contract_value || 0);
                      const rentDue = Math.max(0, rentTotal - rentPaid);
                      const utilDue = Number(l.unpaid_utilities_sum || 0);
                      
                      return (
                        <option key={l.id} value={l.id}>
                          {l.tenant?.name || l.tenant_name} - {l.room?.name || l.room_name} 
                          (Rent: {fmt(rentDue)} | Util: {fmt(utilDue)})
                        </option>
                      );
                    })}
                  </Select>
                )}
              </FormControl>

              {formData.lease_id && (
                <Box bg="blue.50" p={4} borderRadius="xl" border="1px dashed" borderColor="blue.200">
                  <SimpleGrid columns={2} spacing={2}>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" color="blue.400" textTransform="uppercase">Outstanding Rent</Text>
                      <Text fontSize="md" fontWeight="black" color="blue.600">
                        {(() => {
                          const l = leases.find(item => item.id.toString() === formData.lease_id.toString());
                          if (!l) return fmt(0);
                          const total = Number(l.total_contract_value || 0);
                          const paid = Number(l.payments_sum_amount_paid || 0);
                          return fmt(Math.max(0, total - paid));
                        })()}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="black" color="green.400" textTransform="uppercase">Unpaid Utilities</Text>
                      <Text fontSize="md" fontWeight="black" color="green.600">
                        {(() => {
                          const l = leases.find(item => item.id.toString() === formData.lease_id.toString());
                          return l ? fmt(l.unpaid_utilities_sum || 0) : fmt(0);
                        })()}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              )}

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Payment Type</FormLabel>
                  <Select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="rent">Rent</option>
                    <option value="utility">Utility</option>
                    <option value="deposit">Deposit</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                {formData.type === "utility" && (
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Link to Bill</FormLabel>
                    {isLoadingBills ? (
                      <Flex align="center" gap={2}><Spinner size="xs" /> <Text fontSize="xs">Finding bills...</Text></Flex>
                    ) : (
                      <>
                        <Select 
                          placeholder={utilityBills.length === 0 ? "⚠️ No unpaid bills found" : "Select Unpaid Bill"}
                          value={formData.bill_id}
                          onChange={(e) => handleBillSelect(e.target.value)}
                          borderColor={utilityBills.length === 0 ? "orange.300" : "green.400"}
                          _hover={{ borderColor: utilityBills.length === 0 ? "orange.400" : "green.500" }}
                        >
                          {utilityBills.map(b => {
                            const remaining = Number(b.amount) - Number(b.payments_sum_amount_paid || 0);
                            return (
                              <option key={b.id} value={b.id}>
                                {b.type.toUpperCase()} - {fmt(remaining)} Remaining (Due: {fmtDate(b.due_date)})
                              </option>
                            );
                          })}
                        </Select>
                        {utilityBills.length === 0 && formData.lease_id && (
                          <Text fontSize="10px" color="orange.600" mt={1} fontWeight="bold">
                            This tenant has no outstanding utility bills. Need to add one? Go to "Utilities" page.
                          </Text>
                        )}
                      </>
                    )}
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Payment Method</FormLabel>
                  <Select 
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer / ABA</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Amount Paid ({curr})</FormLabel>
                  <Input 
                    type="number" step="0.01" 
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Payment Date</FormLabel>
                  <Input 
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">Notes (Optional)</FormLabel>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional payment details..."
                  rows={3}
                />
              </FormControl>
            </SimpleGrid>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor} bg={useColorModeValue("gray.50", "gray.900/50")}>
            <Button variant="ghost" mr={3} onClick={onClose} size="sm">Cancel</Button>
            <Button colorScheme="blue" type="submit" isLoading={isSaving} size="sm">Save Payment</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
