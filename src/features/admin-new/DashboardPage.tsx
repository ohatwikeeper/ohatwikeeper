import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bug, FlaskConical, Link2, Mail, MessageSquare, Notebook, Plug, RefreshCw, TriangleAlert, UserPlus, Users, LogIn, Activity, type LucideIcon } from 'lucide-react'
import Shell from './Shell'
import { adminFetch, fmtDate, relTime } from '../admin/kit'
import { Cell } from '../admin/data/cells'
import { Sparkline } from '@/components/arc/sparkline/sparkline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

type O = Record<string, number | null>
type Trend = { days: string[]; signups: number[]; access: number[]; api: number[]; errors: number[] }
type ListRes = { rows: Record<string, unknown>[]; total: number }

const SPARKS: [keyof Omit<Trend, 'days'>, string, 'accent' | 'success' | 'warning' | 'danger', string][] = [
  ['access', 'アクセス', 'accent', '/admin-new/analytics?metric=access'], ['api', 'API呼び出し', 'success', '/admin-new/analytics?metric=api'],
  ['signups', '新規登録', 'accent', '/admin-new/analytics?metric=signups'], ['errors', '画面エラー', 'danger', '/admin-new/analytics?metric=errors'],
]
const STATS: [string, string, string, LucideIcon, boolean?][] = [
  ['users', 'ユーザー数', '/admin-new/data/users', Users], ['users_today', '今日の新規登録', '/admin-new/data/users', UserPlus], ['login_24h', '24時間のログイン', '/admin-new/data/users', LogIn],
  ['records', '総おはツイ数', '', Notebook], ['api_errors_24h', '24時間のAPIエラー', '/admin-new/data/api-errors', TriangleAlert, true], ['errors_24h', '24時間の画面エラー', '/admin-new/data/page-errors', Bug, true],
  ['mails_24h', '24時間のメール', '/admin-new/data/mails', Mail], ['feedbacks_open', '未対応フィードバック', '/admin-new/data/feedbacks', MessageSquare, true],
  ['short_links', '短縮URL数', '/admin-new/data/short-links', Link2], ['beta_members', 'ベータ招待', '/admin/beta', FlaskConical],
]

const pct = (a: number[]) => {
  const t = a[a.length - 1] ?? 0, y = a[a.length - 2] ?? 0
  if (!y) return t ? '+新規' : '±0%'
  const d = Math.round(((t - y) / y) * 100)
  return `${d >= 0 ? '+' : ''}${d}%`
}

function RecentList({ title, to, rows, render }: { title: string; to: string; rows: Record<string, unknown>[] | null; render: (r: Record<string, unknown>) => React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-d-text">{title}</h2><Link to={to} className="text-xs !text-d-text2 hover:!text-d-text">すべて見る</Link></div>
      {rows === null ? <div className="flex flex-col gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
        : rows.length === 0 ? <p className="py-6 text-center text-sm text-d-text3">データがありません</p>
        : <ul className="divide-y divide-d-border">{rows.map((r, i) => <li key={i} className="py-2">{render(r)}</li>)}</ul>}
    </Card>
  )
}

export default function DashboardPage() {
  const [ov, setOv] = useState<O | null>(null)
  const [tr, setTr] = useState<Trend | null>(null)
  const [errs, setErrs] = useState<Record<string, unknown>[] | null>(null)
  const [users, setUsers] = useState<Record<string, unknown>[] | null>(null)
  const [auto, setAuto] = useState(true)
  const [at, setAt] = useState<Date | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const [o, t, e, u] = await Promise.all([
      adminFetch<O>('data/_overview').catch(() => null), adminFetch<Trend>('data/_trend').catch(() => null),
      adminFetch<ListRes>('data/api-errors?page=1').catch(() => null), adminFetch<ListRes>('data/users?page=1').catch(() => null),
    ])
    if (o) setOv(o)
    if (t) setTr(t)
    setErrs(e ? e.rows.slice(0, 7) : [])
    setUsers(u ? u.rows.slice(0, 7) : [])
    setAt(new Date()); setBusy(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!auto) return
    const h = setInterval(load, 30_000)
    return () => clearInterval(h)
  }, [auto, load])

  const alerts = STATS.filter(([k, , , , bad]) => bad && (ov?.[k] ?? 0) > 0)

  return (
    <Shell title="ダッシュボード" actions={
      <>
        <label className="hidden items-center gap-2 text-xs text-d-text2 sm:flex"><Switch checked={auto} onCheckedChange={setAuto} />30秒ごとに自動更新</label>
        <Button variant="outline" size="icon-sm" aria-label="更新" onClick={load} disabled={busy}><RefreshCw className={busy ? 'animate-spin' : ''} /></Button>
      </>
    }>
      <div className="flex flex-col gap-6">
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alerts.map(([k, label, to, Icon]) => (
              <Link key={k} to={to} className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm !text-d-text">
                <Icon className="size-4 text-red-400" />{label}<b className="tabular-nums text-red-400">{(ov?.[k] ?? 0).toLocaleString()}</b>
              </Link>
            ))}
          </div>
        )}

        <section aria-label="14日間の推移" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SPARKS.map(([k, label, tone, to]) => (
            <Card key={k} className="p-4">
              {tr ? (
                <Link to={to} className="block !text-d-text">
                  <Sparkline data={tr[k]} labels={tr.days.map((d) => d.slice(5))} label={label} value={(tr[k][tr[k].length - 1] ?? 0).toLocaleString()} change={pct(tr[k])} tone={tone} width={260} height={64} />
                  <p className="mt-1 text-xs text-d-text3">今日 / 14日合計 {tr[k].reduce((a, b) => a + b, 0).toLocaleString()}</p>
                </Link>
              ) : <Skeleton className="h-28" />}
            </Card>
          ))}
        </section>

        <section aria-label="主要指標" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {STATS.map(([k, label, to, Icon, bad]) => {
            const v = ov?.[k]
            const body = (
              <Card className="h-full p-3.5 transition-colors hover:bg-d-med/50">
                <div className="flex items-center gap-1.5 text-xs text-d-text2"><Icon className="size-3.5" />{label}</div>
                <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${bad && (v ?? 0) > 0 ? 'text-red-400' : 'text-d-text'}`}>
                  {ov === null ? <Skeleton className="h-8 w-16" /> : v === null || v === undefined ? '-' : v.toLocaleString()}
                </div>
              </Card>
            )
            return to ? <Link key={k} to={to}>{body}</Link> : <div key={k}>{body}</div>
          })}
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <RecentList title="最近のAPIエラー" to="/admin-new/data/api-errors" rows={errs} render={(r) => (
            <Link to={`/admin-new/data/api-errors?q=${encodeURIComponent(String(r.request_id ?? ''))}`} className="flex items-center gap-2 !text-d-text">
              <Cell col="status" value={r.status} /><span className="min-w-0 flex-1 truncate text-sm">{String(r.message ?? r.request_uri ?? '-')}</span>
              <span className="shrink-0 text-xs text-d-text3" title={fmtDate(String(r.created_at))}>{relTime(String(r.created_at))}</span>
            </Link>
          )} />
          <RecentList title="最近の登録ユーザー" to="/admin-new/data/users" rows={users} render={(r) => (
            <div className="flex items-center gap-2.5">
              <Cell col="x_icon" value={r.x_icon} /><span className="min-w-0 flex-1 truncate text-sm text-d-text">{String(r.x_username ?? r.id)}</span>
              <span className="shrink-0 text-xs text-d-text3" title={fmtDate(String(r.created_at))}>{relTime(String(r.created_at))}</span>
            </div>
          )} />
        </section>
        <p className="flex items-center gap-1.5 text-xs text-d-text3"><Activity className="size-3" />最終更新 {at ? at.toLocaleTimeString('ja-JP') : '-'}<Plug className="ml-2 size-3" />データは旧管理画面と共通です</p>
      </div>
    </Shell>
  )
}
