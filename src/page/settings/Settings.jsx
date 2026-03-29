import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Button,
  FormControl, FormLabel, Input, Select, SimpleGrid, useColorModeValue,
  Spinner, useToast, Heading, FormHelperText, InputGroup, InputLeftAddon,
  Icon, Divider, Stack, VStack, HStack, Container, useDisclosure
} from '@chakra-ui/react';
import { 
  FiSave, FiGlobe, FiPhone, FiMail, FiMapPin, FiCreditCard, 
  FiZap, FiDroplet, FiInfo, FiBriefcase, FiDollarSign, FiPercent,
  FiDatabase, FiUpload, FiDownload, FiAlertTriangle
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const API = "http://localhost:8000/api/v1";

export default function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const toast = useToast();
  const fileInputRef = useRef();
  const restoreDisc = useDisclosure();
  const [selectedFile, setSelectedFile] = useState(null);

  const mainBg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const sidebarItemActiveBg = useColorModeValue("blue.50", "#1c2128");
  const sidebarItemActiveText = useColorModeValue("blue.600", "blue.400");
  
  // Fetch existing settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const flatSettings = {};
        Object.keys(data).forEach(k => {
          flatSettings[k] = data[k].value;
        });
        setSettings(flatSettings);
        if (flatSettings.finance_currency) localStorage.setItem("currency", flatSettings.finance_currency);
        if (flatSettings.finance_exchange_rate) localStorage.setItem("exchangeRate", flatSettings.finance_exchange_rate);
        if (flatSettings.utility_rate_electricity) localStorage.setItem("utility_rate_electricity", flatSettings.utility_rate_electricity);
        if (flatSettings.utility_rate_water) localStorage.setItem("utility_rate_water", flatSettings.utility_rate_water);
      }
    } catch (e) {
      toast({ title: t('common.error_loading'), status: 'error', position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
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
        toast({ title: t('settings_page.save_success'), status: 'success', duration: 3000, position: 'top-right' });
        fetchSettings();
      } else {
        toast({ title: t('common.error'), description: result.error || 'Server error', status: 'error', position: 'top-right' });
      }
    } catch(e) {
      toast({ title: t('common.network_error'), status: 'error', duration: 3000, position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/settings/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Backup failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Backup downloaded successfully', status: 'success', position: 'top-right' });
    } catch (e) {
      toast({ title: `Backup failed: ${e.message}`, status: 'error', position: 'top-right' });
    }
  };

  const onFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      restoreDisc.onOpen();
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup_file', selectedFile);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/settings/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const result = await res.json();
      if (res.ok) {
        toast({ 
          title: 'Database restored successfully', 
          description: 'The system has been updated with the backup data.',
          status: 'success', 
          duration: 5000,
          position: 'top-right' 
        });
        fetchSettings();
      } else {
        toast({ title: 'Restore failed', description: result.error, status: 'error', position: 'top-right' });
      }
    } catch (e) {
      toast({ title: 'Network error during restore', status: 'error', position: 'top-right' });
    } finally {
      setRestoring(false);
      restoreDisc.onClose();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const SidebarItem = ({ id, label, icon }) => (
    <Flex
      align="center"
      p={3}
      cursor="pointer"
      borderRadius="xl"
      transition="all 0.2s"
      bg={activeTab === id ? sidebarItemActiveBg : 'transparent'}
      color={activeTab === id ? sidebarItemActiveText : textColor}
      _hover={{ bg: activeTab === id ? sidebarItemActiveBg : useColorModeValue("gray.100", "#1c2128") }}
      onClick={() => setActiveTab(id)}
      fontWeight={activeTab === id ? "black" : "medium"}
    >
      <Icon as={icon} boxSize={5} mr={3} />
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );

  const SectionHeader = ({ title, subtitle, icon }) => (
    <Box mb={8}>
      <HStack spacing={3} mb={1}>
        <Icon as={icon} boxSize={6} color="blue.500" />
        <Heading size="md" color={textColor} letterSpacing="tight">{title}</Heading>
      </HStack>
      <Text fontSize="sm" color={mutedText}>{subtitle}</Text>
      <Divider mt={4} borderColor={borderColor} />
    </Box>
  );

  if (loading) {
    return <Flex py={40} justify="center" bg={mainBg} h="100vh"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>;
  }

  return (
    <Box bg={mainBg} minH="calc(100vh - 80px)" p={{ base: 4, md: 8 }}>
      <Container maxW="container.xxl" p={0}>
        <Flex justify="space-between" align="center" mb={10} flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" fontWeight="black" color={textColor} letterSpacing="tight">
              {t('settings_page.title')}
            </Heading>
            <Text color={mutedText} fontWeight="medium">
              {t('settings_page.subtitle')}
            </Text>
          </Box>
          <Button 
            leftIcon={<FiSave />} 
            colorScheme="blue" 
            borderRadius="xl" 
            size="lg"
            px={8}
            onClick={handleSave} 
            isLoading={saving}
            loadingText={t('settings_page.saving')}
            shadow="lg"
          >
            {t('settings_page.save')}
          </Button>
        </Flex>

        <Flex gap={8} direction={{ base: "column", lg: "row" }}>
          <Box w={{ base: "100%", lg: "280px" }} flexShrink={0}>
            <VStack bg={cardBg} p={4} borderRadius="2xl" border="1px solid" borderColor={borderColor} align="stretch" spacing={2} shadow="sm">
              <SidebarItem id="general" label={t('settings_page.nav.general')} icon={FiGlobe} />
              <SidebarItem id="contact" label={t('settings_page.nav.contact')} icon={FiPhone} />
              <SidebarItem id="finance" label={t('settings_page.nav.finance')} icon={FiDollarSign} />
              <SidebarItem id="utilities" label={t('settings_page.nav.utilities')} icon={FiZap} />
              <SidebarItem id="maintenance" label="System Maintenance" icon={FiDatabase} />
            </VStack>
            
            <Box bg="blue.500" p={6} borderRadius="2xl" mt={6} color="white" shadow="xl" position="relative" overflow="hidden">
               <Icon as={FiInfo} boxSize={20} position="absolute" right="-20px" bottom="-20px" opacity={0.2} transform="rotate(-15deg)" />
               <Text fontWeight="black" fontSize="md" mb={2}>{t('settings_page.tip_title')}</Text>
               <Text fontSize="xs" opacity={0.9} lineHeight="tall">
                 {t('settings_page.tip_desc')}
               </Text>
            </Box>
          </Box>

          <Box flex={1} bg={cardBg} p={{ base: 6, md: 10 }} borderRadius="3xl" border="1px solid" borderColor={borderColor} shadow="sm">
            
            {activeTab === 'general' && (
              <Box>
                <SectionHeader title={t('settings_page.general.header')} subtitle={t('settings_page.general.desc')} icon={FiGlobe} />
                <Stack spacing={8}>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.general.label_app_name')}</FormLabel>
                    <Input name="app_name" value={settings.app_name || ''} onChange={handleChange} placeholder={t('settings_page.general.app_name_placeholder')} borderRadius="xl" focusBorderColor="blue.500" size="lg" />
                    <FormHelperText fontSize="xs">{t('settings_page.general.app_name_helper')}</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.general.label_company_name')}</FormLabel>
                    <Input size="lg" name="company_name" value={settings.company_name || ''} onChange={handleChange} placeholder={t('settings_page.general.company_name_placeholder')} borderRadius="xl" focusBorderColor="blue.500" />
                    <FormHelperText fontSize="xs">{t('settings_page.general.company_name_helper')}</FormHelperText>
                  </FormControl>
                </Stack>
              </Box>
            )}

            {activeTab === 'contact' && (
              <Box>
                <SectionHeader title={t('settings_page.contact.header')} subtitle={t('settings_page.contact.desc')} icon={FiBriefcase} />
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                  <FormControl gridColumn={{ md: "span 2" }}>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.contact.label_address')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl"><FiMapPin /></InputLeftAddon>
                      <Input name="contact_address" value={settings.contact_address || ''} onChange={handleChange} placeholder="123 Main St, City" borderRadius="xl" focusBorderColor="blue.500" />
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.contact.label_phone')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl"><FiPhone /></InputLeftAddon>
                      <Input name="contact_phone" value={settings.contact_phone || ''} onChange={handleChange} placeholder="+855 12 345 678" borderRadius="xl" focusBorderColor="blue.500" />
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.contact.label_email')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl"><FiMail /></InputLeftAddon>
                      <Input type="email" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} placeholder="admin@domain.com" borderRadius="xl" focusBorderColor="blue.500" />
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
              </Box>
            )}

            {activeTab === 'finance' && (
              <Box>
                <SectionHeader title={t('settings_page.finance.header')} subtitle={t('settings_page.finance.desc')} icon={FiDollarSign} />
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={10}>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.finance.label_currency')}</FormLabel>
                    <Select size="lg" name="finance_currency" value={settings.finance_currency || '$'} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500">
                      <option value="$">US Dollar ($)</option>
                      <option value="៛">Khmer Riel (៛)</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.finance.label_tax')}</FormLabel>
                    <InputGroup size="lg">
                      <Input type="number" step="0.01" name="finance_tax_rate" value={settings.finance_tax_rate || ''} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                      <InputLeftAddon borderRightRadius="xl"><FiPercent /></InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.finance.label_exchange')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl">1 USD = </InputLeftAddon>
                      <Input type="number" step="1" name="finance_exchange_rate" value={settings.finance_exchange_rate || ''} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                      <InputLeftAddon borderRightRadius="xl">KHR (៛)</InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
                <Box bg={mainBg} p={8} borderRadius="2xl" border="1px dashed" borderColor={borderColor}>
                   <HStack spacing={3} mb={6}><Icon as={FiCreditCard} boxSize={5} color="blue.500" /><Heading size="sm" color={textColor} textTransform="uppercase" letterSpacing="widest">{t('settings_page.finance.bank_header')}</Heading></HStack>
                   <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl><FormLabel fontSize="xs" fontWeight="bold">{t('settings_page.finance.label_bank_name')}</FormLabel><Input size="md" name="bank_name" value={settings.bank_name || ''} onChange={handleChange} placeholder="e.g. ABA Bank" borderRadius="lg" bg={cardBg} /></FormControl>
                      <FormControl><FormLabel fontSize="xs" fontWeight="bold">{t('settings_page.finance.label_account_number')}</FormLabel><Input size="md" name="bank_account_number" value={settings.bank_account_number || ''} onChange={handleChange} borderRadius="lg" bg={cardBg} /></FormControl>
                      <FormControl gridColumn={{ md: "span 2" }}><FormLabel fontSize="xs" fontWeight="bold">{t('settings_page.finance.label_account_name')}</FormLabel><Input size="md" name="bank_account_name" value={settings.bank_account_name || ''} onChange={handleChange} placeholder="John Doe" borderRadius="lg" bg={cardBg} /></FormControl>
                   </SimpleGrid>
                </Box>
              </Box>
            )}

            {activeTab === 'utilities' && (
              <Box>
                <SectionHeader title={t('settings_page.utilities.header')} subtitle={t('settings_page.utilities.desc')} icon={FiZap} />
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.utilities.label_electricity')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl"><Icon as={FiZap} color="orange.400" /></InputLeftAddon>
                      <Input type="number" step="0.001" name="utility_rate_electricity" value={settings.utility_rate_electricity || ''} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                      <InputLeftAddon borderRightRadius="xl">$/kWh</InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="black" fontSize="sm" color={mutedText} textTransform="uppercase">{t('settings_page.utilities.label_water')}</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon borderLeftRadius="xl"><Icon as={FiDroplet} color="blue.400" /></InputLeftAddon>
                      <Input type="number" step="0.001" name="utility_rate_water" value={settings.utility_rate_water || ''} onChange={handleChange} borderRadius="xl" focusBorderColor="blue.500" />
                      <InputLeftAddon borderRightRadius="xl">$/m³</InputLeftAddon>
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
              </Box>
            )}

            {activeTab === 'maintenance' && (
              <Box>
                <SectionHeader title="System Maintenance" subtitle="Backup and restore your system data safely." icon={FiDatabase} />
                <VStack spacing={8} align="stretch">
                  <Box p={6} borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={mainBg}>
                    <HStack spacing={4} mb={4}>
                      <CircleIcon icon={FiDownload} color="blue" />
                      <Box>
                        <Heading size="sm" color={textColor}>Database Backup</Heading>
                        <Text fontSize="xs" color={mutedText}>Download a full copy of your database.</Text>
                      </Box>
                    </HStack>
                    <Text fontSize="sm" mb={6}>Generating a backup will export all your rooms, tenants, leases, and financial records into a single SQL file. We recommend doing this weekly.</Text>
                    <Button leftIcon={<FiDownload />} colorScheme="blue" onClick={handleBackup} borderRadius="xl">Download .SQL Backup</Button>
                  </Box>

                  <Box p={6} borderRadius="2xl" border="1px solid" borderColor="red.200" _dark={{ borderColor: "red.900" }} bg={useColorModeValue("red.50", "rgba(255,0,0,0.05)")}>
                    <HStack spacing={4} mb={4}>
                      <CircleIcon icon={FiUpload} color="red" />
                      <Box>
                        <Heading size="sm" color={textColor}>Database Restore</Heading>
                        <Text fontSize="xs" color={mutedText}>Restore data from a previously saved backup.</Text>
                      </Box>
                    </HStack>
                    <Text fontSize="sm" color="red.700" _dark={{ color: "red.200" }} mb={6} fontWeight="medium">
                      Warning: Restoring will completely overwrite your current database. This action cannot be undone.
                    </Text>
                    <input type="file" accept=".sql" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />
                    <Button leftIcon={<FiUpload />} colorScheme="red" onClick={() => fileInputRef.current.click()} borderRadius="xl">Upload & Restore Data</Button>
                  </Box>
                </VStack>
              </Box>
            )}

          </Box>
        </Flex>
      </Container>

      <ConfirmDialog 
        isOpen={restoreDisc.isOpen}
        onClose={() => {
          restoreDisc.onClose();
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onConfirm={handleRestore}
        title="Critical: Restore Database?"
        message={`You are about to restore the database using file: "${selectedFile?.name}". All current data will be PERMANENTLY DELETED and replaced. Are you absolutely sure?`}
        confirmText="Yes, Restore Everything"
        isLoading={restoring}
      />
    </Box>
  );
}

const CircleIcon = ({ icon, color }) => (
  <Flex w="10" h="10" borderRadius="full" align="center" justify="center" bg={`${color}.100`} color={`${color}.600`} _dark={{ bg: `${color}.900`, color: `${color}.200` }}>
    <Icon as={icon} boxSize={5} />
  </Flex>
);
