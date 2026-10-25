import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ExternalLink, RefreshCw, X } from 'lucide-react'
import Shell from './Shell'
import { adminFetch, useDebounced } from '../admin/kit'
import { LineChart, type LineChartDatum, type LineChartSeries } from '@/components/arc/line-chart/line-chart'
import { Button } from '@/components/ui/button'
import { Delta, Empty, Pill, PageHead, Panel, rise } from './ui'
import { Skeleton } from '@/components/ui/skeleton'
import { SimpleSelect } from '@/components/ui/simple-select'
import { DateRangePicker } from '@/components/ui/date-range-picker'

interface Res {
  metric: string; metrics: { key: string; title: string }[]; dims: { key: string; label: string }[]
  from: string; to: string; bucket: 'hour' | 'day' | 'week' | 'month'; labels: string[]; total: number[]
  series: Record<string, number[]>; group: string; sum: number; prev_sum: number; avg: number
  peak: { label: string; value: number } | null; breakdowns: Record<string, { value: string; n: number }[]>
}

const jstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const shift = (ymd: string, d: number) => new Date(Date.parse(ymd + 'T00:00:00Z') + d * 864e5).toISOString().slice(0, 10)
const PRESETS: [string, number][] = [['今日', 0], ['7日', 6], ['14日', 13], ['30日', 29], ['90日', 89], ['1年', 364]]
const BUCKETS = [{ value: 'auto', label: '粒度: 自動' }, { value: 'hour', label: '1時間' }, { value: 'day', label: '日' }, { value: 'week', label: '週' }, { value: 'month', label: '月' }]
// 指標 → 一覧画面
const LIST: Record<string, string> = { access: 'access', api: 'api-logs', signups: 'users', errors: 'page-errors', api_errors: 'api-errors', mails: 'mails', actions: 'user-actions' }
const SERIES_COLORS = ['var(--arc-accent)', 'var(--d-success)', 'var(--d-warning)', 'var(--d-danger)', 'var(--d-dev)', 'var(--d-accent-h)', 'var(--d-text3)']
const nf = (n: number) => n.toLocaleString()

function axisOf(l: string, bucket: Res['bucket']) {
  return bucket === 'hour' ? l.slice(5, 10).replace('-', '/') + ' ' + l.slice(11, 13) + '時' : bucket === 'month' ? l.slice(0, 7) : l.slice(5).replace('-', '/')
}

/** /admin-new/analytics — 指標・期間・粒度・絞り込み・内訳を切り替えて見る詳細分析 */
export default function AnalyticsPage() {
  const [sp, setSp] = useSearchParams()
  const [res, setRes] = useState<Res | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tick, setTick] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  const metric = sp.get('metric') ?? 'access'
  const to = sp.get('to') ?? jstToday()
  const from = sp.get('from') ?? shift(to, -13)
  const bucket = sp.get('bucket') ?? 'auto'
  const group = sp.get('group') ?? ''
  const filters = [...sp.entries()].filter(([k]) => k.startsWith('f_'))
  const qs = useDebounced(sp.toString(), 150)

  const patch = (p: Record<string, string | null>, keepFilters = true) => {
    const n = new URLSearchParams(sp)
    if (!keepFilters) [...n.keys()].filter((k) => k.startsWith('f_')).forEach((k) => n.delete(k))
    for (const [k, v] of Object.entries(p)) v === null || v === '' ? n.delete(k) : n.set(k, v)
    setSp(n, { replace: true })
  }

  useEffect(() => {
    let live = true
    setLoading(true)
    const p = new URLSearchParams(qs); p.set('metric', p.get('metric') ?? 'access'); p.set('from', p.get('from') ?? from); p.set('to', p.get('to') ?? to)
    adminFetch<Res>(`data/_analytics?${p}`)
      .then((d) => { if (live) { setRes(d); setErr('') } })
      .catch((e) => live && setErr(e.message))
      .finally(() => live && setLoading(false))
    return () => { live = false }
  }, [qs, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, series } = useMemo(() => {
    if (!res) return { data: [] as LineChartDatum[], series: [] as LineChartSeries[] }
    const title = res.metrics.find((m) => m.key === res.metric)?.title ?? ''
    const names = Object.keys(res.series)
    const series: LineChartSeries[] = names.length ? names.map((n, i) => ({ key: n, label: n, color: SERIES_COLORS[i % SERIES_COLORS.length], area: names.length === 1 })) : [{ key: 'total', label: title }]
    const data = res.labels.map((l, i) => ({
      key: l, label: res.bucket === 'week' ? `${l} の週` : l, axisLabel: i % Math.ceil(res.labels.length / 8) === 0 ? axisOf(l, res.bucket) : undefined,
      values: names.length ? Object.fromEntries(names.map((n) => [n, res.series[n][i]])) : { total: res.total[i] },
    }))
    return { data, series }
  }, [res])

  const dr = { from: new Date(from + 'T00:00:00'), to: new Date(to + 'T00:00:00') }
  const presetActive = (d: number) => to === jstToday() && from === shift(to, -d)
  const dimLabel = (k: string) => res?.dims.find((d) => d.key === k)?.label ?? k

  const unit = { hour: '時間', day: '日', week: '週', month: '月' }[res?.bucket ?? 'day']
  const metricTitle = res?.metrics.find((m) => m.key === res.metric)?.title ?? 'アクセス'
  const cards: { l: string; v: string | null; sub: React.ReactNode }[] = [
    { l: '期間合計', v: res ? nf(res.sum) : null, sub: res ? <span className="inline-flex items-center gap-1.5"><Delta now={res.sum} prev={res.prev_sum} good={metric.includes('error') ? 'down' : 'up'} /><span>前期間 <span className="tabular-nums">{nf(res.prev_sum)}</span></span></span> : '' },
    { l: `平均 / ${unit}`, v: res ? nf(Math.round(res.avg * 10) / 10) : null, sub: res ? <span className="tabular-nums">{res.from} 〜 {res.to}</span> : '' },
    { l: 'ピーク', v: res?.peak ? nf(res.peak.value) : res ? '-' : null, sub: res?.peak?.label ?? '' },
  ]

  return (
    <Shell title="詳細分析" actions={<Button variant="ghost" size="icon" aria-label="更新" onClick={() => setTick((t) => t + 1)}><RefreshCw className={loading ? 'animate-spin' : ''} /></Button>}>
      <PageHead title="詳細分析" desc="指標・期間・粒度を切り替えて、内訳をクリックで絞り込めます。">
        {LIST[metric] && <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/admin-new/data/${LIST[metric]}`} />}><ExternalLink />生データ一覧</Button>}
      </PageHead>

      <div className="flex flex-col gap-4">
        <div style={rise(0)} className="an-rise flex flex-wrap gap-1.5" role="tablist" aria-label="指標">
          {(res?.metrics ?? [{ key: 'access', title: 'アクセス' }]).map((m) => (
            <Pill key={m.key} role="tab" on={metric === m.key} onClick={() => patch({ metric: m.key, group: null }, false)}>{m.title}</Pill>
          ))}
        </div>

        <div style={rise(1)} className="an-rise flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-full bg-d-light/60 p-0.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/.06)]" role="group" aria-label="期間">
            {PRESETS.map(([l, d]) => (
              <button key={l} type="button" aria-pressed={presetActive(d)} onClick={() => patch({ from: shift(jstToday(), -d), to: jstToday() })}
                className={`an-press min-h-8 rounded-full px-3 text-xs tabular-nums ${presetActive(d) ? 'bg-d-accent/20 text-d-text' : 'text-d-text2 hover:text-d-text'}`}>{l}</button>
            ))}
          </div>
          <DateRangePicker value={dr} onChange={(v) => v?.from && patch({ from: format(v.from, 'yyyy-MM-dd'), to: format(v.to ?? v.from, 'yyyy-MM-dd') })} />
          <SimpleSelect value={bucket} onChange={(v) => patch({ bucket: v === 'auto' ? null : v })} options={BUCKETS} />
          {!!res?.dims.length && (
            <SimpleSelect value={group} onChange={(v) => patch({ group: v || null })} options={[{ value: '', label: '内訳で分割: なし' }, ...res.dims.map((d) => ({ value: d.key, label: `分割: ${d.label}` }))]} />
          )}
          {filters.map(([k, v]) => (
            <button key={k} type="button" onClick={() => patch({ [k]: null })} aria-label={`${dimLabel(k.slice(2))}の絞り込みを解除`} className="an-press inline-flex min-h-8 items-center gap-1 rounded-full bg-d-accent/10 px-2.5 text-xs text-d-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--d-accent)_40%,transparent)]">
              {dimLabel(k.slice(2))}: <b className="max-w-40 truncate font-medium">{v}</b><X className="size-3" />
            </button>
          ))}
        </div>

        {err && <p role="alert" className="rounded-xl bg-d-danger/10 p-3 text-sm text-d-danger shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--d-danger)_35%,transparent)]">{err}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c, n) => (
            <Panel key={c.l} i={n + 2}>
              <p className="text-xs text-d-text3">{c.l}</p>
              {c.v === null ? <Skeleton className="mt-1 h-9 w-24" /> : <p className="mt-0.5 text-3xl font-medium tabular-nums tracking-tight text-d-text">{c.v}</p>}
              <p className="mt-1 min-h-4 text-xs text-d-text3">{c.sub}</p>
            </Panel>
          ))}
        </div>

        <Panel i={5} title={metricTitle} desc={hover !== null && res ? <><span className="tabular-nums">{res.labels[hover]}</span>: <b className="font-medium tabular-nums text-d-text2">{nf(res.total[hover])}</b></> : '線の上にカーソルを合わせると値を表示します'}>
          {res ? <LineChart data={data} series={series} label={metricTitle} height={320} loading={loading} emptyLabel="この条件のデータはありません"
            onActiveChange={(i) => setHover(i)} categoryLabel="期間" /> : <Skeleton className="h-80 w-full" />}
        </Panel>

        {!!res?.dims.length && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {res.dims.map((d, n) => {
              const rows = res.breakdowns[d.key] ?? []
              const max = Math.max(1, ...rows.map((r) => r.n))
              return (
                <Panel key={d.key} i={n + 6} title={d.label} flush action={
                  <button type="button" className="min-h-8 text-xs text-d-text3 hover:text-d-text" onClick={() => patch({ group: group === d.key ? null : d.key })}>{group === d.key ? '分割を解除' : '分割して表示'}</button>
                }>
                  {rows.length === 0 && <Empty>データなし</Empty>}
                  <ul className="flex flex-col gap-0.5 px-1.5 pt-1">
                    {rows.map((r) => (
                      <li key={r.value}>
                        <button type="button" onClick={() => patch({ ['f_' + d.key]: r.value })} title="クリックで絞り込み" className="an-press group relative flex min-h-9 w-full items-center justify-between gap-2 overflow-hidden rounded-lg px-2.5 text-left text-xs hover:bg-d-light/60">
                          <span aria-hidden className="absolute inset-y-1 left-0 rounded-r-md bg-d-accent/15 transition-[width] duration-500" style={{ width: `${(r.n / max) * 100}%` }} />
                          <span className="relative truncate text-d-text">{r.value}</span>
                          <span className="relative shrink-0 tabular-nums text-d-text2">{nf(r.n)} <span className="text-d-text3">({res.sum ? Math.round((r.n / res.sum) * 100) : 0}%)</span></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}
