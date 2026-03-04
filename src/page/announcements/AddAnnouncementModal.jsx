import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Textarea, Select, VStack, useToast, useColorModeValue,
  FormHelperText, Box
} from '@chakra-ui/react';
import dayjs from "dayjs";

const API = "http://localhost:8000/api/v1";

export default function AddAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const [data, setData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    schedule_option: 'now',
    scheduled_at: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  const bg = useColorModeValue("white", "gray.800");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('priority', data.priority);
      formData.append('schedule_option', data.schedule_option);
      
      if (data.schedule_option === 'later') {
        if (!data.scheduled_at) {
          toast({ title: 'Scheduled date required.', status: 'error' });
          setLoading(false);
          return;
        }
        formData.append('scheduled_at', dayjs(data.scheduled_at).format('YYYY-MM-DD HH:mm:ss'));
      }

      if (photo) formData.append('photo', photo);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/announcements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast({ title: 'Announcement created successfully.', status: 'success', duration: 3000 });
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        toast({ title: 'Creation failed.', description: err.message || JSON.stringify(err.errors), status: 'error', duration: 5000 });
      }
    } catch(e) {
      toast({ title: 'Network error.', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bg} borderRadius="2xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create Broadcast</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Headline (Title)</FormLabel>
                <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="e.g. Water Shutoff Notice" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea value={data.content} onChange={e => setData({...data, content: e.target.value})} rows={4} placeholder="Type the broadcast message..." />
              </FormControl>

              <FormControl>
                <FormLabel>Photo Attachment (Optional)</FormLabel>
                <Box p={4} border="1px dashed" borderColor="gray.300" borderRadius="md">
                  <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} border="none" p={0} pt={1} />
                </Box>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Priority Level</FormLabel>
                <Select value={data.priority} onChange={e => setData({...data, priority: e.target.value})}>
                  <option value="normal">Normal (Informational)</option>
                  <option value="urgent">Urgent (Critical alert)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Publishing Schedule</FormLabel>
                <Select value={data.schedule_option} onChange={e => setData({...data, schedule_option: e.target.value, scheduled_at: ''})}>
                  <option value="now">Post & Notify Immediately</option>
                  <option value="later">Schedule for Later</option>
                </Select>
                {data.schedule_option === 'later' && (
                  <Input mt={2} type="datetime-local" value={data.scheduled_at} onChange={e => setData({...data, scheduled_at: e.target.value})} required />
                )}
                {data.schedule_option === 'now' && (
                  <FormHelperText>Push notifications will trigger immediately for all active tenants.</FormHelperText>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" type="submit" isLoading={loading}>Create Broadcast</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
