import React from "react";
import {
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  useColorModeValue,
  Center,
} from "@chakra-ui/react";
import { FiInbox } from "react-icons/fi";

const EmptyState = ({ 
  title = "No data found", 
  description = "There are no records to display at the moment.", 
  icon = FiInbox, 
  actionText, 
  onAction 
}) => {
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Center py={20} px={6} w="full">
      <VStack spacing={6} textAlign="center" maxW="md">
        <Icon as={icon} boxSize={16} color={iconColor} />
        <VStack spacing={2}>
          <Heading size="md" color={textColor} fontWeight="black" textTransform="uppercase" letterSpacing="tight">
            {title}
          </Heading>
          <Text color={mutedText} fontSize="sm">
            {description}
          </Text>
        </VStack>
        {actionText && onAction && (
          <Button
            colorScheme="blue"
            onClick={onAction}
            px={8}
            fontWeight="black"
            textTransform="uppercase"
            fontSize="xs"
            letterSpacing="widest"
            borderRadius="xl"
            shadow="lg"
          >
            {actionText}
          </Button>
        )}
      </VStack>
    </Center>
  );
};

export default EmptyState;
