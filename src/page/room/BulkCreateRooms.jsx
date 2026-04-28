import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  Checkbox,
  Icon,
  useColorModeValue,
  Spinner,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { FiLayers, FiArrowLeft, FiCheck, FiHash, FiGrid } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function BulkCreateRooms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = (localStorage.getItem("token") || sessionStorage.getItem("token"));

  const [isLoading, setIsLoading] = useState(false);
  const [fetchingFurniture, setFetchingFurniture] = useState(true);

  // Bulk config
  const [prefix, setPrefix] = useState("Room ");
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(5);

  // Shared properties
  const [form, setForm] = useState({
    base_rent_price: "",
    size: "",
    status: "available",
    description: "",
  });

  const [allFurniture, setAllFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState([]);

  // Generate preview names
  const previewNames = useMemo(() => {
    const names = [];
    const c = Math.min(Math.max(count || 0, 0), 100);
    const s = startNumber || 1;
    for (let i = 0; i < c; i++) {
      names.push(`${prefix}${s + i}`);
    }
    return names;
  }, [prefix, startNumber, count]);

  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/admin/furniture?limit=all", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.data || [];
          setAllFurniture(items.filter((f) => !f.deleted_at));
        }
      } catch (err) {
        console.error("Failed to fetch furniture", err);
      } finally {
        setFetchingFurniture(false);
      }
    };
    fetchFurniture();
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!prefix.trim()) {
      toast.error(t("room.prefix") + " is required");
      return;
    }
    if (!form.base_rent_price) {
      toast.error(t("room.name_rent_required"));
      return;
    }
    if (!count || count < 1) {
      toast.error(t("room.count") + " must be at least 1");
      return;
    }

    setIsLoading(true);

    const payload = {
      prefix: prefix,
      start_number: startNumber,
      count: count,
      base_rent_price: parseFloat(form.base_rent_price),
      status: form.status,
      size: form.size || null,
      description: form.description || null,
      furniture: selectedFurniture,
    };

    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/rooms/bulk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          t("room.bulk_create_success", { count: data.count || count })
        );
        setTimeout(() => navigate("/dashboard/rooms"), 800);
      } else {
        if (data.errors) {
          Object.values(data.errors).forEach((errArray) => {
            if (Array.isArray(errArray)) {
              errArray.forEach((err) => toast.error(err));
            }
          });
        } else {
          toast.error(data.error || t("room.bulk_create_failed"));
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("room.network_error"));
      setIsLoading(false);
    }
  };

  // Colors
  const bg = useColorModeValue("sky.50", "#0d1117");
  const cardBg = useColorModeValue("white", "#161b22");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#30363d");
  const headerTextColor = useColorModeValue("sky.900", "white");
  const furnitureBg = useColorModeValue("sky.50", "#30363d");
  const furnitureBorder = useColorModeValue("sky.100", "gray.600");
  const previewBg = useColorModeValue("purple.50", "#1c2333");
  const previewBorder = useColorModeValue("purple.200", "purple.800");
  const previewBadgeBg = useColorModeValue("purple.100", "purple.900");
  const previewBadgeColor = useColorModeValue("purple.700", "purple.200");
  const sectionBg = useColorModeValue("blue.50", "#1c2333");
  const sectionBorder = useColorModeValue("blue.100", "blue.800");
  const accentGradient = "linear(to-r, blue.500, purple.500)";

  return (
    <Box p={6} bg={bg} minH="100vh">
      <Box maxW="10xl" mx="auto" bg={cardBg} borderRadius="2xl" shadow="xl" p={8}>
        {/* HEADER */}
        <Flex align="center" gap={4} mb={8}>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/rooms")}
            color={mutedText}
            _hover={{ color: textColor }}
            p={2}
          >
            <Icon as={FiArrowLeft} boxSize={5} />
          </Button>
          <Box>
            <Flex align="center" gap={3}>
              <Flex
                align="center"
                justify="center"
                w={10}
                h={10}
                borderRadius="xl"
                bgGradient={accentGradient}
                color="white"
              >
                <Icon as={FiLayers} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="2xl" fontWeight="black" color={headerTextColor}>
                  {t("room.bulk_create_title")}
                </Heading>
                <Text fontSize="md" fontWeight="bold" color={mutedText}>
                  {t("room.bulk_create_subtitle")}
                </Text>
              </Box>
            </Flex>
          </Box>
        </Flex>

        <form onSubmit={handleSave}>
          {/* ===== SECTION 1: NAME GENERATOR ===== */}
          <Box
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="2xl"
            p={6}
            mb={6}
          >
            <Flex align="center" gap={2} mb={1}>
              <Icon as={FiHash} color="blue.500" />
              <Heading size="md" fontWeight="black" color={headerTextColor}>
                {t("room.preview_names")}
              </Heading>
            </Flex>
            <Text fontSize="md" fontWeight="bold" color={mutedText} mb={6}>
              {t("room.bulk_create_subtitle")}
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={5}>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.prefix")} *
                </Text>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder={t("room.prefix_placeholder")}
                  size="lg"
                  fontSize="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.start_number")}
                </Text>
                <NumberInput
                  min={1}
                  max={9999}
                  value={startNumber}
                  onChange={(_, val) => setStartNumber(val || 1)}
                  size="lg"
                  fontSize="md"
                >
                  <NumberInputField
                    borderColor={borderColor}
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.count")} *
                </Text>
                <NumberInput
                  min={1}
                  max={100}
                  value={count}
                  onChange={(_, val) => setCount(val || 1)}
                  size="lg"
                  fontSize="md"
                >
                  <NumberInputField
                    borderColor={borderColor}
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </SimpleGrid>

            {/* Live Preview */}
            <Box
              bg={previewBg}
              border="1px solid"
              borderColor={previewBorder}
              borderRadius="xl"
              p={4}
              maxH="160px"
              overflowY="auto"
            >
              <Text fontSize="xs" fontWeight="bold" color={mutedText} letterSpacing="wide" mb={2}>
                {t("room.preview_names")} ({previewNames.length})
              </Text>
              <Flex wrap="wrap" gap={2}>
                {previewNames.map((name, idx) => (
                  <Badge
                    key={idx}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    bg={previewBadgeBg}
                    color={previewBadgeColor}
                    fontWeight="semibold"
                    fontSize="sm"
                  >
                    {name}
                  </Badge>
                ))}
                {previewNames.length === 0 && (
                  <Text fontSize="sm" color={mutedText} fontStyle="italic">
                    —
                  </Text>
                )}
              </Flex>
            </Box>
          </Box>

          {/* ===== SECTION 2: SHARED PROPERTIES ===== */}
          <Box
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="2xl"
            p={6}
            mb={6}
          >
            <Flex align="center" gap={2} mb={1}>
              <Icon as={FiGrid} color="blue.500" />
              <Heading size="md" fontWeight="black" color={headerTextColor}>
                {t("room.shared_properties")}
              </Heading>
            </Flex>
            <Text fontSize="md" fontWeight="bold" color={mutedText} mb={6}>
              These settings will be applied to all {count || 0} rooms.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.base_rent_usd")} *
                </Text>
                <Input
                  type="number"
                  value={form.base_rent_price}
                  onChange={(e) => setForm({ ...form, base_rent_price: e.target.value })}
                  placeholder="120"
                  size="lg"
                  fontSize="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.size_optional")}
                </Text>
                <Input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder={t("room.size_placeholder")}
                  size="lg"
                  fontSize="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                  {t("room.status")}
                </Text>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  size="lg"
                  fontSize="md"
                  borderColor={borderColor}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                >
                  <option value="available">{t("room.available_free")}</option>
                  <option value="occupied">{t("room.occupied")}</option>
                  <option value="maintenance">{t("room.maintenance")}</option>
                </Select>
              </Box>
            </SimpleGrid>

            <Box>
              <Text fontSize="md" fontWeight="black" color={textColor} mb={2}>
                {t("room.description_optional")}
              </Text>
              <Textarea
                rows={4}
                fontSize="md"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("room.description_placeholder")}
                borderColor={borderColor}
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                resize="none"
              />
            </Box>
          </Box>

          {/* ===== SECTION 3: FURNITURE ===== */}
          <Box
            bg={furnitureBg}
            border="1px solid"
            borderColor={furnitureBorder}
            borderRadius="2xl"
            p={6}
            mb={6}
          >
            <Heading size="md" fontWeight="black" color={headerTextColor} mb={2}>
              {t("room.assign_furniture")}
            </Heading>
            <Text fontSize="md" fontWeight="bold" color={mutedText} mb={6}>
              {t("room.select_furniture")}
            </Text>

            {fetchingFurniture ? (
              <Flex justify="center" py={4}>
                <Spinner color="blue.500" />
              </Flex>
            ) : allFurniture.length === 0 ? (
              <Text fontSize="sm" color={mutedText} fontStyle="italic">
                {t("room.no_furniture")}
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                {allFurniture.map((f) => {
                  const checked = selectedFurniture.includes(f.id);
                  return (
                    <Flex
                      as="label"
                      key={f.id}
                      align="center"
                      gap={3}
                      p={3}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={checked ? "blue.400" : borderColor}
                      bg={checked ? cardBg : "transparent"}
                      shadow={checked ? "sm" : "none"}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: "blue.300", bg: cardBg }}
                    >
                      <Checkbox
                        isChecked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFurniture([...selectedFurniture, f.id]);
                          } else {
                            setSelectedFurniture(
                              selectedFurniture.filter((id) => id !== f.id)
                            );
                          }
                        }}
                        colorScheme="blue"
                      />
                      <Box>
                        <Text fontSize="md" fontWeight="black" color={textColor}>
                          {f.name}
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color={mutedText}>
                          {f.condition || f.type}
                        </Text>
                      </Box>
                    </Flex>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>

          {/* ===== SUMMARY & ACTIONS ===== */}
          <Box
            bg={useColorModeValue("green.50", "#1a2e1a")}
            border="1px solid"
            borderColor={useColorModeValue("green.200", "green.800")}
            borderRadius="2xl"
            p={5}
            mb={6}
          >
            <Flex align="center" gap={2} mb={2}>
              <Icon as={FiCheck} color="green.500" boxSize={5} />
              <Text fontWeight="bold" color={textColor}>
                {t("room.summary_text", { count: count || 0 })}
              </Text>
            </Flex>
            {previewNames.length > 0 && (
              <Text fontSize="sm" color={mutedText}>
                <strong>{previewNames[0]}</strong>
                {previewNames.length > 1 && (
                  <>
                    {" → "}
                    <strong>{previewNames[previewNames.length - 1]}</strong>
                  </>
                )}
                {" • "}${form.base_rent_price || "0"}/mo
                {selectedFurniture.length > 0 && ` • ${selectedFurniture.length} furniture items`}
              </Text>
            )}
          </Box>

          {/* Actions */}
          <Flex
            justify="flex-end"
            gap={4}
            pt={6}
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/dashboard/rooms")}
              color={textColor}
              borderColor={borderColor}
              isDisabled={isLoading}
              px={8}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="lg"
              fontSize="md"
              bgGradient={accentGradient}
              color="white"
              _hover={{ opacity: 0.9 }}
              isLoading={isLoading}
              loadingText={t("room.bulk_creating")}
              px={10}
              leftIcon={<FiLayers />}
              shadow="xl"
            >
              {t("room.bulk_create_confirm", { count: count || 0 })}
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}
