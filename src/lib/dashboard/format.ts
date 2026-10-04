import i18n from '@/i18n'
import DOMPurify from 'dompurify'

export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString()

/** サーバー生成のHTML(bioや通知本文)を安全化して埋め込む用 */
// target=_blank を許可しているため、window.opener 経由の乗っ取り(tabnabbing)を防ぐ rel を必ず付ける
DOMPurify.addHook('afterSanitizeAttributes', (n) => {
  if (n instanceof Element && n.getAttribute('target') === '_blank') n.setAttribute('rel', 'noopener noreferrer')
})

export const sanitize = (html: string) =>
  DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] })

/** "2026-09-30 08:00:00" → "2026-09-30 08:00" */
export const shortDate = (d: string) => d.substring(0, 16)

export const joinedLabel = (d: string, lang = 'ja') => {
  const t = new Date(d.replace(' ', 'T'))
  if (lang === 'ja') return `${t.getFullYear()}年${t.getMonth() + 1}月`
  return t.toLocaleDateString(lang, { year: 'numeric', month: 'long' })
}

export const lastUpdateLabel = (d: string | null) => {
  if (!d) return i18n.t('rc.notUpdated')
  const t = new Date(d.replace(' ', 'T'))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}/${p(t.getMonth() + 1)}/${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}
