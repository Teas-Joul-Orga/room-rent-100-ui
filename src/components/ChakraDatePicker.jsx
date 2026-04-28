import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  useColorModeValue,
  useOutsideClick,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function ChakraDatePicker({
  selectedDate,
  onChange,
  placeholder = 'mm/dd/yyyy',
  showTimeSelect = false,
  size = 'md',
  bg,
  border,
  borderColor,
  variant,
  w,
  minW,
  maxW,
  isDisabled = false,
  isClearable = true,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  });
  const [timeValue, setTimeValue] = useState('12:00');

  const containerRef = useRef(null);

  useOutsideClick({
    ref: containerRef,
    handler: () => setIsOpen(false),
  });

  // Update viewDate when selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
        if (showTimeSelect) {
          const hrs = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          setTimeValue(`${hrs}:${mins}`);
        }
      }
    }
  }, [selectedDate]);

  // Colors
  const popoverBg = useColorModeValue('white', '#1a202c');
  const popoverBorder = useColorModeValue('gray.200', '#2d3748');
  const dayHoverBg = useColorModeValue('gray.100', '#2d3748');
  const selectedBg = useColorModeValue('blackAlpha.800', 'whiteAlpha.900');
  const selectedColor = useColorModeValue('white', 'black');
  const todayBg = useColorModeValue('gray.100', '#2d3748');
  const headerColor = useColorModeValue('gray.800', 'white');
  const dayColor = useColorModeValue('gray.800', 'gray.100');
  const outsideDayColor = useColorModeValue('gray.300', 'gray.600');
  const dayNameColor = useColorModeValue('gray.500', 'gray.500');
  const inputBg = bg || useColorModeValue('white', 'whiteAlpha.100');
  const inputBorderColor = borderColor || useColorModeValue('inherit', 'whiteAlpha.300');
  const navBtnHover = useColorModeValue('gray.100', '#2d3748');
  const iconColor = useColorModeValue('gray.400', 'gray.500');
  const iconHoverColor = useColorModeValue('gray.600', 'gray.300');

  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), date: d.getDate() };
  }, []);

  const selectedParsed = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), date: d.getDate() };
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Build the calendar grid (6 weeks × 7 days)
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, current: false, month: month - 1 });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, month: month });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, month: month + 1 });
    }
    return days;
  }, [year, month, daysInMonth, firstDay, daysInPrevMonth]);

  const handleDayClick = (dayObj) => {
    let targetMonth = dayObj.month;
    let targetYear = year;
    if (targetMonth < 0) { targetMonth = 11; targetYear--; }
    if (targetMonth > 11) { targetMonth = 0; targetYear++; }

    const d = new Date(targetYear, targetMonth, dayObj.day);
    if (showTimeSelect) {
      const [hrs, mins] = timeValue.split(':');
      d.setHours(parseInt(hrs), parseInt(mins));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      onChange(`${y}-${m}-${dd}T${hh}:${mm}`);
    } else {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${dd}`);
    }
    if (!showTimeSelect) setIsOpen(false);
  };

  const handleTimeChange = (e) => {
    setTimeValue(e.target.value);
    if (selectedParsed) {
      const [hrs, mins] = e.target.value.split(':');
      const y = selectedParsed.year;
      const m = String(selectedParsed.month + 1).padStart(2, '0');
      const dd = String(selectedParsed.date).padStart(2, '0');
      onChange(`${y}-${m}-${dd}T${hrs}:${mins}`);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const displayValue = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return '';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const y = d.getFullYear();
    if (showTimeSelect) {
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${m}/${dd}/${y} ${hrs}:${mins}`;
    }
    return `${m}/${dd}/${y}`;
  }, [selectedDate, showTimeSelect]);

  const hasValue = Boolean(selectedDate);

  return (
    <Box
      ref={containerRef}
      position="relative"
      display="inline-flex"
      w={w || 'full'}
      minW={minW}
      maxW={maxW}
      flexShrink={0}
      {...props}
    >
      <Flex
        align="center"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        opacity={isDisabled ? 0.4 : 1}
        w="full"
        position="relative"
      >
        <Input
          value={displayValue}
          placeholder={placeholder}
          readOnly
          cursor="pointer"
          bg={inputBg}
          border={border}
          borderColor={inputBorderColor}
          variant={variant}
          size={size}
          isDisabled={isDisabled}
          pr={hasValue && isClearable && !isDisabled ? '60px' : '36px'}
          pointerEvents="none"
          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
        />
        <Flex
          align="center"
          gap={0}
          position="absolute"
          right="8px"
          top="50%"
          transform="translateY(-50%)"
          pointerEvents="auto"
          zIndex={1}
        >
          {hasValue && isClearable && !isDisabled && (
            <Box
              as="button"
              type="button"
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="20px"
              h="20px"
              borderRadius="sm"
              color={iconColor}
              _hover={{ color: 'red.400' }}
              onClick={handleClear}
              aria-label="Clear date"
            >
              <FiX size={12} />
            </Box>
          )}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="20px"
            h="20px"
            color={iconColor}
          >
            <FiCalendar size={14} />
          </Box>
        </Flex>
      </Flex>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          mt={1}
          zIndex={1500}
          bg={popoverBg}
          border="1px solid"
          borderColor={popoverBorder}
          borderRadius="lg"
          shadow="lg"
          p={3}
          w="280px"
          userSelect="none"
        >
          {/* Header */}
          <Flex align="center" justify="space-between" mb={2} px={1}>
            <Box
              as="button" type="button"
              display="flex" alignItems="center" justifyContent="center"
              w="28px" h="28px" borderRadius="md"
              onClick={(e) => { e.stopPropagation(); prevMonth(); }}
              _hover={{ bg: navBtnHover }}
              color={headerColor}
            >
              <FiChevronLeft size={16} />
            </Box>
            <Text fontSize="sm" fontWeight="bold" color={headerColor}>
              {MONTHS[month]} {year}
            </Text>
            <Box
              as="button" type="button"
              display="flex" alignItems="center" justifyContent="center"
              w="28px" h="28px" borderRadius="md"
              onClick={(e) => { e.stopPropagation(); nextMonth(); }}
              _hover={{ bg: navBtnHover }}
              color={headerColor}
            >
              <FiChevronRight size={16} />
            </Box>
          </Flex>

          {/* Day names */}
          <Grid templateColumns="repeat(7, 1fr)" gap={0} mb={1}>
            {DAYS.map((d, i) => (
              <GridItem key={i} textAlign="center" py={1}>
                <Text fontSize="xs" fontWeight="semibold" color={dayNameColor}>{d}</Text>
              </GridItem>
            ))}
          </Grid>

          {/* Day grid */}
          <Grid templateColumns="repeat(7, 1fr)" gap={0}>
            {calendarDays.map((dayObj, i) => {
              const isToday = dayObj.current && dayObj.day === today.date && month === today.month && year === today.year;
              const isSelected = selectedParsed && dayObj.current && dayObj.day === selectedParsed.date && month === selectedParsed.month && year === selectedParsed.year;

              return (
                <GridItem key={i} textAlign="center">
                  <Flex
                    as="button"
                    type="button"
                    align="center"
                    justify="center"
                    w="34px"
                    h="34px"
                    mx="auto"
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={isToday || isSelected ? 'bold' : 'normal'}
                    color={isSelected ? selectedColor : !dayObj.current ? outsideDayColor : dayColor}
                    bg={isSelected ? selectedBg : isToday ? todayBg : 'transparent'}
                    _hover={!isSelected ? { bg: dayHoverBg } : {}}
                    transition="all 0.15s"
                    onClick={() => handleDayClick(dayObj)}
                    cursor="pointer"
                  >
                    {dayObj.day}
                  </Flex>
                </GridItem>
              );
            })}
          </Grid>

          {/* Time picker */}
          {showTimeSelect && (
            <Flex mt={3} pt={3} borderTop="1px solid" borderColor={popoverBorder} align="center" gap={2}>
              <Text fontSize="xs" fontWeight="bold" color={dayNameColor}>Time:</Text>
              <Input
                type="time"
                size="sm"
                value={timeValue}
                onChange={handleTimeChange}
                borderRadius="md"
                w="auto"
                flex={1}
              />
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}
