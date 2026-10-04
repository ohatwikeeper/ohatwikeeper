import { PageLoader } from '@/components/ui/page-loader'
import { useTranslation } from 'react-i18next'
import { Link2 } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'

interface Item { name: string; count: number }
interface Stats {
  link: { slug: string; title: string | null; original_url: string; created_at: string; use_count: number }
  totals: { clicks: number; logged: number; bots: number; unique: number }
  timeline: { date: string; count: number }[]; dow: number[]; hour: number[]
  browsers: Item[]; os: Item[]; devices: Item[]; countries: Item[]; languages: Item[]; referrers: Item[]
}

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
            <li key={i.name} className="relative flex items-center justify-between gap-3 py-2 text-sm">
              <span className="absolute inset-y-1 left-0 -z-0 rounded bg-d-med" style={{ width: `${(i.count / max) * 100}%` }} />
              <span className="relative min-w-0 truncate">{i.name}</span>
              <span className="relative shrink-0 tabular-nums text-d-text2">{i.count.toLocaleString()} <span className="text-xs text-d-text3">({Math.round((i.count / sum) * 100)}%)</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function RLinkDetailPage({ slug: slugProp }: { slug?: string } = {}) {
  const { t } = useTranslation()
  const params = useParams()
  const slug = slugProp ?? params.slug
  const embedded = !!slugProp
  const [d, setD] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (!embedded) document.title = t('rl.docDetail') }, [embedded])
  useEffect(() => {
    fetch(`/app-api/r-links/${slug}/stats`, { credentials: 'include' })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(r.status === 401 ? t('rl.needLogin') : j.message || j.error || t('rl.getFail')); return j })
      .then(setD).catch((e) => setError(friendlyError(e)))
  }, [slug])

  const DOW = [1, 2, 3, 4, 5, 6, 0].map((w) => t('rc.wdays').split(',')[w] ?? '')
  return (
    <div className="dash-scope text-d-text">
      <div className={'mx-auto max-w-5xl px-5 py-8'}>
        {error && <p className="py-16 text-center text-red-400">{error}</p>}
        {!d && !error && <PageLoader />}
        {d && (
          <>
            <div className="mt-5" />
            <PageHeader icon={Link2} title={d.link.title || d.link.slug} desc={<>go.ohax.pw/{d.link.slug} → <span className="break-all text-d-text3">{d.link.original_url}</span></>} />

            <dl className="mt-6 grid grid-cols-2 gap-y-4 border-y border-d-border py-5 md:grid-cols-4 md:divide-x md:divide-d-border">
              {[[t('rl.dClicks'), d.totals.clicks], [t('rl.dLogged'), d.totals.logged], [t('rl.dUnique'), d.totals.unique], [t('rl.dBots'), d.totals.bots]].map(([l, v], i) => (
                <div key={l as string} className={i ? 'md:px-6' : ''}><dt className="text-[11px] uppercase tracking-wider text-d-text3">{l}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{(v as number).toLocaleString()}</dd></div>
              ))}
            </dl>

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

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <section>
                <h2 className="mb-3 font-bold">{t('rl.dDow')}</h2>
                <div className="h-40"><ResponsiveContainer><BarChart data={d.dow.map((n, i) => ({ k: DOW[i], n }))}><XAxis dataKey="k" {...axis} /><YAxis {...axis} allowDecimals={false} width={28} /><Tooltip {...tip} /><Bar dataKey="n" name={t('rl.dClick')} fill={ACCENT} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </section>
              <section>
                <h2 className="mb-3 font-bold">{t('rl.dHour')}</h2>
                <div className="h-40"><ResponsiveContainer><BarChart data={d.hour.map((n, h) => ({ k: h, n }))}><XAxis dataKey="k" {...axis} interval={2} /><YAxis {...axis} allowDecimals={false} width={28} /><Tooltip {...tip} /><Bar dataKey="n" name={t('rl.dClick')} fill={ACCENT} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </section>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <Breakdown title={t('rl.dRef')} items={d.referrers} />
              <Breakdown title={t('rl.dCountry')} items={d.countries} />
              <Breakdown title={t('rl.dBrowser')} items={d.browsers} />
              <Breakdown title="OS" items={d.os} />
              <Breakdown title={t('rl.cDevice')} items={d.devices} />
              <Breakdown title={t('rl.dLang')} items={d.languages} />
            </div>
            <p className="mt-8 text-xs text-d-text3">{t('rl.dNote')}</p>
          </>
        )}
      </div>
    </div>
  )
}
