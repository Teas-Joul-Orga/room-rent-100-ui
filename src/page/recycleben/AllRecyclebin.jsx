import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Flex, Text, Tabs, TabList, TabPanels, Tab, TabPanel,
  TableContainer, Table, Thead, Tbody, Tr, Th, Td, Badge,
  useColorModeValue, Spinner, IconButton, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure, Button, Tooltip,
  Input, InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { FiRefreshCcw, FiTrash2, FiSearch } from 'react-icons/fi';
import dayjs from "dayjs";

const API = "http://localhost:8000/api/v1";

export default function AllRecyclebin() {
  const [data, setData] = useState({ tenants: [], rooms: [], furniture: [], leases: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // AlertDialog state for permanent deletion
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toast = useToast();
  const bg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "#1c2333");

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(search ? { search } : {});
      const res = await fetch(`${API}/admin/trash?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Error fetching trash:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchTrash();
    }
  };

  const execAction = async (type, id, action) => {
    try {
      const token = localStorage.getItem('token');
      // POST for restore, DELETE for force-delete
      const method = action === 'restore' ? 'POST' : 'DELETE';
      const endpoint = `${API}/admin/trash/${type}/${id}/${action === 'restore' ? 'restore' : 'force-delete'}`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast({
          title: `Item ${action === 'restore' ? 'restored' : 'permanently deleted'}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchTrash(); // refresh table
      } else {
        toast({ title: 'Action failed', status: 'error', duration: 3000, isClosable: true });
      }
    } catch(e) {
      toast({ title: 'Network error', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const confirmDelete = (type, id) => {
    setDeleteTarget({ type, id });
    onOpen();
  };

  const executeDelete = () => {
    if (deleteTarget) {
      execAction(deleteTarget.type, deleteTarget.id, 'force-delete');
    }
    onClose();
  };

  const RenderTable = ({ type, items, columns, rowRender }) => (
    <Box mt={4} bg={bg} borderRadius="2xl" shadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
      <TableContainer>
        <Table size="md" variant="simple">
          <Thead bg={hoverBg}>
            <Tr>
              {columns.map(c => <Th key={c}>{c}</Th>)}
              <Th>Deleted On</Th>
              <Th textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.length > 0 ? items.map(item => (
              <Tr key={item.id} _hover={{ bg: hoverBg }}>
                {rowRender(item)}
                <Td fontSize="sm" color={mutedText}>{dayjs(item.deleted_at).format('MMM D, YYYY h:mm A')}</Td>
                <Td textAlign="right">
                  <Flex justify="flex-end" gap={2}>
                    <Tooltip label="Restore" placement="top">
                      <IconButton icon={<FiRefreshCcw />} onClick={() => execAction(type, item.id, 'restore')} size="sm" colorScheme="green" variant="ghost" aria-label="Restore item" />
                    </Tooltip>
                    <Tooltip label="Permanently Delete" placement="top">
                      <IconButton icon={<FiTrash2 />} onClick={() => confirmDelete(type, item.id)} size="sm" colorScheme="red" variant="ghost" aria-label="Permanently delete item" />
                    </Tooltip>
                  </Flex>
                </Td>
              </Tr>
            )) : (
              <Tr><Td colSpan={columns.length + 2} textAlign="center" py={10} color={mutedText}>No deleted {type} found.</Td></Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box p={6}>
       <Flex justify="space-between" align="flex-end" mb={6}>
         <Box>
           <Text fontSize="2xl" fontWeight="black" color={textColor} letterSpacing="tight">Recycle Bin</Text>
           <Text fontSize="sm" color={mutedText}>Restore or permanently delete removed system records.</Text>
         </Box>
         <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none"><FiSearch color="gray.300" /></InputLeftElement>
            <Input 
              type="text" 
              placeholder="Search deleted records... [Enter]" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={handleSearch}
              bg={bg} 
              borderRadius="xl" 
            />
         </InputGroup>
       </Flex>

       {loading ? (
         <Flex py={20} justify="center"><Spinner size="xl" color="blue.500" thickness="4px" /></Flex>
       ) : (
         <Box bg={bg} borderRadius="2xl" p={4} shadow="sm" border="1px solid" borderColor={borderColor}>
           <Tabs colorScheme="blue" variant="soft-rounded">
              <TabList mb={4} gap={2} overflowX="auto">
                <Tab rounded="full" fontWeight="bold">Tenants <Badge ml={2} colorScheme="blue" rounded="full">{data.tenants?.length || 0}</Badge></Tab>
                <Tab rounded="full" fontWeight="bold">Rooms <Badge ml={2} colorScheme="blue" rounded="full">{data.rooms?.length || 0}</Badge></Tab>
                <Tab rounded="full" fontWeight="bold">Furniture <Badge ml={2} colorScheme="blue" rounded="full">{data.furniture?.length || 0}</Badge></Tab>
                <Tab rounded="full" fontWeight="bold">Leases <Badge ml={2} colorScheme="blue" rounded="full">{data.leases?.length || 0}</Badge></Tab>
              </TabList>

              <TabPanels>
                 {/* TENANTS */}
                 <TabPanel p={0}>
                   <RenderTable 
                     type="tenant" 
                     items={data.tenants || []} 
                     columns={['Name', 'Email', 'Phone']} 
                     rowRender={(t) => (
                       <>
                         <Td fontSize="sm" fontWeight="bold" color={textColor}>{t.name}</Td>
                         <Td fontSize="sm" color={mutedText}>{t.email}</Td>
                         <Td fontSize="sm" color={mutedText}>{t.phone}</Td>
                       </>
                     )}
                   />
                 </TabPanel>

                 {/* ROOMS */}
                 <TabPanel p={0}>
                  <RenderTable 
                      type="room" 
                      items={data.rooms || []} 
                      columns={['Room Name', 'Type', 'Price']} 
                      rowRender={(r) => (
                        <>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{r.name}</Td>
                          <Td fontSize="sm" color={mutedText} textTransform="uppercase">{r.type}</Td>
                          <Td fontSize="sm" color={mutedText}>${r.base_rent_price || r.price}</Td>
                        </>
                      )}
                    />
                 </TabPanel>

                 {/* FURNITURE */}
                 <TabPanel p={0}>
                   <RenderTable 
                      type="furniture" 
                      items={data.furniture || []} 
                      columns={['Furniture Name', 'Condition', 'Cost']} 
                      rowRender={(f) => (
                        <>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{f.name}</Td>
                          <Td><Badge colorScheme={f.condition === 'new' ? 'green' : 'orange'}>{f.condition}</Badge></Td>
                          <Td fontSize="sm" color={mutedText}>${f.cost}</Td>
                        </>
                      )}
                    />
                 </TabPanel>

                 {/* LEASES */}
                 <TabPanel p={0}>
                   <RenderTable 
                      type="lease" 
                      items={data.leases || []} 
                      columns={['Tenant', 'Room', 'Duration']} 
                      rowRender={(l) => (
                        <>
                          <Td fontSize="sm" fontWeight="bold" color={textColor}>{l.tenant?.name}</Td>
                          <Td fontSize="sm" color="blue.500" fontWeight="bold">{l.room?.name}</Td>
                          <Td fontSize="sm" color={mutedText}>{dayjs(l.start_date).format('MMM D, YY')} - {dayjs(l.end_date).format('MMM D, YY')}</Td>
                        </>
                      )}
                    />
                 </TabPanel>
              </TabPanels>
           </Tabs>
         </Box>
       )}

       {/* Delete Confirmation Alert */}
       <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={bg} borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="black" color={textColor}>Permanent Deletion</AlertDialogHeader>
            <AlertDialogBody color={mutedText}>
              Are you sure you want to permanently delete this {deleteTarget?.type}? This action absolutely cannot be undone and will scrub associated records.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} borderRadius="xl">Cancel</Button>
              <Button colorScheme="red" onClick={executeDelete} ml={3} borderRadius="xl">Delete Forever</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
