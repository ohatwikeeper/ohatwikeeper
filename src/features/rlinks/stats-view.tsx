import { useTranslation } from 'react-i18next'
import { Flag } from '@/components/ui/flag'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'

// 短縮リンクの解析の本体。持ち主の詳細画面と共有ページで使う。届いた項目だけを描く
export interface Item { name: string; count: number; flag?: string; region?: string | null }
export interface Stats {
  link: { slug: string; short_url: string; title?: string | null; original_url?: string; created_at?: string; tags?: string[]; utm?: Record<string, string> }
  totals?: { clicks?: number; logged?: number; unique?: number; bots?: number; humans?: number; today?: number; week?: number; first_at?: string | null; last_at?: string | null }
  timeline?: { date: string; count: number }[]; dow?: number[]; hour?: number[]
  referrers?: Item[]; countries?: Item[]; cities?: Item[]; browsers?: Item[]; os?: Item[]; devices?: Item[]; languages?: Item[]; ab?: Item[]
  regions?: Item[]; browser_versions?: Item[]; os_versions?: Item[]; isp?: Item[]; bot_agents?: Item[]; recent?: Visit[]
}
export interface Visit {
  accessed_at: string; country: string; cc: string; flag: string; region?: string; city?: string; browser: string; browser_version: string
  os: string; os_version: string; device: string; language: string; ref_domain: string; ab_variant: string; is_bot?: boolean
}

// DB の日時は JST の 'YYYY-MM-DD HH:MM:SS' か ISO で届く
const toDate = (v: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : v.replace(' ', 'T') + '+09:00')
const when = (v?: string | null) => (v ? toDate(v).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

const ACCENT = 'var(--color-d-accent, #6dcbf7)'
const tip = { contentStyle: { background: '#0e1013', border: '1px solid rgb(255 255 255 / .12)', borderRadius: 8, fontSize: 12 }, cursor: { fill: 'rgb(255 255 255 / .05)' } }
const axis = { stroke: 'rgb(255 255 255 / .35)', fontSize: 11, tickLine: false, axisLine: false } as const

function Breakdown({ title, items }: { title: string; items: Item[] }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...items.map((i) => i.count))
  const sum = items.reduce((a, b) => a + b.count, 0) || 1
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-d-text3">{title}</h3>
      {items.length === 0 ? <p className="py-3 text-sm text-d-text3">{t('rl.noData')}</p> : (
        <ul className="divide-y divide-d-border/60 border-y border-d-border/60">
          {items.map((i) => (
            <li key={`${i.name}-${i.region ?? ''}-${i.flag ?? ''}`} className="relative flex items-center justify-between gap-3 py-2 text-sm">
              <span className="absolute inset-y-1 left-0 -z-0 rounded bg-d-med" style={{ width: `${(i.count / max) * 100}%` }} />
              <span className="relative min-w-0 truncate">
                <Flag emoji={i.flag} className="mr-1.5" />
                {i.name}
                {i.region && i.region !== i.name && <span className="ml-1.5 text-xs text-d-text3">{i.region}</span>}
              </span>
              <span className="relative shrink-0 tabular-nums text-d-text2">{i.count.toLocaleString()} <span className="text-xs text-d-text3">({Math.round((i.count / sum) * 100)}%)</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function StatsView({ d }: { d: Stats }) {
  const { t } = useTranslation()
  const DOW = [1, 2, 3, 4, 5, 6, 0].map((w) => t('rc.wdays').split(',')[w] ?? '')
  const tot = d.totals
  const kpis: [string, number][] = tot ? ([
    [t('rl.dClicks'), tot.clicks], [t('rl.dLogged'), tot.logged], [t('rl.dUnique'), tot.unique],
    [t('rs.dHumans'), tot.humans], [t('rl.dBots'), tot.bots],
  ].filter(([, v]) => typeof v === 'number') as [string, number][]) : []
  const moments: [string, string][] = tot ? ([
    [t('rs.dToday'), tot.today?.toLocaleString()], [t('rs.dWeek'), tot.week?.toLocaleString()],
    [t('rs.dFirst'), tot.first_at !== undefined ? when(tot.first_at) : undefined], [t('rs.dLast'), tot.last_at !== undefined ? when(tot.last_at) : undefined],
  ].filter(([, v]) => v !== undefined) as [string, string][]) : []
  const lists: [string, Item[] | undefined][] = [
    [t('rl.dRef'), d.referrers], [t('rl.dCountry'), d.countries], [t('rs.dRegions'), d.regions], [t('rs.f.cities'), d.cities],
    [t('rl.dBrowser'), d.browsers], [t('rs.dBrowserV'), d.browser_versions], ['OS', d.os], [t('rs.dOsV'), d.os_versions],
    [t('rl.cDevice'), d.devices], [t('rl.dLang'), d.languages], [t('rs.f.isp'), d.isp],
    [t('rs.f.ab'), d.ab?.length ? d.ab : undefined], [t('rs.dBotUa'), d.bot_agents],
  ]
  const shown = lists.filter(([, v]) => v) as [string, Item[]][]
  const utm = d.link.utm ? Object.entries(d.link.utm) : []
  return (
    <>
      {kpis.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-y-4 border-y border-d-border py-5 md:auto-cols-fr md:grid-flow-col md:divide-x md:divide-d-border">
          {kpis.map(([l, v], i) => (
            <div key={l} className={i ? 'md:px-6' : 'md:pr-6'}><dt className="text-[11px] uppercase tracking-wider text-d-text3">{l}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{v.toLocaleString()}</dd></div>
          ))}
        </dl>
      )}
      {moments.length > 0 && (
        <dl className="grid grid-cols-2 gap-y-3 border-b border-d-border py-4 md:auto-cols-fr md:grid-flow-col md:divide-x md:divide-d-border">
          {moments.map(([l, v], i) => (
            <div key={l} className={i ? 'md:px-6' : 'md:pr-6'}><dt className="text-[11px] uppercase tracking-wider text-d-text3">{l}</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      )}

      {(d.link.tags?.length || utm.length) ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          {d.link.tags?.map((g) => <span key={g} className="inline-flex h-6 items-center rounded-full border border-d-border px-2.5 leading-5 text-d-text2">#{g}</span>)}
          {utm.map(([k, v]) => <span key={k} className="inline-flex h-6 items-center rounded-full bg-d-med px-2.5 font-mono leading-5 text-d-text2">{k}={v}</span>)}
        </div>
      ) : null}

      {d.timeline && (
        <section className="mt-8">
          <h2 className="mb-3 font-bold">{t('rl.d30')}</h2>
          <div className="h-56"><ResponsiveContainer>
            <AreaChart data={d.timeline}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6dcbf7" stopOpacity={0.35} /><stop offset="100%" stopColor="#6dcbf7" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="rgb(255 255 255 / .06)" vertical={false} />
              <XAxis dataKey="date" {...axis} tickFormatter={(v: string) => v.slice(5)} interval={4} />
              <YAxis {...axis} allowDecimals={false} width={28} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="count" name={t('rl.dClick')} stroke="#6dcbf7" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer></div>
        </section>
      )}

      {(d.dow || d.hour) && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {d.dow && (
            <section>
              <h2 className="mb-3 font-bold">{t('rl.dDow')}</h2>
              <div className="h-40"><ResponsiveContainer><BarChart data={d.dow.map((n, i) => ({ k: DOW[i], n }))}><XAxis dataKey="k" {...axis} /><YAxis {...axis} allowDecimals={false} width={28} /><Tooltip {...tip} /><Bar dataKey="n" name={t('rl.dClick')} fill={ACCENT} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </section>
          )}
          {d.hour && (
            <section>
              <h2 className="mb-3 font-bold">{t('rl.dHour')}</h2>
              <div className="h-40"><ResponsiveContainer><BarChart data={d.hour.map((n, h) => ({ k: h, n }))}><XAxis dataKey="k" {...axis} interval={2} /><YAxis {...axis} allowDecimals={false} width={28} /><Tooltip {...tip} /><Bar dataKey="n" name={t('rl.dClick')} fill={ACCENT} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </section>
          )}
        </div>
      )}

      {shown.length > 0 && (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {shown.map(([title, items]) => <Breakdown key={title} title={title} items={items} />)}
        </div>
      )}
      {d.recent && <Recent rows={d.recent} />}
      <p className="mt-8 text-xs text-pretty text-d-text3">{t('rs.botNote')}</p>
    </>
  )
}

function Recent({ rows }: { rows: Visit[] }) {
  const { t } = useTranslation()
  const cols = [t('rs.cTime'), t('rs.cPlace'), t('rs.cEnv'), t('rs.cRef'), t('rs.cLang')]
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-bold">{t('rs.f.recent')}</h2>
      {rows.length === 0 ? <p className="py-3 text-sm text-d-text3">{t('rl.noData')}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-d-border text-xs text-d-text3">{cols.map((c) => <th key={c} className="py-2 pr-4 font-medium">{c}</th>)}</tr></thead>
            <tbody className="divide-y divide-d-border/60">
              {rows.map((r, i) => (
                <tr key={i} className={r.is_bot ? 'text-d-text3' : ''}>
                  <td className="whitespace-nowrap py-2 pr-4 tabular-nums">{when(r.accessed_at)}</td>
                  <td className="py-2 pr-4">
                    <Flag emoji={r.flag} className="mr-1.5" />
                    {[r.city, r.region, r.country].filter((x, j, a) => x && a.indexOf(x) === j).join(', ') || '-'}
                  </td>
                  <td className="py-2 pr-4">
                    {[`${r.browser} ${r.browser_version}`.trim(), `${r.os} ${r.os_version}`.trim(), r.device].filter((x) => x && x !== 'Other').join(' · ') || '-'}
                    {r.is_bot && <span className="ml-2 inline-flex h-5 items-center rounded-full border border-d-border px-2 text-[11px] leading-4">{t('rs.bot')}</span>}
                  </td>
                  <td className="max-w-48 truncate py-2 pr-4">{r.ref_domain || t('rs.direct')}</td>
                  <td className="py-2">{r.language || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
