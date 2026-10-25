import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Reveal } from './motion'
import { ChartLine, ChevronLeft } from 'lucide-react'
import FacetedFilterBar from '@/components/dashboard-ui/FacetedFilterBar'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { PageLoader } from '@/components/ui/page-loader'
import { Pagination } from '@/components/arc/pagination/pagination'
import { LineChart } from '@/components/arc/line-chart/line-chart'
import { friendlyError } from '@/lib/dashboard/api'

interface Usage {
  days: number; has_key: boolean
  totals: { total: number; ok: number; client_err: number; server_err: number; auth_failed: number; avg_ms: number; last_at: string | null }
  daily: { d: string; total: number; errors: number }[]
  endpoints: { endpoint: string; total: number; errors: number; avg_ms: number }[]
}
interface Log { id: number; method: string; full_path: string; endpoint: string | null; response_code: number; response_time_ms: number | null; source_type: string | null; ip_address: string | null; user_agent: string | null; created_at: string }
interface Logs { logs: Log[]; page: number; total: number; total_pages: number }

const RANGES = [7, 30, 90]
const fetchJson = async <T,>(url: string, t: (k: string) => string): Promise<T> => {
  const r = await fetch(url, { credentials: 'include' })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(r.status === 401 ? t('au.needLogin') : d.error || t('au.fetchFail'))
  return d
}
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function ApiUsagePage() {
  const { t } = useTranslation()
  const [sp, setSp] = useSearchParams()
  const days = RANGES.includes(Number(sp.get('days'))) ? Number(sp.get('days')) : 30
  const status = sp.get('status') ?? ''
  const endpoint = sp.get('endpoint') ?? ''
  const page = Number(sp.get('page')) || 1
  const [usage, setUsage] = useState<Usage | null>(null)
  const [logs, setLogs] = useState<Logs | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => { document.title = `${t('au.docTitle')} - おはツイKeeper` }, [])
  useEffect(() => {
    fetchJson<Usage>(`/app-api/settings/api_usage?days=${days}`, t).then(setUsage).catch((e) => setError(friendlyError(e)))
  }, [days])
  useEffect(() => {
    fetchJson<Logs>(`/app-api/settings/api_logs?status=${status}&endpoint=${encodeURIComponent(endpoint)}&page=${page}`, t)
      .then(setLogs).catch((e) => setError(friendlyError(e)))
  }, [status, endpoint, page])

  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page' && k !== 'days') n.delete('page'); setSp(n, { replace: true }) }

  // 呼び出しのない日も 0 で埋めて、折れ線が途切れないようにする
  const chart = useMemo(() => {
    if (!usage) return []
    const by = new Map(usage.daily.map((r) => [r.d, r]))
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i)
      const k = ymd(dt), r = by.get(k)
      out.push({ key: k, label: k, axisLabel: `${dt.getMonth() + 1}/${dt.getDate()}`, values: { total: r?.total ?? 0, errors: r?.errors ?? 0 } })
    }
    return out
  }, [usage, days])

  const codeColor = (c: number) => (c < 400 ? 'text-green-400' : 'text-red-400')

  return (
    <div className="dash-scope text-d-text">
      <div className="mx-auto max-w-4xl px-5 py-12">
        <Link to="/settings/apikey" className="inline-flex items-center gap-1 text-sm text-d-text2 transition-colors hover:text-d-text">
          <ChevronLeft className="size-4" />{t('au.back')}
        </Link>
        <div className="mt-5" />
        <PageHeader icon={ChartLine} title={t('au.docTitle')} desc={t('au.desc')} />
        {error && <p className="py-16 text-center text-red-400">{error}</p>}
        {!usage && !error && <PageLoader />}
        {usage && (
          <>
            {!usage.has_key && <p className="mt-6 text-sm text-d-text2">{t('au.noKey')}</p>}

            <div className="mt-6 flex items-center gap-2" role="group" aria-label={t('au.range')}>
              {RANGES.map((n) => (
                <button key={n} type="button" aria-pressed={days === n} onClick={() => set('days', String(n))}
                  className={`min-h-10 rounded-lg border px-3 text-sm transition-colors active:scale-[0.96] ${days === n ? 'border-d-text bg-d-med text-d-text' : 'border-d-border text-d-text2 hover:text-d-text'}`}>
                  {t('au.days', { n })}
                </button>
              ))}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-y-4 border-y border-d-border py-5 md:grid-cols-4 md:divide-x md:divide-d-border">
              {[[t('au.total'), usage.totals.total.toLocaleString()],
                [t('au.rate'), usage.totals.total ? `${Math.round((usage.totals.ok / usage.totals.total) * 100)}%` : '—'],
                [t('au.avg'), usage.totals.total ? `${usage.totals.avg_ms.toLocaleString()}ms` : '—'],
                [t('au.last'), usage.totals.last_at?.slice(0, 16).replace('T', ' ') ?? '—']].map(([l, v], i) => (
                <div key={l} className={i ? 'md:px-6' : ''}><dt className="text-xs text-d-text3">{l}</dt><dd className="mt-1 text-xl font-medium tabular-nums">{v}</dd></div>
              ))}
            </dl>

            <h2 className="mt-8 mb-3 font-medium">{t('au.chart')}</h2>
            <LineChart
              data={chart}
              label={t('au.chart')}
              series={[{ key: 'total', label: t('au.sReq'), area: true }, { key: 'errors', label: t('au.sErr'), dashed: true }]}
              emptyLabel={t('au.noData')}
              formatValue={(v) => v.toLocaleString()}
            />

            <h2 className="mt-8 mb-3 font-medium">{t('au.endpoints')}</h2>
            {usage.endpoints.length === 0 ? <p className="py-6 text-sm text-d-text3">{t('au.noData')}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-d-text3"><tr className="border-b border-d-border">
                    <th className="py-2 font-normal">{t('au.colEp')}</th>
                    <th className="py-2 text-right font-normal">{t('au.colCalls')}</th>
                    <th className="py-2 text-right font-normal">{t('au.colErr')}</th>
                    <th className="py-2 text-right font-normal">{t('au.colAvg')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-d-border">
                    {usage.endpoints.map((e) => (
                      <tr key={e.endpoint}>
                        <td className="max-w-0 truncate py-2.5 font-mono text-xs">
                          <button type="button" className="hover:underline" onClick={() => set('endpoint', e.endpoint === '-' ? '' : e.endpoint)}>{e.endpoint}</button>
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{e.total.toLocaleString()}</td>
                        <td className={`py-2.5 text-right tabular-nums ${e.errors ? 'text-red-400' : 'text-d-text3'}`}>{e.errors.toLocaleString()}</td>
                        <td className="py-2.5 text-right tabular-nums text-d-text2">{e.avg_ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <h2 className="mt-8 mb-3 font-medium">{t('au.log')}</h2>
        {logs && (
          <>
            <FacetedFilterBar shown={logs.total} total={logs.total} facets={[
              { key: 'status', label: t('au.result'), value: status || 'all', onChange: (v) => set('status', v === 'all' ? '' : v),
                options: [['all', 'au.all'], ['ok', 'au.ok'], ['error', 'au.err']].map(([value, l]) => ({ value, label: t(l) })) },
              ...(endpoint ? [{ key: 'endpoint', label: t('au.colEp'), value: endpoint, onChange: () => set('endpoint', ''), options: [{ value: endpoint, label: endpoint }] }] : []),
            ]} />
            <ul className="mt-3 divide-y divide-d-border border-y border-d-border">
              {logs.logs.length === 0 && <li className="py-10 text-center text-d-text3">{t('au.empty')}</li>}
              {logs.logs.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} className="flex min-h-10 w-full items-center gap-3 py-3 text-left text-sm">
                    <span className={`w-10 shrink-0 font-medium tabular-nums ${codeColor(l.response_code)}`}>{l.response_code}</span>
                    <span className="w-12 shrink-0 text-xs text-d-text3">{l.method}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{l.full_path}</span>
                    <span className="shrink-0 text-xs tabular-nums text-d-text3">{l.response_time_ms != null ? `${l.response_time_ms}ms` : ''}</span>
                    <span className="hidden shrink-0 text-xs tabular-nums text-d-text3 sm:inline">{l.created_at?.slice(0, 19).replace('T', ' ')}</span>
                    <i className={`bx bx-chevron-down shrink-0 text-d-text3 transition-transform duration-200 ${open === l.id ? 'rotate-180' : ''}`} />
                  </button>
                  <Reveal show={open === l.id}>
                    <dl className="grid gap-x-6 gap-y-2 pb-4 text-xs sm:grid-cols-2">
                      {[['Time', l.created_at?.slice(0, 19).replace('T', ' ')], ['IP', l.ip_address], ['Source', l.source_type], ['User-Agent', l.user_agent]].map(([k, v]) => (
                        <div key={k} className="min-w-0"><dt className="text-d-text3">{k}</dt><dd className="break-all">{v || '—'}</dd></div>
                      ))}
                    </dl>
                  </Reveal>
                </li>
              ))}
            </ul>
            {logs.total_pages > 1 && (
              <div className="mt-5 flex justify-center">
                <Pagination page={page} pageCount={logs.total_pages} onPageChange={(n) => set('page', String(n))} label={t('au.pager')} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
