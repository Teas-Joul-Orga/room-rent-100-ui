import React from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Icon,
  useColorModeValue,
  Skeleton,
} from "@chakra-ui/react";

const StatsCard = ({ title, value, icon, color, subValue, isLoading, onClick }) => {
  const cardBg = useColorModeValue("white", "#161b22");
  const borderColor = useColorModeValue("gray.100", "#30363d");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");

  if (isLoading) {
    return <Skeleton height="120px" borderRadius="2xl" />;
  }

  return (
    <Box
      as={onClick ? "button" : "div"}
      onClick={onClick}
      textAlign="left"
      bg={cardBg}
      borderRadius="2xl"
      p={6}
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
      borderLeft="4px solid"
      borderLeftColor={`${color}.500`}
      _hover={onClick ? { boxShadow: "md", transform: "translateY(-2px)" } : {}}
      transition="all 0.2s"
      w="full"
    >
      <Flex align="center" justify="space-between" mb={2}>
        <Text
          fontSize="10px"
          fontWeight="black"
          color={mutedText}
          textTransform="uppercase"
          letterSpacing="widest"
        >
          {title}
        </Text>
        {icon && (
          <Icon as={icon} boxSize={5} color={`${color}.500`} />
        )}
      </Flex>
      
      <Flex align="baseline" gap={2}>
        <Heading size="lg" fontWeight="black" color={textColor}>
          {value}
        </Heading>
        {subValue && (
          <Text fontSize="xs" fontWeight="bold" color={mutedText}>
            {subValue}
          </Text>
        )}
      </Flex>
    </Box>
  );
};

export default StatsCard;
