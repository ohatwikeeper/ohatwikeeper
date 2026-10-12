import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowDownRight, ArrowUpRight, ExternalLink, RefreshCw, X } from 'lucide-react'
import Shell from './Shell'
import { adminFetch, useDebounced } from '../admin/kit'
import { LineChart, type LineChartDatum, type LineChartSeries } from '@/components/arc/line-chart/line-chart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
const SERIES_COLORS = ['var(--arc-accent)', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#94a3b8']
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

  const change = res && res.prev_sum > 0 ? ((res.sum - res.prev_sum) / res.prev_sum) * 100 : null
  const dr = { from: new Date(from + 'T00:00:00'), to: new Date(to + 'T00:00:00') }
  const presetActive = (d: number) => to === jstToday() && from === shift(to, -d)
  const dimLabel = (k: string) => res?.dims.find((d) => d.key === k)?.label ?? k

  return (
    <Shell title="詳細分析" actions={<Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}><RefreshCw className={loading ? 'animate-spin' : ''} />更新</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="指標">
          {(res?.metrics ?? [{ key: 'access', title: 'アクセス' }]).map((m) => (
            <button key={m.key} role="tab" aria-selected={metric === m.key} onClick={() => patch({ metric: m.key, group: null }, false)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${metric === m.key ? 'border-d-accent bg-d-accent/15 text-d-text' : 'border-d-border text-d-text2 hover:text-d-text'}`}>{m.title}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-d-border bg-d-med p-0.5">
            {PRESETS.map(([l, d]) => (
              <button key={l} onClick={() => patch({ from: shift(jstToday(), -d), to: jstToday() })}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${presetActive(d) ? 'bg-d-accent/20 text-d-text' : 'text-d-text2 hover:text-d-text'}`}>{l}</button>
            ))}
          </div>
          <DateRangePicker value={dr} onChange={(v) => v?.from && patch({ from: format(v.from, 'yyyy-MM-dd'), to: format(v.to ?? v.from, 'yyyy-MM-dd') })} />
          <SimpleSelect value={bucket} onChange={(v) => patch({ bucket: v === 'auto' ? null : v })} options={BUCKETS} />
          {!!res?.dims.length && (
            <SimpleSelect value={group} onChange={(v) => patch({ group: v || null })} options={[{ value: '', label: '内訳で分割: なし' }, ...res.dims.map((d) => ({ value: d.key, label: `分割: ${d.label}` }))]} />
          )}
          {filters.map(([k, v]) => (
            <button key={k} onClick={() => patch({ [k]: null })} className="inline-flex items-center gap-1 rounded-full border border-d-accent/40 bg-d-accent/10 px-2.5 py-1 text-xs text-d-text">
              {dimLabel(k.slice(2))}: <b className="max-w-40 truncate font-medium">{v}</b><X className="size-3" />
            </button>
          ))}
          {LIST[metric] && <Button variant="ghost" size="sm" className="ml-auto" nativeButton={false} render={<Link to={`/admin-new/data/${LIST[metric]}`} />}><ExternalLink />生データ一覧</Button>}
        </div>

        {err && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{err}</p>}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { l: '期間合計', v: res ? nf(res.sum) : null, sub: change === null ? '前期間: 0' : <span className={`inline-flex items-center gap-0.5 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(change).toFixed(0)}% <span className="text-d-text3">(前期間 {nf(res!.prev_sum)})</span></span> },
            { l: `平均 / ${{ hour: '時間', day: '日', week: '週', month: '月' }[res?.bucket ?? 'day']}`, v: res ? nf(Math.round(res.avg * 10) / 10) : null, sub: res ? `${res.from} 〜 ${res.to}` : '' },
            { l: 'ピーク', v: res?.peak ? nf(res.peak.value) : res ? '-' : null, sub: res?.peak?.label ?? '' },
          ].map((c) => (
            <Card key={c.l} className="gap-1 p-4">
              <p className="text-xs text-d-text3">{c.l}</p>
              {c.v === null ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold tabular-nums text-d-text">{c.v}</p>}
              <p className="text-xs text-d-text3">{c.sub}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          {hover !== null && res && <p className="mb-1 text-xs text-d-text3">{res.labels[hover]}: <b className="text-d-text">{nf(res.total[hover])}</b></p>}
          {res ? <LineChart data={data} series={series} label={res.metrics.find((m) => m.key === res.metric)?.title ?? ''} height={320} loading={loading} emptyLabel="この条件のデータはありません"
            onActiveChange={(i) => setHover(i)} categoryLabel="期間" /> : <Skeleton className="h-80 w-full" />}
        </Card>

        {!!res?.dims.length && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {res.dims.map((d) => {
              const rows = res.breakdowns[d.key] ?? []
              const max = Math.max(1, ...rows.map((r) => r.n))
              return (
                <Card key={d.key} className="gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-d-text">{d.label}</h3>
                    <button className="text-xs text-d-text3 hover:text-d-text" onClick={() => patch({ group: group === d.key ? null : d.key })}>{group === d.key ? '分割を解除' : '分割して表示'}</button>
                  </div>
                  {rows.length === 0 && <p className="text-xs text-d-text3">データなし</p>}
                  <ul className="flex flex-col gap-1">
                    {rows.map((r) => (
                      <li key={r.value}>
                        <button onClick={() => patch({ ['f_' + d.key]: r.value })} title="クリックで絞り込み" className="group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-md px-2 py-1 text-left text-xs hover:bg-d-med">
                          <span className="absolute inset-y-0 left-0 bg-d-accent/15" style={{ width: `${(r.n / max) * 100}%` }} />
                          <span className="relative truncate text-d-text">{r.value}</span>
                          <span className="relative tabular-nums text-d-text2">{nf(r.n)} <span className="text-d-text3">({res.sum ? Math.round((r.n / res.sum) * 100) : 0}%)</span></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}
