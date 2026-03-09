import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Button, 
  Image, 
  Text, 
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';

  const languages = [
    { 
      code: 'en', 
      label: 'English', 
      flag: 'https://flagcdn.com/w20/us.png' 
    },
    { 
      code: 'km', 
      label: 'ភាសាខ្មែរ', 
      flag: 'https://flagcdn.com/w20/kh.png' 
    }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const selectedLang = languages.find(lang => lang.code === currentLanguage.split('-')[0]) || languages[0];

  return (
    <Menu>
      <MenuButton 
        as={Button} 
        rightIcon={<ChevronDownIcon />} 
        variant="ghost" 
        size="sm"
        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
      >
        <Flex align="center" gap={2}>
          <Image src={selectedLang.flag} alt={selectedLang.label} w="20px" h="14px" />
          <Text fontSize="sm" display={{ base: "none", md: "block" }}>{selectedLang.label}</Text>
        </Flex>
      </MenuButton>
      <MenuList>
        {languages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => changeLanguage(lang.code)}
            bg={currentLanguage.startsWith(lang.code) ? useColorModeValue('gray.100', 'gray.700') : 'transparent'}
          >
            <Flex align="center" gap={2}>
              <Image src={lang.flag} alt={lang.label} w="20px" h="14px" />
              <Text fontSize="sm">{lang.label}</Text>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default LanguageSwitcher;
