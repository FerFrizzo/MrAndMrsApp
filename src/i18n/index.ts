import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';
import ptBR from './locales/pt-BR';
import ptPT from './locales/pt-PT';
import it from './locales/it';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import pl from './locales/pl';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { code: 'pt-BR', flag: '🇧🇷', nativeName: 'Português (Brasil)' },
  { code: 'pt-PT', flag: '🇵🇹', nativeName: 'Português (Portugal)' },
  { code: 'it', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'pl', flag: '🇵🇱', nativeName: 'Polski' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const deviceLocale = getLocales()[0]?.languageTag ?? 'en';
const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);
const lng = supportedCodes.find(code => deviceLocale === code)
  ?? supportedCodes.find(code => deviceLocale.startsWith(code.split('-')[0]))
  ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
    'pt-PT': { translation: ptPT },
    it: { translation: it },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    pl: { translation: pl },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export function changeLanguage(code: string) {
  i18n.changeLanguage(code);
}

export default i18n;
