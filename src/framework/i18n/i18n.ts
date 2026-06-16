import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: "en",
  lng: "en",
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: { translation: en },
    es: { translation: es }
  }
});

export { i18n };
