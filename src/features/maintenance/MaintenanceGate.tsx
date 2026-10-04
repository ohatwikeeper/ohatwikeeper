import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CONFIG } from '@/lib/config'
import { useMaintenance, matchMaintenance, type MaintenanceInfo } from './useMaintenance'

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function Remaining({ iso }: { iso: string }) {
  const { t: tr } = useTranslation()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t) }, [])
  const min = Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 60_000))
  if (min <= 0) return <span>{tr('mt.remainSoon')}</span>
  const h = Math.floor(min / 60)
  return <span>{h > 0 ? tr('mt.remainH', { h, m: min % 60 }) : tr('mt.remainM', { m: min % 60 })}</span>
}

function MaintenanceScreen({ info }: { info: MaintenanceInfo }) {
  const { t: tr } = useTranslation()
  const isGlobal = info.scope === 'global'
  useEffect(() => { document.title = tr('mt.doc') }, [])
  return (
    <div className="dash-scope min-h-[calc(100vh-4rem)] bg-d-bg text-d-text">
      <div className="mx-auto flex max-w-xl flex-col items-start px-5 py-24">
        <Badge variant="outline" className="mb-5 gap-1.5 text-d-text2">
          <span className="size-1.5 rounded-full bg-d-accent" /> Maintenance
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {isGlobal ? tr('mt.global') : tr('mt.page')}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-d-text2">
          {info.message || tr('mt.msg')}
        </p>
        {info.ends_at && (
          <>
            <Separator className="my-6" />
            <dl className="text-sm">
              <dt className="text-xs uppercase tracking-wider text-d-text3">{tr('mt.ends')}</dt>
              <dd className="mt-1 font-semibold">{tr('mt.around', { t: fmt(info.ends_at) })} <span className="ml-2 font-normal text-d-text2">（<Remaining iso={info.ends_at} />）</span></dd>
            </dl>
          </>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => location.reload()}>{tr('mt.reload')}</Button>
          <Button variant="outline" onClick={() => window.open('https://discord.ohatwikeeper.com', '_blank', 'noopener')}>{tr('mt.discord')}</Button>
        </div>
        {!isGlobal && <a href={CONFIG.APP_BASE} className="mt-6 text-sm !text-d-text2 hover:!text-d-text">{tr('mt.back')}</a>}
      </div>
    </div>
  )
}

/** メンテ中のページは管理者以外には代わりにメンテナンス画面を出す。/admin 配下は常に通す。 */
export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const state = useMaintenance()
  // 初回判定が終わるまで中身を出さない(メンテ中ページが一瞬見えるのを防ぐ)
  if (state === undefined && !pathname.startsWith('/admin')) return <div className="dash-scope min-h-screen bg-d-bg" />
  const info = pathname.startsWith('/admin') ? null : matchMaintenance(state ?? null, pathname)
  if (!info) return <>{children}</>
  if (state?.is_admin) {
    return (
      <>
        <div className="dash-scope sticky top-0 z-40 border-b border-d-accent/40 bg-d-bg/95 px-4 py-2 text-center text-xs text-d-text backdrop-blur">
          <span className="mr-2 font-bold text-d-accent">メンテナンス中</span>
          管理者のため通常どおり表示しています（{info.scope === 'global' ? 'サイト全体' : info.scope}）
        </div>
        {children}
      </>
    )
  }
  return <MaintenanceScreen info={info} />
}
