import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bug, FlaskConical, Link2, LogIn, Mail, MessageSquare, Notebook, RefreshCw, TriangleAlert, UserPlus, Users, type LucideIcon } from 'lucide-react'
import Shell from './Shell'
import { Delta, Dot, Empty, PageHead, Panel, TONE_TEXT, rise, type Tone } from './ui'
import { adminFetch, fmtDate, relTime } from '../admin/kit'
import { Cell } from '../admin/data/cells'
import { Sparkline } from '@/components/arc/sparkline/sparkline'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

type O = Record<string, number | null>
type Trend = { days: string[]; signups: number[]; access: number[]; api: number[]; errors: number[] }
type ListRes = { rows: Record<string, unknown>[]; total: number }
type Row = Record<string, unknown>

// 14 日推移。bad は「増えると悪い」指標
const SPARKS: { k: keyof Omit<Trend, 'days'>; label: string; tone: 'accent' | 'success' | 'warning' | 'danger'; bad?: boolean }[] = [
  { k: 'access', label: 'アクセス', tone: 'accent' }, { k: 'api', label: 'API呼び出し', tone: 'success' },
  { k: 'signups', label: '新規登録', tone: 'accent' }, { k: 'errors', label: '画面エラー', tone: 'danger', bad: true },
]

// 主要指標(グループ別)。bad は 0 より大きいと要対応
type Stat = { k: string; label: string; to: string; icon: LucideIcon; bad?: boolean }
const GROUPS: { name: string; stats: Stat[] }[] = [
  { name: 'ユーザー', stats: [
    { k: 'users', label: 'ユーザー数', to: '/admin-new/data/users', icon: Users },
    { k: 'users_today', label: '今日の新規登録', to: '/admin-new/data/users', icon: UserPlus },
    { k: 'login_24h', label: '24時間のログイン', to: '/admin-new/data/users', icon: LogIn },
    { k: 'beta_members', label: 'ベータ招待', to: '/admin/beta', icon: FlaskConical },
  ] },
  { name: '健全性', stats: [
    { k: 'api_errors_24h', label: '24時間のAPIエラー', to: '/admin-new/data/api-errors', icon: TriangleAlert, bad: true },
    { k: 'errors_24h', label: '24時間の画面エラー', to: '/admin-new/data/page-errors', icon: Bug, bad: true },
    { k: 'feedbacks_open', label: '未対応フィードバック', to: '/admin-new/data/feedbacks', icon: MessageSquare, bad: true },
    { k: 'mails_24h', label: '24時間のメール', to: '/admin-new/data/mails', icon: Mail },
  ] },
  { name: 'コンテンツ', stats: [
    { k: 'records', label: '総おはツイ数', to: '', icon: Notebook },
    { k: 'short_links', label: '短縮URL数', to: '/admin-new/data/short-links', icon: Link2 },
  ] },
]
const ALL_STATS = GROUPS.flatMap((g) => g.stats)

const last = (a: number[], n = 0) => a[a.length - 1 - n] ?? 0

function RecentList({ title, to, rows, render, i }: { title: string; to: string; rows: Row[] | null; render: (r: Row) => React.ReactNode; i: number }) {
  return (
    <Panel i={i} title={title} flush action={<Link to={to} className="inline-flex min-h-8 items-center gap-0.5 text-xs !text-d-text3 hover:!text-d-text">すべて見る<ArrowUpRight className="size-3" /></Link>}>
      {rows === null ? <div className="flex flex-col gap-2 px-3 pt-3 pb-2">{Array.from({ length: 5 }, (_, n) => <Skeleton key={n} className="h-9" />)}</div>
        : rows.length === 0 ? <Empty>データがありません</Empty>
        : <ul className="px-1.5 pt-1">{rows.map((r, n) => <li key={n}>{render(r)}</li>)}</ul>}
    </Panel>
  )
}

const rowCls = 'flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-d-light/60'
const when = (r: Row) => <span className="shrink-0 text-xs tabular-nums text-d-text3" title={fmtDate(String(r.created_at))}>{relTime(String(r.created_at))}</span>

export default function DashboardPage() {
  const [ov, setOv] = useState<O | null>(null)
  const [tr, setTr] = useState<Trend | null>(null)
  const [errs, setErrs] = useState<Row[] | null>(null)
  const [users, setUsers] = useState<Row[] | null>(null)
  const [perrs, setPerrs] = useState<Row[] | null>(null)
  const [auto, setAuto] = useState(true)
  const [at, setAt] = useState<Date | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const [o, t, e, u, p] = await Promise.all([
      adminFetch<O>('data/_overview').catch(() => null), adminFetch<Trend>('data/_trend').catch(() => null),
      adminFetch<ListRes>('data/api-errors?page=1').catch(() => null), adminFetch<ListRes>('data/users?page=1').catch(() => null),
      adminFetch<ListRes>('data/page-errors?page=1').catch(() => null),
    ])
    if (o) setOv(o)
    if (t) setTr(t)
    setErrs(e ? e.rows.slice(0, 6) : [])
    setUsers(u ? u.rows.slice(0, 6) : [])
    setPerrs(p ? p.rows.slice(0, 6) : [])
    setAt(new Date()); setBusy(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!auto) return
    const h = setInterval(load, 30_000)
    return () => clearInterval(h)
  }, [auto, load])

  const alerts = ALL_STATS.filter((s) => s.bad && (ov?.[s.k] ?? 0) > 0)
  const status: { tone: Tone; text: string } = ov === null ? { tone: 'neutral', text: '集計を読み込み中' }
    : alerts.length ? { tone: 'danger', text: `要確認が ${alerts.length} 件あります` } : { tone: 'success', text: '異常はありません' }

  return (
    <Shell title="ダッシュボード" actions={
      <>
        <label className="hidden min-h-9 items-center gap-2 text-xs text-d-text2 sm:flex"><Switch checked={auto} onCheckedChange={setAuto} />30秒ごとに自動更新</label>
        <Button variant="ghost" size="icon" aria-label="更新" onClick={load} disabled={busy}><RefreshCw className={busy ? 'animate-spin' : ''} /></Button>
      </>
    }>
      <PageHead title="ダッシュボード" desc={
        <span className="inline-flex items-center gap-2"><Dot tone={status.tone} pulse={status.tone === 'danger'} />{status.text}
          <span className="text-d-text3">・ 最終更新 <span className="tabular-nums">{at ? at.toLocaleTimeString('ja-JP') : '-'}</span></span></span>
      } />

      <div className="flex flex-col gap-4">
        {alerts.length > 0 && (
          <div style={rise(0)} className="an-rise flex flex-wrap gap-2" role="status">
            {alerts.map((s) => (
              <Link key={s.k} to={s.to} className="an-press inline-flex min-h-10 items-center gap-2 rounded-xl bg-d-danger/10 px-3.5 text-sm !text-d-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--d-danger)_35%,transparent)] hover:bg-d-danger/15">
                <s.icon className="size-4 text-d-danger" />{s.label}<b className="font-medium tabular-nums text-d-danger">{(ov?.[s.k] ?? 0).toLocaleString()}</b>
              </Link>
            ))}
          </div>
        )}

        <section aria-label="14日間の推移" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SPARKS.map((s, n) => (
            <Panel key={s.k} i={n + 1} className="transition-transform hover:-translate-y-0.5">
              {tr ? (
                <Link to={`/admin-new/analytics?metric=${s.k}`} className="block !text-d-text">
                  <Sparkline data={tr[s.k]} labels={tr.days.map((d) => d.slice(5))} label={s.label} value={last(tr[s.k]).toLocaleString()} change={undefined} tone={s.tone} width={260} height={64} />
                  <p className="mt-2 flex items-center justify-between text-xs text-d-text3">
                    <span>14日合計 <span className="tabular-nums text-d-text2">{tr[s.k].reduce((a, b) => a + b, 0).toLocaleString()}</span></span>
                    <Delta now={last(tr[s.k])} prev={last(tr[s.k], 1)} good={s.bad ? 'down' : 'up'} />
                  </p>
                </Link>
              ) : <Skeleton className="h-28" />}
            </Panel>
          ))}
        </section>

        <section aria-label="主要指標" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {GROUPS.map((g, gi) => (
            <Panel key={g.name} i={gi + 5} title={g.name} flush>
              <dl className="px-1.5 pt-1">
                {g.stats.map((s) => {
                  const v = ov?.[s.k]
                  const hot = s.bad && (v ?? 0) > 0
                  const body = (
                    <>
                      <dt className="flex min-w-0 items-center gap-2 text-[13px] text-d-text2"><s.icon className="size-4 shrink-0 text-d-text3" strokeWidth={1.75} /><span className="truncate">{s.label}</span></dt>
                      <dd className={`text-lg font-medium tabular-nums ${hot ? TONE_TEXT.danger : 'text-d-text'}`}>
                        {ov === null ? <Skeleton className="h-6 w-14" /> : v === null || v === undefined ? '-' : v.toLocaleString()}
                      </dd>
                    </>
                  )
                  return s.to
                    ? <Link key={s.k} to={s.to} className={`${rowCls} justify-between !text-d-text`}>{body}</Link>
                    : <div key={s.k} className={`${rowCls} justify-between hover:bg-transparent`}>{body}</div>
                })}
              </dl>
            </Panel>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentList i={8} title="最近のAPIエラー" to="/admin-new/data/api-errors" rows={errs} render={(r) => (
            <Link to={`/admin-new/data/api-errors?q=${encodeURIComponent(String(r.request_id ?? ''))}`} className={`${rowCls} !text-d-text`}>
              <Cell col="status" value={r.status} /><span className="min-w-0 flex-1 truncate text-sm">{String(r.message ?? r.request_uri ?? '-')}</span>{when(r)}
            </Link>
          )} />
          <RecentList i={9} title="最近の画面エラー" to="/admin-new/data/page-errors" rows={perrs} render={(r) => (
            <Link to={`/admin-new/data/page-errors?q=${encodeURIComponent(String(r.message ?? r.id ?? ''))}`} className={`${rowCls} !text-d-text`}>
              <Bug className="size-4 shrink-0 text-d-danger" strokeWidth={1.75} /><span className="min-w-0 flex-1 truncate text-sm">{String(r.message ?? r.url ?? r.path ?? '-')}</span>{when(r)}
            </Link>
          )} />
          <RecentList i={10} title="最近の登録ユーザー" to="/admin-new/data/users" rows={users} render={(r) => (
            <Link to={`/admin-new/data/users?q=${encodeURIComponent(String(r.x_username ?? r.id))}`} className={`${rowCls} !text-d-text`}>
              <Cell col="x_icon" value={r.x_icon} /><span className="min-w-0 flex-1 truncate text-sm">{String(r.x_username ?? r.id)}</span>{when(r)}
            </Link>
          )} />
        </section>
      </div>
    </Shell>
  )
}
