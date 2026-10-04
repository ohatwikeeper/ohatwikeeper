import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { LANGS, resources } from './translations'

const codes = LANGS.map((l) => l.code) as string[]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    supportedLngs: codes,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'lang' },
  })

// <html lang> を選択言語に追従させる
const sync = (lng: string) => { document.documentElement.lang = lng.split('-')[0] }
sync(i18n.language || 'ja')
i18n.on('languageChanged', sync)

export default i18n
