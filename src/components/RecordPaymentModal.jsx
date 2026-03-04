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
  const [isLoadingLeases, setIsLoadingLeases] = useState(false);
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg={modalBg} borderRadius="xl" overflow="hidden">
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
                    {leases.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.tenant?.name} - {l.room?.name} (Balance Due: ${l.total_contract_value - (l.payments_sum_amount_paid || 0)})
                      </option>
                    ))}
                  </Select>
                )}
              </FormControl>

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
                  <FormLabel fontSize="xs" fontWeight="bold">Amount Paid ($)</FormLabel>
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
