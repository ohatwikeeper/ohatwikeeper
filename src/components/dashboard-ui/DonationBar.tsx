import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** 全ページ最上部に表示する支援のお願いバー。高さを --navbar-real-h に反映し、各ページの高さ計算から差し引く */
export default function DonationBar() {
  const ref = useRef<HTMLDivElement>(null)
  // ログイン系の画面では表示しない
  const { t: tr } = useTranslation()
  const path = useLocation().pathname
  const hidden = ['/login', '/confirm_login'].includes(path) || path.startsWith('/admin')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--navbar-real-h', `${el.getBoundingClientRect().height}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--navbar-real-h') }
  }, [hidden])
  if (hidden) return null
  return (
    <div ref={ref} className="dash-vars relative z-[60] flex border-b border-d-border flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-d-med px-4 py-2 text-center text-xs text-d-text2">
      <span>{tr('cn.donate1')}</span>
      <a href="https://discord.ohatwikeeper.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap font-semibold !text-d-accent underline underline-offset-2">
        <i className="bx bxl-discord-alt" />{tr('cn.donate2')}
      </a>
    </div>
  )
}
