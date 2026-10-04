import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { ChipGroup } from '@/components/arc/chip-group/chip-group'
import { PageLoader } from '@/components/ui/page-loader'
import { Trophy } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CopyButton } from '@/components/ui/copy-button'
import { NumberTicker } from '@/components/motion/number-ticker'
import { ScrollReveal } from '@/components/motion/scroll-reveal'
import { TiltCard } from '@/components/motion/tilt-card'
import { fmt } from '@/lib/dashboard/format'
import Tip from '@/components/dashboard-ui/Tip'
import { makeMilestoneImage } from '@/lib/milestoneImage'
import { toast } from '@/lib/toast'
import ShareButton from '@/features/share/ShareButton'
import { Gauge } from '@/components/arc/gauge/gauge'
import {
  allTimeBest, goalFor, MILESTONES, metaOf, msTitle, msMessage, monthlyBest,
  type AwardRecord, type AwardsData, type BestSet, type MetricKey,
} from '@/features/awards/awards'

const shortX = (url: string) => {
  const id = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)?.[1]
  return id ? `https://x.ohax.pw/${id}` : url
}
const dateLabel = (d: string) => {
  const t = new Date(d.replace(' ', 'T'))
  return `${t.getFullYear()}/${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

const BEST_DEFS = [
  { key: 'best_likes', title: 'awd.bestLikes', metricLabel: 'awd.mLikes', icon: 'bxs-heart', color: '#ec4899', get: (r: AwardRecord) => r.likes },
  { key: 'best_views', title: 'awd.bestViews', metricLabel: 'awd.mViews', icon: 'bxs-show', color: '#0ea5e9', get: (r: AwardRecord) => r.views },
  { key: 'best_reposts', title: 'awd.bestReposts', metricLabel: 'awd.mReposts', icon: 'bx-repost', color: '#22c55e', get: (r: AwardRecord) => r.reposts },
  { key: 'best_replies', title: 'awd.bestReplies', metricLabel: 'awd.mReplies', icon: 'bxs-message-rounded-dots', color: '#f97316', get: (r: AwardRecord) => r.replies },
  { key: 'best_engagement', title: 'awd.bestEng', metricLabel: 'awd.mEng', icon: 'bx-trending-up', color: '#a855f7', get: (r: AwardRecord) => r.engagement_rate, rate: true },
] as const

function AwardCard({ def, record, delay }: { def: (typeof BEST_DEFS)[number]; record: AwardRecord | null; delay: number }) {
  const { t } = useTranslation()
  if (!record) return null
  const v = def.get(record)
  const value = 'rate' in def && def.rate ? `${v.toFixed(2)}%` : fmt(v)
  return (
    <ScrollReveal y={20} delay={delay} duration={0.5}>
      <TiltCard max={5} className="h-full rounded-2xl">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-d-border bg-d-med">
          <div className="relative flex items-center gap-3 border-b border-d-border px-5 py-4">
            <div className="pointer-events-none absolute -left-4 -top-4 size-20 rounded-full opacity-25 blur-2xl" style={{ background: def.color }} />
            <div className="grid size-10 shrink-0 place-items-center rounded-full text-white" style={{ background: def.color }}>
              <i className={`bx ${def.icon} text-lg`} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-d-text">{t(def.title)}</h3>
              <div className="text-lg font-bold tabular-nums" style={{ color: def.color }}>{value}</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            {record.image_url && <img src={record.image_url} loading="lazy" alt="" className="max-h-56 w-full rounded-lg object-cover" />}
            <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-d-text2">{record.text}</p>
          </div>
          <div className="flex items-center justify-between border-t border-d-border bg-d-bg px-5 py-3 text-xs text-d-text3">
            <span>{dateLabel(record.date)}</span>
            <div className="flex items-center gap-1">
              <Tip label={t('awd.openX')}>
                <a href={record.url} target="_blank" rel="noopener" className="grid size-8 place-items-center rounded-full !text-d-text2 hover:!text-d-text"><i className="bx bx-link-external" /></a>
              </Tip>
              <CopyButton content={shortX(record.url)} variant="ghost" className="size-8 rounded-full" />
            </div>
          </div>
        </div>
      </TiltCard>
    </ScrollReveal>
  )
}

function BestGrid({ best }: { best: BestSet }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 max-sm:grid-cols-1">
      {BEST_DEFS.map((def, i) => (
        <AwardCard key={def.key} def={def} record={best[def.key]} delay={i * 0.05} />
      ))}
    </div>
  )
}

function GoalRing({ metric, value }: { metric: MetricKey; value: number }) {
  const { t } = useTranslation()
  const { next, progress, remaining } = goalFor(metric, value)
  const meta = metaOf(metric)
  return (
    <div className="rounded-2xl border border-d-border bg-d-med p-5">
      <Gauge
        value={next ? progress : 100}
        label={t('awd.nextGoal', { m: meta.label })}
        detail={next ? t('awd.goalDetail', { title: msTitle(metric, next), rem: fmt(remaining), unit: meta.unit, v: fmt(value), th: fmt(next.threshold) }) : t('awd.allDone', { v: fmt(value), unit: meta.unit })}
      />
    </div>
  )
}

async function shareMilestone(ms: { title: string; message: string; icon: string; color: string; threshold: number }, metric: MetricKey) {
  try {
    const meta = metaOf(metric)
    const blob = await makeMilestoneImage({ title: msTitle(metric, ms), detail: `${fmt(ms.threshold)}${meta.unit}`, color: ms.color, metric: meta.label })
    const file = new File([blob], `ohatwi-${metric}-${ms.threshold}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: i18n.t('awd.shareText', { title: msTitle(metric, ms) }) }); return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast.success(i18n.t('awd.saved'))
  } catch (e) { if ((e as Error)?.name !== 'AbortError') toast.error(i18n.t('awd.imgFail')) }
}

function MilestoneTabs({ values }: { values: Record<MetricKey, number> }) {
  const { t } = useTranslation()
  const keys = Object.keys(MILESTONES) as MetricKey[]
  const [tab, setTab] = useState<MetricKey>('streak')
  const [all, setAll] = useState(false)
  const LIMIT = 5
  const list = MILESTONES[tab]
  const shown = all ? list : list.slice(0, LIMIT)
  return (
    <div>
      <div className="mb-4">
        <ChipGroup label={t('awd.kind')} multiple={false} value={[tab]}
          onValueChange={(v) => { setTab((v[0] ?? tab) as MetricKey); setAll(false) }}
          options={keys.map((k) => ({ value: k, label: `${metaOf(k).label} ${MILESTONES[k].filter((ms) => values[k] >= ms.threshold).length}/${MILESTONES[k].length}` }))} />
      </div>
      <ul className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {shown.map((ms, i) => {
          const achieved = values[tab] >= ms.threshold
          return (
            <motion.li key={ms.threshold}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className={`flex items-center gap-4 rounded-2xl border bg-[var(--surface-raised)] px-4 py-3 ${achieved ? 'border-[var(--arc-border)]' : 'border-dashed border-[var(--arc-border)] opacity-45'}`}>
              <div className="grid size-10 shrink-0 place-items-center rounded-full text-white" style={{ background: achieved ? ms.color : 'var(--d-light)' }}>
                <i className={`bx ${ms.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-d-text">{msTitle(tab, ms)}</div>
                <div className="text-xs text-d-text3">{fmt(ms.threshold)}{metaOf(tab).unit}</div>
              </div>
              {achieved && (
                <Tip label={t('awd.saveImg')}>
                  <button type="button" aria-label={t('awd.saveImg')} onClick={() => shareMilestone(ms, tab)} className="grid size-8 cursor-pointer place-items-center rounded-full text-d-text2 hover:text-d-text">
                    <i className="bx bx-share-alt text-lg" />
                  </button>
                </Tip>
              )}
              <i className={`bx text-xl ${achieved ? 'bxs-check-circle text-[#22c55e]' : 'bx-circle text-d-text3'}`} />
            </motion.li>
          )
        })}
      </ul>
      {list.length > LIMIT && (
        <button type="button" onClick={() => setAll(v => !v)} className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 text-sm text-d-text2 hover:text-d-text">
          {all ? t('awd.close') : t('awd.showAll', { n: list.length })}<i className={`bx ${all ? 'bx-chevron-up' : 'bx-chevron-down'} text-lg`} />
        </button>
      )}
    </div>
  )
}

const SectionTitle = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-d-text">
    <span className="grid size-7 place-items-center rounded-lg bg-d-accent/15 text-d-accent"><i className={`bx ${icon} text-base`} /></span>{children}
  </h2>
)

const KPI = [
  { key: 'posts', label: 'awd.kPosts', icon: 'bx-calendar-check', color: '#38bdf8' },
  { key: 'current_streak', label: 'awd.kStreak', icon: 'bx-flame', color: '#f97316' },
  { key: 'max_streak', label: 'awd.kMax', icon: 'bxs-trophy', color: '#eab308' },
  { key: 'likes', label: 'awd.kLikes', icon: 'bxs-heart', color: '#ec4899' },
] as const

export default function AwardsView({ uuid }: { uuid: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<AwardsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setData(null); setError(null)
    fetch(`/app-api/view/awards-data/?uuid=${encodeURIComponent(uuid)}`)
      .then((r) => r.json())
      .then((d: AwardsData & { error?: string }) => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError(t('awd.fetchFail')))
  }, [uuid])

  const derived = useMemo(() => {
    if (!data || !data.is_public) return null
    const values: Record<MetricKey, number> = {
      streak: data.totals.max_streak, posts: data.totals.posts, likes: data.totals.likes,
      views: data.totals.views, reposts: data.totals.reposts, replies: data.totals.replies,
    }
    let celebration: { k: MetricKey; value: number; ms: NonNullable<ReturnType<typeof goalFor>['achieved']> } | null = null
    for (const k of ['streak', 'posts', 'likes'] as const) {
      const a = goalFor(k, values[k]).achieved
      if (a && (!celebration || a.threshold > celebration.ms.threshold)) celebration = { k, value: values[k], ms: a }
    }
    return { values, celebration, allTime: allTimeBest(data.records), monthly: monthlyBest(data.records) }
  }, [data])

  if (error) return <div className="grid min-h-[40vh] place-items-center px-4 text-center"><div className="max-w-md rounded-2xl border border-d-border bg-d-med p-8"><i className="bx bx-error-circle mb-3 text-4xl text-d-text3" /><p className="text-d-text2">{error}</p></div></div>
  if (!data || !derived) return <PageLoader />

  const { totals } = data
  const { values, celebration, allTime, monthly } = derived
  const kpiVal: Record<string, number> = { posts: totals.posts, current_streak: totals.current_streak, max_streak: totals.max_streak, likes: totals.likes }

  return (
    <>
      <PageHeader icon={Trophy} title={t('awd.title')} right={<ShareButton targetRef={posterRef} filename="ohatwi-awards.png" title={t('awd.shareTitle')} />} />

      {/* 共有用ポスター領域(KPI+祝福) */}
      <div ref={posterRef} className="rounded-2xl">
      {/* KPI */}
      <div className="mb-12 grid grid-cols-4 gap-3 max-sm:grid-cols-2">
        {KPI.map((k, i) => (
          <ScrollReveal key={k.key} y={16} delay={i * 0.06} duration={0.5}>
            <div className="relative overflow-hidden rounded-2xl border border-[var(--arc-border)] bg-[var(--surface-raised)] p-5 transition-colors hover:border-d-accent/40">
              <div className="pointer-events-none absolute -right-5 -top-5 size-20 rounded-full opacity-20 blur-2xl" style={{ background: k.color }} />
              <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${k.color}26` }}><i className={`bx ${k.icon} text-lg`} style={{ color: k.color }} /></span>
              <div className="mt-2 text-[1.75rem] font-bold tabular-nums text-d-text"><NumberTicker value={kpiVal[k.key]} locale /></div>
              <div className="mt-1 text-xs text-d-text3">{t(k.label)}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {celebration && (
        <ScrollReveal y={20} duration={0.6}>
          <section className="relative mb-10 overflow-hidden rounded-3xl border-2 border-d-accent bg-gradient-to-br from-d-accent/15 via-d-med to-d-med px-6 py-10 text-center">
            {[...Array(6)].map((_, i) => (
              <motion.i key={i} className="bx bxs-star pointer-events-none absolute text-d-accent/40"
                style={{ left: `${12 + i * 14}%`, top: i % 2 ? '18%' : '68%', fontSize: `${10 + (i % 3) * 6}px` }}
                animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }} />
            ))}
            <motion.div className="mb-3 text-6xl" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
              <i className={`bx ${celebration.ms.icon}`} style={{ color: celebration.ms.color }} />
            </motion.div>
            <div className="text-xl font-bold text-d-text">{msTitle(celebration.k, celebration.ms)}</div>
            <div className="mt-1 text-d-text2">{msMessage(celebration.k, celebration.ms)}</div>
            <div className="mt-3 text-5xl font-extrabold tabular-nums text-d-accent"><NumberTicker value={celebration.value} locale /></div>
          </section>
        </ScrollReveal>
      )}
      </div>

      <section className="mb-12">
        <SectionTitle icon="bx-target-lock">{t('awd.hNext')}</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 max-sm:grid-cols-1">
          <GoalRing metric="streak" value={values.streak} />
          <GoalRing metric="posts" value={values.posts} />
          <GoalRing metric="likes" value={values.likes} />
        </div>
      </section>

      <section className="mb-12">
        <SectionTitle icon="bx-list-check">{t('awd.hAll')}</SectionTitle>
        <MilestoneTabs values={values} />
      </section>

      <section className="mb-12">
        <SectionTitle icon="bx-crown">{t('awd.hBest')}</SectionTitle>
        <BestGrid best={allTime} />
      </section>

      {monthly.length > 0 && (
        <section className="mb-12">
          <SectionTitle icon="bx-calendar">{t('awd.hMonth')}</SectionTitle>
          <MonthlyCalendar months={monthly} />
        </section>
      )}
    </>
  )
}

function MonthlyCalendar({ months }: { months: { month: string; best: BestSet }[] }) {
  const { t } = useTranslation()
  const [i, setI] = useState(0) // 0 = 最新月
  const { month, best } = months[i]
  const [y, mo] = month.split('-')
  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-2">
        <Tip label={t('awd.older')}>
          <button aria-label={t('awd.older')} disabled={i >= months.length - 1} onClick={() => setI((v) => v + 1)}
            className="grid size-9 place-items-center rounded-full border border-d-border text-d-text2 hover:text-d-text disabled:cursor-not-allowed disabled:opacity-40">
            <i className="bx bx-chevron-left text-xl" />
          </button>
        </Tip>
        <AnimatePresence mode="wait">
          <motion.div key={month} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="min-w-[150px] text-center">
            <div className="text-lg font-bold tabular-nums text-d-text">{t('awd.ym', { y, m: Number(mo) })}</div>
            <div className="text-xs text-d-text3">{i + 1} / {months.length}</div>
          </motion.div>
        </AnimatePresence>
        <Tip label={t('awd.newer')}>
          <button aria-label={t('awd.newer')} disabled={i <= 0} onClick={() => setI((v) => v - 1)}
            className="grid size-9 place-items-center rounded-full border border-d-border text-d-text2 hover:text-d-text disabled:cursor-not-allowed disabled:opacity-40">
            <i className="bx bx-chevron-right text-xl" />
          </button>
        </Tip>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <BestGrid best={best} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
