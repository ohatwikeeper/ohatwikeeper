import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Badge, RecordItem, Stats } from '@/lib/dashboard/types'

import { fmt } from '@/lib/dashboard/format'
import Callout from '@/components/dashboard-ui/Callout'

interface Cell { label: string; value: string; note?: string; error?: boolean }

export function StreakHero({ stats }: { stats: Stats; records: RecordItem[] }) {
  const { t } = useTranslation()
  return (
    <section id="streak-hero" className="mb-12 mt-10">
      <div className="font-mono text-[11px] uppercase tracking-wider text-d-text3">Current streak</div>
      <div className="mt-2 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div className="text-[8rem] font-semibold leading-[0.85] tracking-[-0.06em] tabular-nums max-sm:text-[5.5rem]">
          {stats.current_consecutive_streak}<span className="ml-2 text-3xl tracking-normal text-d-text3">{t('rc.dayU')}</span>
        </div>
        <dl className="flex gap-8 pb-2 text-sm">
          <div><dt className="text-xs text-d-text3">{t('rc.longest')}</dt><dd className="text-lg font-medium tabular-nums">{t('rc.nDays', { n: stats.max_streak })}</dd></div>
          <div><dt className="text-xs text-d-text3">{t('rc.sum')}</dt><dd className="text-lg font-medium tabular-nums">{t('rc.nU', { n: fmt(stats.total_records) })}</dd></div>
          <div><dt className="text-xs text-d-text3">{t('rc.rate')}</dt><dd className="text-lg font-medium tabular-nums">{stats.coverage_rate}%</dd></div>
        </dl>
      </div>
    </section>
  )
}

export default function SummaryStats({ stats, onUpdateAll, updating }: { stats: Stats; onUpdateAll?: () => void; updating?: boolean }) {
  const { t } = useTranslation()
  const has = stats.total_records > 0
  const err = stats.has_metrics_error
  const cells: Cell[] = [
    { label: t('rc.totalOha'), value: fmt(stats.total_records), note: has ? t('rc.rateNote', { r: stats.coverage_rate, d: stats.non_posted_days }) : undefined },
    { label: t('rc.totLikes'), value: fmt(stats.total_likes), note: has ? t('rc.avg', { n: stats.avg_likes }) : undefined, error: err },
    { label: t('rc.totReposts'), value: fmt(stats.total_reposts), note: has ? t('rc.avg', { n: stats.avg_reposts }) : undefined, error: err },
    { label: t('rc.totViews'), value: fmt(stats.total_views), note: has ? t('rc.avg', { n: stats.avg_views }) : undefined },
    { label: t('rc.totReplies'), value: fmt(stats.total_replies), note: has ? t('rc.avg', { n: stats.avg_replies }) : undefined, error: err },
    { label: t('rc.first'), value: stats.first_post_date ?? '—' },
    { label: t('rc.avgTime'), value: stats.predicted_post_time ? t('rc.aroundT', { t: stats.predicted_post_time }) : '—' },
  ]
  return (
    <section className="mb-12 mt-10">
      <dl className="summary-stats grid grid-cols-2 sm:grid-cols-3 [&>div:last-child:nth-child(2n+1)]:max-sm:col-span-2 sm:[&>div:last-child:nth-child(3n+1)]:col-span-3 sm:[&>div:last-child:nth-child(3n+2)]:col-span-2 gap-px overflow-hidden rounded-2xl border border-d-border bg-d-border max-md:grid-cols-2 max-md:[&>div:last-child]:col-span-2">
        {cells.map((c) => (
          <div key={c.label} className="min-w-0 bg-d-bg p-4 sm:p-5">
            <dt className="truncate font-mono text-[11px] uppercase tracking-wider text-d-text3">{c.label}</dt>
            <dd className={`mt-2 text-[1.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:mt-3 sm:text-[2rem] ${c.error ? 'text-d-danger' : 'text-d-text'}`}>
              {c.value}
            </dd>
            {c.note && <div className="mt-1 truncate text-xs text-d-text3">{c.note}</div>}
          </div>
        ))}
      </dl>
      {err && (
        <Callout
          className="mt-3"
          action={onUpdateAll ? { label: t('rc.updateAll'), icon: 'bx-sync', onClick: onUpdateAll, busy: updating } : undefined}
        >
          <span className="font-medium text-d-danger">{t('rc.redNote1')}</span>{t('rc.redNote2')}
        </Callout>
      )}
    </section>
  )
}

export function BadgeList({ badges, publicUuid, onOpenAwards }: { badges: Badge[]; publicUuid: string; onOpenAwards?: () => void }) {
  const { t } = useTranslation()
  if (!badges.length) return null
  return (
    <section className="mb-12 mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-d-text3">Achievements · {badges.length}</h2>
        {onOpenAwards
          ? <button type="button" onClick={onOpenAwards} className="text-xs text-d-text2 hover:text-d-text">{t('rc.seeAwards')}</button>
          : <Link to={`/${publicUuid}/awards`} className="text-xs !text-d-text2 hover:!text-d-text">{t('rc.awardsPage')}</Link>}
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b.label} className="rounded-full border border-d-border px-3 py-1 text-sm text-d-text2">{b.label}</span>
        ))}
      </div>
    </section>
  )
}
