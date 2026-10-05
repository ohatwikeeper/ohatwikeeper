import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import type { DashboardData } from '@/lib/dashboard/types'

const KEY = 'onboarding-dismissed'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

/** 初回登録後のセットアップ進捗(全完了または閉じたら非表示) */
export default function OnboardingChecklist({ data, csrf }: { data: NonNullable<DashboardData['onboarding']>; csrf: string }) {
  const { t: tr } = useTranslation()
  const [hidden, setHidden] = useState(read)
  // 達成状況は他タブ/拡張機能/CLI でも変わるため、表示中は定期とフォーカス復帰で再取得して即反映する
  // 一度でも全完了したら以後は再表示しない(後で設定を戻しても出さない)
  const allDone = data.x && data.extension && data.record && data.notify
  useEffect(() => {
    if (allDone) { try { localStorage.setItem(KEY, '1') } catch { /* 無視 */ } setHidden(true) }
  }, [allDone])
  useEffect(() => {
    if (hidden) return
    const refresh = () => { if (document.visibilityState === 'visible') window.dispatchEvent(new Event('dashboard:reload')) }
    const id = setInterval(refresh, 10000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh) }
  }, [hidden])
  const steps = [
    { done: data.x, title: tr('ob.xT'), desc: tr('ob.xD'), to: `/login?action=login&provider=x&csrf=${encodeURIComponent(csrf)}`, ext: true, cta: tr('ob.xC') },
    { done: data.extension, title: tr('ob.eT'), desc: tr('ob.eD'), to: '/extension', cta: tr('ob.eC') },
    { done: data.record, title: tr('ob.rT'), desc: tr('ob.rD'), to: '/tools', cta: tr('ob.rC') },
    { done: data.notify, title: tr('ob.nT'), desc: tr('ob.nD'), to: '/settings', cta: tr('ob.nC') },
  ]
  const n = steps.filter(s => s.done).length
  if (hidden || n === steps.length) return null
  const close = () => { try { localStorage.setItem(KEY, '1') } catch { /* 無視 */ } setHidden(true) }
  return (
    <div className="rounded-xl border border-d-border bg-d-med p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-d-text">{tr('ob.title')}</h3>
          <p className="text-xs text-d-text3">{tr('ob.prog', { n, m: steps.length })}</p>
        </div>
        <button type="button" aria-label={tr('aw.close')} onClick={close} className="cursor-pointer text-d-text3 hover:text-d-text"><X className="size-4" /></button>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-d-light"><div className="h-full rounded-full bg-d-text transition-[width]" style={{ width: `${(n / steps.length) * 100}%` }} /></div>
      <ul className="space-y-2">
        {steps.map(s => (
          <li key={s.title} className="flex items-center gap-3">
            <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${s.done ? 'border-d-text bg-d-text text-d-bg' : 'border-d-border'}`}>{s.done && <Check className="size-3" />}</span>
            <div className="min-w-0 flex-1">
              <div className={`text-sm ${s.done ? 'text-d-text3 line-through' : 'text-d-text'}`}>{s.title}</div>
              {!s.done && <div className="text-xs text-d-text3">{s.desc}</div>}
            </div>
            {!s.done && (s.ext
              ? <a href={s.to} className="text-xs text-d-text2 underline hover:text-d-text">{s.cta}</a>
              : <Link to={s.to} className="text-xs text-d-text2 underline hover:text-d-text">{s.cta}</Link>)}
          </li>
        ))}
      </ul>
    </div>
  )
}
