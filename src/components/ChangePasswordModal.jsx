import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import toast from "react-hot-toast";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Styling hooks
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password updated successfully");
        // Reset form and close
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        // Handle validation errors or incorrect current password
        if (data.errors) {
          Object.values(data.errors).forEach((errArray) => {
            errArray.forEach((err) => toast.error(err));
          });
        } else {
          toast.error(data.message || "Failed to update password");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Could not connect to API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} color={textColor} borderRadius="2xl" shadow="2xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader>Change Password</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Current Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  focusBorderColor="blue.500"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px" borderColor={useColorModeValue("gray.100", "gray.700")}>
            <Button onClick={onClose} mr={3} variant="ghost" rounded="xl">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              rounded="xl"
              type="submit"
              isLoading={isLoading}
              loadingText="Updating..."
            >
              Update Password
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
