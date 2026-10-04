import { useTranslation } from 'react-i18next'
import FacetedFilterBar from '@/components/dashboard-ui/FacetedFilterBar'
import { PageLoader } from '@/components/ui/page-loader'
import { Webhook } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/arc/pagination/pagination'

interface Log { id: number; event: string; status_code: number | null; payload: string | null; response_body: string | null; duration_ms: number | null; triggered_at: string }
interface Data {
  webhook: { id: number; name: string; url: string; events: string[]; is_active: number; created_at: string; last_triggered_at: string | null }
  logs: Log[]; page: number; total: number; total_pages: number; stats: { total: number; ok: number }
}

const FILTERS = [['', 'wl.all'], ['success', 'wl.ok'], ['fail', 'wl.fail']] as const
const pretty = (s: string | null) => { if (!s) return ''; try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s } }

export default function WebhookLogPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const status = sp.get('status') ?? ''
  const page = Number(sp.get('page')) || 1
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => { document.title = `${t('wl.docTitle')} - おはツイKeeper` }, [])
  useEffect(() => {
    setData(null); setError('')
    fetch(`/app-api/settings/webhooks/${id}/logs?status=${status}&page=${page}`, { credentials: 'include' })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(r.status === 401 ? t('wl.needLogin') : d.error || t('wl.fetchFail')); return d })
      .then(setData).catch((e) => setError(friendlyError(e)))
  }, [id, status, page])

  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n) }
  const ok = (c: number | null) => c != null && c >= 200 && c < 300

  return (
    <div className="dash-scope text-d-text">
      <div className="mx-auto max-w-4xl px-5 py-12">
        {error && <p className="py-16 text-center text-red-400">{error}</p>}
        {!data && !error && <PageLoader />}
        {data && (
          <>
            <div className="mt-5" />
            <PageHeader icon={Webhook} title={<>{data.webhook.name || 'Webhook'} <Badge variant={data.webhook.is_active ? 'default' : 'secondary'}>{data.webhook.is_active ? t('st.active') : t('wl.inactive')}</Badge></>} desc={<span className="break-all text-xs">{data.webhook.url}</span>} />

            <dl className="mt-6 grid grid-cols-2 gap-y-4 border-y border-d-border py-5 md:grid-cols-4 md:divide-x md:divide-d-border">
              {[['wl.sent', data.stats.total.toLocaleString()], ['wl.ok', data.stats.ok.toLocaleString()],
                ['wl.rate', data.stats.total ? `${Math.round((data.stats.ok / data.stats.total) * 100)}%` : '—'],
                ['wl.last', data.webhook.last_triggered_at?.slice(0, 16) ?? '—']].map(([l, v], i) => (
                <div key={l} className={i ? 'md:px-6' : ''}><dt className="text-[11px] uppercase tracking-wider text-d-text3">{t(l)}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-d-text3">{t('wl.events')}{data.webhook.events.join(', ') || '—'}</p>

            <h2 className="mt-8 mb-3 font-bold">{t('st.log')}</h2>
            <FacetedFilterBar shown={data.total} facets={[{
              key: 'status', label: t('wl.result'), value: status || 'all', onChange: v => set('status', v === 'all' ? '' : v),
              options: FILTERS.map(([value, label]) => ({ value: value || 'all', label: t(label) })),
            }]} total={data.total} />

            <ul className="mt-3 divide-y divide-d-border border-y border-d-border">
              {data.logs.length === 0 && <li className="py-10 text-center text-d-text3">{t('wl.empty')}</li>}
              {data.logs.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} className="flex w-full items-center gap-3 py-3 text-left text-sm">
                    <span className={`w-12 shrink-0 font-bold tabular-nums ${ok(l.status_code) ? 'text-green-400' : 'text-red-400'}`}>{l.status_code ?? 'ERR'}</span>
                    <span className="min-w-0 flex-1 truncate">{l.event}</span>
                    <span className="shrink-0 text-xs text-d-text3">{l.duration_ms != null ? `${l.duration_ms}ms` : ''}</span>
                    <span className="shrink-0 text-xs text-d-text3">{l.triggered_at?.slice(0, 19)}</span>
                    <i className={`bx bx-chevron-down shrink-0 text-d-text3 transition-transform ${open === l.id ? 'rotate-180' : ''}`} />
                  </button>
                  {open === l.id && (
                    <div className="grid gap-3 pb-4 md:grid-cols-2">
                      {[['wl.req', l.payload], ['wl.res', l.response_body]].map(([tl, b]) => (
                        <div key={tl as string}><div className="mb-1 text-[11px] uppercase tracking-wider text-d-text3">{t(tl as string)}</div>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-d-border bg-d-med p-3 text-xs">{pretty(b as string | null) || t('wl.nothing')}</pre></div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {data.total_pages > 1 && (
              <div className="mt-5 flex justify-center">
                <Pagination page={page} pageCount={data.total_pages} onPageChange={(n) => set('page', String(n))} label={t('wl.pager')} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
