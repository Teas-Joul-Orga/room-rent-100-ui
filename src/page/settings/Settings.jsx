import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Text, Button, Tabs, TabList, TabPanels, Tab, TabPanel,
  FormControl, FormLabel, Input, Select, SimpleGrid, useColorModeValue,
  Spinner, useToast, Heading, FormHelperText, InputGroup, InputLeftAddon
} from '@chakra-ui/react';
import { FiSave } from 'react-icons/fi';

const API = "http://localhost:8000/api/v1";

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const toast = useToast();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  
  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // The API returns an object keyed by the setting's 'key'
          // We convert { 'app_name': { value: 'RoomRent' } } to { 'app_name': 'RoomRent' } for easy form binding
          const flatSettings = {};
          Object.keys(data).forEach(k => {
            flatSettings[k] = data[k].value;
          });
          setSettings(flatSettings);
        }
      } catch (e) {
        toast({ title: 'Failed to load settings.', status: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // POST mapping for Settings creation/update
      const res = await fetch(`${API}/admin/settings`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast({ title: 'Settings saved successfully.', status: 'success', duration: 3000 });
      } else {
        toast({ title: 'Failed to save', description: result.error || 'Server error', status: 'error' });
      }
    } catch(e) {
      toast({ title: 'Network error.', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Flex py={20} justify="center"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>;
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="flex-end" mb={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="black" color={textColor} letterSpacing="tight">System Settings</Text>
          <Text fontSize="sm" color={mutedText}>Configure global properties, financial defaults, and utility scaling.</Text>
        </Box>
        <Button 
          leftIcon={<FiSave />} 
          colorScheme="blue" 
          borderRadius="xl" 
          onClick={handleSave} 
          isLoading={saving}
          loadingText="Saving..."
        >
          Save Changes
        </Button>
      </Flex>

      <Box bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor}>
        <Tabs colorScheme="blue" variant="enclosed" m={4}>
          <TabList mb={4} gap={2} overflowX="auto" borderBottom="none">
            <Tab fontWeight="bold" borderRadius="xl" _selected={{ color: 'white', bg: 'blue.500' }}>General</Tab>
            <Tab fontWeight="bold" borderRadius="xl" _selected={{ color: 'white', bg: 'blue.500' }}>Contact Info</Tab>
            <Tab fontWeight="bold" borderRadius="xl" _selected={{ color: 'white', bg: 'blue.500' }}>Finance & Banking</Tab>
            <Tab fontWeight="bold" borderRadius="xl" _selected={{ color: 'white', bg: 'blue.500' }}>Utilities</Tab>
          </TabList>

          <TabPanels>
            {/* GENERAL TAB */}
            <TabPanel p={0} mb={4}>
               <Heading size="sm" mb={4} color={textColor}>General Configuration</Heading>
               <SimpleGrid columns={1} spacing={6}>
                 <FormControl>
                    <FormLabel>Application Name</FormLabel>
                    <Input name="app_name" value={settings.app_name || ''} onChange={handleChange} placeholder="e.g. Portfolio Manager" />
                 </FormControl>
                 <FormControl>
                    <FormLabel>Company / Property Name</FormLabel>
                    <Input name="company_name" value={settings.company_name || ''} onChange={handleChange} placeholder="e.g. Pteas Jul Srea 100" />
                    <FormHelperText>Used in public invoices and printed receipts.</FormHelperText>
                 </FormControl>
               </SimpleGrid>
            </TabPanel>

            {/* CONTACT TAB */}
            <TabPanel p={0} mb={4}>
              <Heading size="sm" mb={4} color={textColor}>Contact Information</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                 <FormControl gridColumn={{ md: "span 2" }}>
                    <FormLabel>Physical Address</FormLabel>
                    <Input name="contact_address" value={settings.contact_address || ''} onChange={handleChange} placeholder="123 Main St, City" />
                 </FormControl>
                 <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <Input name="contact_phone" value={settings.contact_phone || ''} onChange={handleChange} placeholder="+855 ..." />
                 </FormControl>
                 <FormControl>
                    <FormLabel>Email Address</FormLabel>
                    <Input type="email" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} placeholder="admin@domain.com" />
                 </FormControl>
              </SimpleGrid>
            </TabPanel>

            {/* FINANCE TAB */}
            <TabPanel p={0} mb={4}>
              <Heading size="sm" mb={4} color={textColor}>Financial Settings</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                 <FormControl>
                    <FormLabel>Currency Symbol</FormLabel>
                    <Select name="finance_currency" value={settings.finance_currency || '$'} onChange={handleChange}>
                      <option value="$">USD ($)</option>
                      <option value="៛">Khmer Riel (៛)</option>
                    </Select>
                 </FormControl>
                 <FormControl>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <Input type="number" step="0.01" name="finance_tax_rate" value={settings.finance_tax_rate || ''} onChange={handleChange} />
                 </FormControl>
                 <FormControl>
                    <FormLabel>Exchange Rate (1 USD = ? KHR)</FormLabel>
                    <Input type="number" step="1" name="finance_exchange_rate" value={settings.finance_exchange_rate || ''} onChange={handleChange} />
                    <FormHelperText>Used when primary currency is set to Riel.</FormHelperText>
                 </FormControl>
              </SimpleGrid>

              <Box borderTop="1px solid" borderColor={borderColor} pt={6}>
                 <Heading size="sm" mb={4} color={textColor}>Bank Account Details (Invoice Display)</Heading>
                 <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                       <FormLabel>Bank Name</FormLabel>
                       <Input name="bank_name" value={settings.bank_name || ''} onChange={handleChange} placeholder="e.g. ABA Bank" />
                    </FormControl>
                    <FormControl>
                       <FormLabel>Account Number</FormLabel>
                       <Input name="bank_account_number" value={settings.bank_account_number || ''} onChange={handleChange} />
                    </FormControl>
                    <FormControl gridColumn={{ md: "span 2" }}>
                       <FormLabel>Account Name</FormLabel>
                       <Input name="bank_account_name" value={settings.bank_account_name || ''} onChange={handleChange} placeholder="John Doe" />
                    </FormControl>
                 </SimpleGrid>
              </Box>
            </TabPanel>

            {/* UTILITIES TAB */}
            <TabPanel p={0} mb={4}>
              <Heading size="sm" mb={4} color={textColor}>Default Utility Rates</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                 <FormControl>
                    <FormLabel>Electricity Rate (per kWh)</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>$</InputLeftAddon>
                      <Input type="number" step="0.01" name="utility_rate_electricity" value={settings.utility_rate_electricity || ''} onChange={handleChange} placeholder="0.25" />
                    </InputGroup>
                 </FormControl>
                 <FormControl>
                    <FormLabel>Water Rate (per m³)</FormLabel>
                    <InputGroup>
                      <InputLeftAddon>$</InputLeftAddon>
                      <Input type="number" step="0.01" name="utility_rate_water" value={settings.utility_rate_water || ''} onChange={handleChange} placeholder="0.50" />
                    </InputGroup>
                 </FormControl>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}
