import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import km from './locales/km.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Sync <html lang="..."> so CSS :lang(km) selectors work
document.documentElement.lang = i18n.language?.split('-')[0] || 'en';
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng.split('-')[0];
});

export default i18n;
