import { useTranslation } from 'react-i18next'

/** 本文が日本語のみのページで、日本語以外の表示言語のときだけ出す注記 */
export default function JaOnlyNotice({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  if (i18n.language.startsWith('ja')) return null
  return <p className={`rounded-lg border border-d-border bg-d-med px-3 py-2 text-xs text-d-text2 ${className}`}>{t('lp.notice')}</p>
}
