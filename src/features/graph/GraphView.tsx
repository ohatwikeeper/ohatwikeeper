import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { CalendarX } from 'lucide-react'
import { DateRangePicker } from '@/components/arc/date-range-picker/date-range-picker'
import { PageLoader } from '@/components/ui/page-loader'
import { Button } from '@/components/ui/button'
import { LineChart } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { friendlyError } from '@/lib/dashboard/api'
import { motion, AnimatePresence } from 'motion/react'
import ShareButton from '@/features/share/ShareButton'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceArea,
} from 'recharts'
import { NumberTicker } from '@/components/motion/number-ticker'
import { ScrollReveal } from '@/components/motion/scroll-reveal'
import DataTable from '@/components/dashboard-ui/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import Tip from '@/components/dashboard-ui/Tip'

interface Stats {
  total_records: number; coverage_rate: number; non_posted_days: number
  total_likes: number; avg_likes: string; total_reposts: number; avg_reposts: string
  total_views: number; avg_views: string; total_replies: number; avg_replies: string
  current_consecutive_streak: number; max_streak: number
  first_post_date: string | null; predicted_post_time: string | null
}
interface ChartData {
  labels: string[]; likes: number[]; views: number[]; reposts: number[]; replies: number[]
  engagements: number[]; engagement_rates: number[]
  likes_diff: number[]; views_diff: number[]; reposts_diff: number[]; replies_diff: number[]
  day_of_week_avg: { likes: number[]; views: number[]; reposts: number[]; replies: number[] }
  time_slot_avg: { likes: number[]; views: number[]; count: number[] }
}
interface GraphResponse { public_uuid: string; is_public: boolean; stats?: Stats; chart_data?: ChartData }

const METRICS = [
  { key: 'likes', label: 'rc.likes', color: '#ec4899', icon: 'bxs-heart' },
  { key: 'views', label: 'rc.views', color: '#fb923c', icon: 'bxs-show' },
  { key: 'reposts', label: 'rc.reposts', color: '#22c55e', icon: 'bx-repost' },
  { key: 'replies', label: 'rc.replies', color: '#60a5fa', icon: 'bxs-message-rounded-dots' },
] as const
type MetricKey = (typeof METRICS)[number]['key']
type GRow = { label: string; likes: number; reposts: number; replies: number; views: number; rate: number }
const R = { align: 'right' }
const makeCols = (t: (k: string) => string): ColumnDef<GRow, any>[] => [
  { accessorKey: 'label', header: t('gv.date'), cell: c => new Date(c.getValue()).toLocaleString(i18n.language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
  { accessorKey: 'likes', header: t('rc.likes'), meta: R, cell: c => fnum(c.getValue()) },
  { accessorKey: 'reposts', header: 'RP', meta: R, cell: c => fnum(c.getValue()) },
  { accessorKey: 'replies', header: t('rc.replies'), meta: R, cell: c => fnum(c.getValue()) },
  { accessorKey: 'views', header: t('rc.views'), meta: R, cell: c => fnum(c.getValue()) },
  { accessorKey: 'rate', header: t('awd.mEng'), meta: R, cell: c => `${Number(c.getValue()).toFixed(2)}%` },
]
const fnum = (n?: number | null) => (n == null ? '0' : Math.round(n).toLocaleString(i18n.language))

const TABS = [
  { key: 'trend', label: 'gv.tTrend', icon: 'bx-line-chart' },
  { key: 'dow', label: 'gv.tDow', icon: 'bx-calendar' },
  { key: 'time', label: 'gv.tTime', icon: 'bx-time-five' },
  { key: 'engagement', label: 'gv.tEng', icon: 'bx-trending-up' },
  { key: 'table', label: 'gv.tData', icon: 'bx-table' },
] as const
type TabKey = (typeof TABS)[number]['key']

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-d-border bg-d-light px-3 py-2 text-xs text-d-text shadow-lg">
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="size-1.5 rounded-full" style={{ background: p.color }} />{p.name}: {fnum(p.value)}
        </div>
      ))}
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function KpiCard({ icon, label, value, color, delay, series }: { icon: string; label: string; value: number; color: string; delay: number; series?: number[] }) {
  // 直近7投稿のみ表示。後半平均 vs 前半平均で増減率を出す
  series = series?.slice(-7)
  let delta: number | null = null
  if (series && series.length >= 4) {
    const h = Math.floor(series.length / 2)
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
    const prev = avg(series.slice(0, h)), cur = avg(series.slice(h))
    if (prev > 0) delta = ((cur - prev) / prev) * 100
  }
  const gid = `kpi-${icon}`
  return (
    <ScrollReveal y={16} delay={delay} duration={0.5} className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-d-border bg-d-med p-4">
        <div className="flex items-center justify-between">
          <span className="whitespace-nowrap text-xs text-d-text3"><i className={`bx ${icon} mr-1 text-base align-middle`} style={{ color }} />{label}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-1"><div className="text-2xl font-bold tabular-nums text-d-text sm:text-[1.6rem]"><NumberTicker value={value} locale /></div>
          {delta !== null && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${delta >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mt-auto h-8 -mx-1 pt-2">
        {series && series.length > 1 && (
          <div className="size-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.map(v => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>
      </div>
    </ScrollReveal>
  )
}

function HeatCalendar({ chartData, metric }: { chartData: ChartData; metric: 'count' | 'likes' | 'views' }) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)
  const values = chartData.time_slot_avg[metric]
  const max = Math.max(1, ...values)
  const blocks = [
    { title: t('gv.am'), slots: Array.from({ length: 24 }, (_, i) => i) },
    { title: t('gv.pm'), slots: Array.from({ length: 24 }, (_, i) => i + 24) },
  ]
  const slotLabel = (i: number) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((block) => (
          <div key={block.title}>
            <div className="mb-2 text-center text-xs font-medium text-d-text3">{block.title}</div>
            <div className="grid grid-cols-6 gap-1.5">
              {block.slots.map((i) => {
                const v = values[i] ?? 0
                const t = v / max
                return (
                  <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    className="relative aspect-square rounded-md transition-transform duration-150 hover:z-10 hover:scale-110"
                    style={{ background: t === 0 ? 'var(--d-light)' : `color-mix(in srgb, var(--d-accent) ${Math.round(15 + t * 85)}%, var(--d-light))` }}>
                    {hovered === i && (
                      <div className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-d-border bg-d-light px-2 py-1 text-[11px] text-d-text shadow-lg">
                        {slotLabel(i)} ・ {fnum(v)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-d-text3">
        <span>{t('gv.few')}</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((v) => <span key={v} className="size-3 rounded-sm" style={{ background: `color-mix(in srgb, var(--d-accent) ${Math.round(v * 100)}%, var(--d-light))` }} />)}
        <span>{t('gv.many')}</span>
      </div>
    </div>
  )
}

export default function GraphView({ uuid }: { uuid: string }) {
  const { t } = useTranslation()
  const cols = useMemo(() => makeCols(t), [t])
  const [data, setData] = useState<GraphResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<Set<MetricKey>>(new Set(['likes', 'views']))
  const [heat, setHeat] = useState<'count' | 'likes' | 'views'>('count')
  const [tab, setTab] = useState<TabKey>('trend')
  const posterRef = useRef<HTMLDivElement>(null)
  // 期間絞り込み(全データ上のindex範囲)。チャートをドラッグして選択する
  const [range, setRange] = useState<[number, number] | null>(null)
  // ピッカーで選んだ日付そのもの(該当データなしでも選択表示を保つ)
  const [pick, setPick] = useState<{ start: Date; end: Date } | null>(null)
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null)

  useEffect(() => {
    setData(null); setError(null); setRange(null); setPick(null); setDrag(null)
    fetch(`/app-api/view/graph-data/?uuid=${encodeURIComponent(uuid)}`)
      .then((r) => { if (!r.ok) throw new Error(t('awd.fetchFail')); return r.json() })
      .then(setData)
      .catch((e) => setError(friendlyError(e, t('gv.loadErr'))))
  }, [uuid])

  const trend = useMemo(() => {
    if (!data?.chart_data) return []
    const { labels, likes, views, reposts, replies } = data.chart_data
    return labels.map((l, i) => ({ i, date: new Date(l).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }), likes: likes[i], views: views[i], reposts: reposts[i], replies: replies[i] }))
      .filter((d) => !range || (d.i >= range[0] && d.i <= range[1]))
  }, [data, range])
  const dow = useMemo(() => {
    if (!data?.chart_data) return []
    const a = data.chart_data.day_of_week_avg
    return t('rc.wdays').split(',').map((day, i) => ({ day, likes: a.likes[i] ?? 0, views: a.views[i] ?? 0, reposts: a.reposts[i] ?? 0, replies: a.replies[i] ?? 0 }))
  }, [data])
  const eng = useMemo(() => {
    if (!data?.chart_data) return []
    const { labels, engagement_rates } = data.chart_data
    return labels.map((l, i) => ({ i, date: new Date(l).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }), rate: engagement_rates[i] }))
      .filter((d) => !range || (d.i >= range[0] && d.i <= range[1]))
  }, [data, range])
  const maxes = useMemo(() => ({
    likes: Math.max(1, ...(data?.chart_data?.likes ?? [])),
    views: Math.max(1, ...(data?.chart_data?.views ?? [])),
    reposts: Math.max(1, ...(data?.chart_data?.reposts ?? [])),
    replies: Math.max(1, ...(data?.chart_data?.replies ?? [])),
  }), [data]) as Record<MetricKey, number>
  const inRange = (_: unknown, i: number) => !range || (i >= range[0] && i <= range[1])
  const avgEng = useMemo(() => { const r = data?.chart_data?.engagement_rates.filter(inRange); return r?.length ? r.reduce((a, b) => a + b, 0) / r.length : 0 }, [data, range]) // eslint-disable-line react-hooks/exhaustive-deps
  const totalEng = useMemo(() => data?.chart_data?.engagements?.filter(inRange).reduce((a, b) => a + b, 0) ?? 0, [data, range]) // eslint-disable-line react-hooks/exhaustive-deps

  // ドラッグ選択のハンドラ(表示中データの何番目か → 全体index)
  const idxOf = (rows: { i: number }[], st: any): number | null => { const k = Number(st?.activeTooltipIndex); return Number.isFinite(k) ? (rows[k]?.i ?? null) : null }
  const dragProps = (rows: { i: number }[]) => ({
    onMouseDown: (st: any) => { const v = idxOf(rows, st); if (v != null) setDrag({ a: v, b: v }) },
    onMouseMove: (st: any) => { const v = idxOf(rows, st); if (drag && v != null) setDrag({ a: drag.a, b: v }) },
    onMouseUp: () => {
      if (drag && drag.a !== drag.b) setRange([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)])
      setDrag(null)
    },
    onMouseLeave: () => setDrag(null),
  })

  const toggle = (k: MetricKey) => setActive((prev) => { const n = new Set(prev); if (n.has(k)) { if (n.size > 1) n.delete(k) } else n.add(k); return n })

  if (error) return <div className="grid min-h-[40vh] place-items-center px-4 text-center"><div className="max-w-md rounded-2xl border border-d-border bg-d-med p-8"><i className="bx bx-error-circle mb-3 text-4xl text-d-text3" /><p className="text-d-text2">{error}</p></div></div>
  if (!data) return <PageLoader />
  const { stats, chart_data } = data
  if (!stats || !chart_data || stats.total_records < 2)
    return <div className="grid min-h-[40vh] place-items-center px-4 text-center"><div className="max-w-md p-8"><i className="bx bx-line-chart mb-3 text-4xl text-d-text3" /><h2 className="font-semibold text-d-text">{t('gv.noData')}</h2><p className="mt-1 text-sm text-d-text3">{t('gv.noDataD')}</p></div></div>

  const activeMetrics = METRICS.filter((m) => active.has(m.key))
  const badges = [
    { icon: 'bx-flame', color: '#f97316', label: t('gv.streak', { n: stats.current_consecutive_streak }) },
    { icon: 'bxs-trophy', color: '#eab308', label: t('gv.max', { n: stats.max_streak }) },
    { icon: 'bx-check-double', color: '#38bdf8', label: t('gv.cov', { n: stats.coverage_rate }) },
    ...(stats.predicted_post_time ? [{ icon: 'bx-time-five', color: '#22c55e', label: t('gv.pred', { t: stats.predicted_post_time }) }] : []),
    { icon: 'bx-moon', color: '#818cf8', label: t('gv.nopost', { n: stats.non_posted_days }) },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon={LineChart} title={t('gv.title')} right={<ShareButton targetRef={posterRef} filename="ohatwi-graph.png" title={t('gv.shareTitle')} />} />

      <div ref={posterRef} className="rounded-2xl">
      <ScrollReveal y={-10} duration={0.5}>
        <div className="mb-6 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full border border-d-border bg-d-med px-3 py-1.5 text-xs font-medium text-d-text">
              <i className={`bx ${b.icon}`} style={{ color: b.color }} />{b.label}
            </span>
          ))}
        </div>
      </ScrollReveal>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon="bx-calendar-check" label={t('awd.mPosts')} value={stats.total_records} color="#38bdf8" delay={0.02} />
        <KpiCard icon="bxs-heart" label={t('gv.kAvgLikes')} value={parseFloat(stats.avg_likes)} color="#ec4899" delay={0.06} series={data?.chart_data?.likes} />
        <KpiCard icon="bxs-show" label={t('gv.kAvgViews')} value={parseFloat(stats.avg_views)} color="#fb923c" delay={0.1} series={data?.chart_data?.views} />
        <KpiCard icon="bx-repost" label={t('gv.kAvgRp')} value={parseFloat(stats.avg_reposts)} color="#22c55e" delay={0.14} series={data?.chart_data?.reposts} />
        <KpiCard icon="bxs-message-rounded-dots" label={t('gv.kAvgReplies')} value={parseFloat(stats.avg_replies)} color="#60a5fa" delay={0.18} series={data?.chart_data?.replies} />
        <KpiCard icon="bxs-heart-circle" label={t('rc.totLikes')} value={stats.total_likes} color="#facc15" delay={0.22} series={data?.chart_data?.likes} />
      </div>
      </div>

      {/* 期間絞り込み */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-d-text3">
        <DateRangePicker
          label={t('rc.period')}
          value={pick ?? (range ? { start: new Date(chart_data.labels[range[0]]), end: new Date(chart_data.labels[range[1]]) } : null)}
          onChange={(v) => {
            const f = new Date(v.start).setHours(0, 0, 0, 0)
            const t = new Date(v.end).setHours(23, 59, 59, 999)
            const idx = chart_data.labels.map((l, i) => [new Date(l).getTime(), i] as const).filter(([ms]) => ms >= f && ms <= t).map(([, i]) => i)
            setPick(v)
            setRange(idx.length ? [idx[0], idx[idx.length - 1]] : [1, 0]) // [1,0]=該当なし
          }}
          onClear={() => { setRange(null); setPick(null) }}
        />
        {range && range[0] > range[1] ? (
          <>
            <span className="font-medium text-amber-500">{t('gv.noRange')}</span>
            <Button variant="outline" size="xs" className="rounded-full" onClick={() => { setRange(null); setPick(null) }}>{t('gv.reset')}</Button>
          </>
        ) : range ? (
          <>
            <span className="font-medium text-d-text">
              {new Date(chart_data.labels[range[0]]).toLocaleDateString(i18n.language)} 〜 {new Date(chart_data.labels[range[1]]).toLocaleDateString(i18n.language)}
            </span>
            <span>({t('rc.count', { n: range[1] - range[0] + 1 })})</span>
            <Button variant="outline" size="xs" className="rounded-full" onClick={() => { setRange(null); setPick(null) }}>{t('gv.reset')}</Button>
          </>
        ) : <span>{t('gv.hint')}</span>}
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((tb) => {
          const on = tab === tb.key
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${on ? 'text-d-text' : 'text-d-text2 hover:text-d-text'}`}>
              {on && <motion.span layoutId="g-tab" className="absolute inset-0 -z-10 rounded-full bg-d-light" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <i className={`bx ${tb.icon}`} />{t(tb.label)}
            </button>
          )
        })}
      </div>

      {range && range[0] > range[1] ? (
        <div className="rounded-2xl border border-d-border bg-d-med">
          <AppEmpty icon={CalendarX} title={t('gv.noRange')} description={t('gv.noRangeD')}>
            <Button variant="outline" size="sm" onClick={() => { setRange(null); setPick(null) }}>{t('gv.reset')}</Button>
          </AppEmpty>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          <div>
            <div className="rounded-2xl border border-d-border bg-d-med p-5 [&_*]:outline-none [&_.recharts-wrapper]:outline-none [&_svg]:focus:outline-none">
              {tab === 'trend' && (
                <>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {METRICS.map((m) => {
                      const on = active.has(m.key)
                      return (
                        <button key={m.key} onClick={() => toggle(m.key)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${on ? 'border-transparent text-d-text' : 'border-d-border text-d-text2 hover:text-d-text'}`}
                          style={on ? { background: `${m.color}26`, boxShadow: `0 0 0 1px ${m.color}66` } : undefined}>
                          <span className="size-2 rounded-full" style={{ background: m.color }} />{t(m.label)}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mb-3 text-[11px] text-d-text3">
                    {activeMetrics.length > 1 ? t('gv.multiNote') : t('gv.single')}
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ top: 5, right: 8, left: -6, bottom: 0 }} className="select-none" {...dragProps(trend)}>
                        <defs>{METRICS.map((m) => (
                          <linearGradient key={m.key} id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={m.color} stopOpacity={0.35} /><stop offset="100%" stopColor={m.color} stopOpacity={0} />
                          </linearGradient>
                        ))}</defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="i" tickFormatter={(i) => data.chart_data!.labels[i] ? new Date(data.chart_data!.labels[i]).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : ''} stroke="var(--d-text3)" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                        {activeMetrics.map((m) => (
                          <YAxis key={m.key} yAxisId={m.key} domain={[0, (maxes[m.key] || 1) * 1.15]}
                            hide={activeMetrics.length > 1} stroke={m.color} fontSize={11} tickLine={false} axisLine={false} width={44} />
                        ))}
                        <RechartsTooltip content={(p: any) => <ChartTooltip {...p} label={p.payload?.[0]?.payload?.date} />} />
                        {drag && <ReferenceArea yAxisId={activeMetrics[0].key} x1={drag.a} x2={drag.b} fill="var(--d-accent)" fillOpacity={0.15} />}
                        {activeMetrics.map((m) => (
                          <Area key={m.key} yAxisId={m.key} type="monotone" dataKey={m.key} name={t(m.label)} stroke={m.color} fill={`url(#g-${m.key})`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {tab === 'dow' && (
                <>
                  <h3 className="mb-4 text-sm font-semibold text-d-text">{t('gv.dowTitle')}</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dow} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="day" stroke="var(--d-text3)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="var(--d-text3)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#fb923c" fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="left" dataKey="likes" name={t('rc.likes')} fill="#ec4899" radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="left" dataKey="reposts" name={t('rc.reposts')} fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="left" dataKey="replies" name={t('rc.replies')} fill="#60a5fa" radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="right" dataKey="views" name={t('rc.views')} fill="#fb923c" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {tab === 'time' && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-d-text">{t('gv.timeTitle')}</h3>
                    <div className="flex gap-1 rounded-full border border-d-border p-0.5">
                      {(['count', 'likes', 'views'] as const).map((k) => (
                        <button key={k} onClick={() => setHeat(k)} className={`relative isolate rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${heat === k ? 'text-d-text' : 'text-d-text2 hover:text-d-text'}`}>
                          {heat === k && <motion.span layoutId="g-heat" className="absolute inset-0 -z-10 rounded-full bg-d-light" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                          {k === 'count' ? t('gv.hCount') : k === 'likes' ? t('gv.kAvgLikes') : t('gv.kAvgViews')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <HeatCalendar chartData={chart_data} metric={heat} />
                </>
              )}

              {tab === 'engagement' && (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-6">
                    <div><div className="text-xs text-d-text3">{t('gv.avgEng')}</div><div className="mt-1 text-xl font-bold text-d-text"><NumberTicker value={avgEng} format={(n) => n.toFixed(2)} /><span className="ml-0.5 text-sm text-d-text3">%</span></div></div>
                    <div><div className="text-xs text-d-text3">{t('gv.totEng')}</div><div className="mt-1 text-xl font-bold text-d-text"><NumberTicker value={totalEng} locale /></div></div>
                    <Tip label={t('gv.engTip')}><span className="text-d-text3"><i className="bx bx-info-circle" /></span></Tip>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={eng} margin={{ top: 5, right: 8, left: -18, bottom: 0 }} className="select-none" {...dragProps(eng)}>
                        <defs><linearGradient id="g-eng" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="i" tickFormatter={(i) => data.chart_data!.labels[i] ? new Date(data.chart_data!.labels[i]).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : ''} stroke="var(--d-text3)" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                        <YAxis stroke="var(--d-text3)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        {drag && <ReferenceArea x1={drag.a} x2={drag.b} fill="var(--d-accent)" fillOpacity={0.15} />}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <RechartsTooltip content={({ active: a, payload, label }: any) => (!a || !payload?.length) ? null : (
                          <div className="rounded-lg border border-d-border bg-d-light px-3 py-2 text-xs text-d-text shadow-lg"><div className="mb-1 font-medium">{payload[0].payload?.date ?? label}</div><div className="flex items-center gap-1.5 text-[#818cf8]"><span className="size-1.5 rounded-full bg-current" />{t('awd.mEng')}: {payload[0].value?.toFixed(2)}%</div></div>
                        )} />
                        <Area type="monotone" dataKey="rate" name={t('awd.mEng')} stroke="#818cf8" fill="url(#g-eng)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {tab === 'table' && (
                <div className="-m-5">
                  <DataTable columns={cols} data={chart_data.labels.map((label, i) => ({ label, likes: chart_data.likes[i], reposts: chart_data.reposts[i], replies: chart_data.replies[i], views: chart_data.views[i], rate: chart_data.engagement_rates[i] ?? 0 })).filter((_, i) => inRange(null, i)).reverse()} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      )}
    </div>
  )
}
