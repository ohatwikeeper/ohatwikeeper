import RankTable, { type RankCol, type RankRow } from '@/components/dashboard-ui/RankTable'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import type { DateRange } from 'react-day-picker'
'use client'

import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { friendlyError } from '@/lib/dashboard/api'
import { CONFIG } from '@/lib/config'
import { Eye, FileText, Flame, Heart, Star, Trophy, type LucideIcon } from 'lucide-react'

// Types
interface UserInfo {
  id: string
  public_uuid: string
  name: string
  screen_name: string
  avatar_url: string | null
}

interface RankingItem {
  id: string
  public_uuid: string
  x_icon: string | null
  author?: string
  total_posts?: number
  total_likes?: number
  total_views?: number
  current_streak?: number
  max_streak?: number
}

interface RankingResponse {
  users?: RankingItem[]
  total_posts: RankingItem[]
  current_streak: RankingItem[]
  max_streak: RankingItem[]
  total_likes: RankingItem[]
  total_views: RankingItem[]

}

// Utility Functions
function parseAuthor(authorJson: string | null): UserInfo | null {
  if (!authorJson) return null
  try {
    return JSON.parse(authorJson)
  } catch {
    return null
  }
}

function getDisplayName(author: UserInfo | null): { name: string; handle: string } {
  if (!author) {
    return { name: i18n.t('rk.unknown'), handle: 'unknown' }
  }
  return {
    name: author.name || author.screen_name || 'Unknown',
    handle: author.screen_name || author.public_uuid,
  }
}


type StatKey = 'total_posts' | 'total_likes' | 'total_views' | 'current_streak' | 'max_streak'
type TabKey = StatKey
const TABS: { key: TabKey; title: string; Icon: LucideIcon; unit: string }[] = [
  { key: 'total_posts', title: '総投稿数', Icon: FileText, unit: '件' },
  { key: 'total_likes', title: '総いいね', Icon: Heart, unit: 'いいね' },
  { key: 'total_views', title: 'インプレッション', Icon: Eye, unit: '表示' },
  { key: 'current_streak', title: '連続投稿', Icon: Flame, unit: '日' },
  { key: 'max_streak', title: '最長記録', Icon: Star, unit: '日' },
]

export default function RankingPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<RankingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tab: TabKey = 'total_posts'
  const [range, setRange] = useState<DateRange | undefined>()
  const [rangeUsers, setRangeUsers] = useState<RankingItem[] | null>(null)
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const preset = (a: number, b = a) => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - a); const e = new Date(t); e.setDate(t.getDate() - b); setRange({ from: f, to: e }) }
  const ranged = !!range?.from
  useEffect(() => {
    if (!range?.from) { setRangeUsers(null); return }
    const q = new URLSearchParams({ from: ymd(range.from), to: ymd(range.to ?? range.from) })
    let alive = true
    setRangeUsers(null)
    fetch(`${CONFIG.API_BASE}/app-api/ranking/range?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(t('rk.fail')))))
      .then((d) => alive && setRangeUsers(d.users ?? []))
      .catch((e) => alive && setError(friendlyError(e)))
    return () => { alive = false }
  }, [range])

  useEffect(() => { document.title = t('rk.doc') }, [])
  useEffect(() => {
    fetch(`${CONFIG.API_BASE}/app-api/ranking/full`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(t('rk.fail')))))
      .then(setData)
      .catch((e) => setError(friendlyError(e)))
  }, [])

  const list = data ? (data[tab] as RankingItem[]).slice(0, 10) : []
  const rows: RankRow[] = (ranged ? (rangeUsers ?? []) : (data?.users ?? list)).map((it) => {
    const { name, handle } = getDisplayName(parseAuthor(it.author || null))
    return {
      key: it.id, href: `/${it.public_uuid}`, avatar: it.x_icon, name, sub: `@${handle}`,
      values: { total_posts: Number(it.total_posts || 0), total_likes: Number(it.total_likes || 0), total_views: Number(it.total_views || 0), current_streak: Number(it.current_streak || 0), max_streak: Number(it.max_streak || 0) },
    }
  })
  const SHORT: Record<string, string> = { total_posts: t('col.posts'), total_likes: t('col.likes'), total_views: t('col.views'), current_streak: t('col.streak'), max_streak: t('col.max') }
  const DESC: Record<string, string> = {
    total_posts: t('tip.posts'),
    total_likes: t('tip.likes'),
    total_views: t('tip.views'),
    current_streak: t('tip.streak'),
    max_streak: ranged ? t('tip.maxRange') : t('tip.max'),
  }
  const cols: RankCol[] = TABS.filter((x) => !(ranged && x.key === 'current_streak')).map((x) => ({ key: x.key, label: SHORT[x.key] ?? x.title, desc: DESC[x.key] }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader icon={Trophy} title={t('ranking.title')} desc={t('ranking.desc')} />

      <div className="mb-6">
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={(v) => { setRange(v);  }} />
          <Button size="sm" variant={ranged ? 'outline' : 'secondary'} onClick={() => setRange(undefined)}>{t('ranking.allTime')}</Button>
          <Button size="sm" variant="outline" onClick={() => preset(0)}>{t('ranking.today')}</Button>
          <Button size="sm" variant="outline" onClick={() => preset(1)}>{t('ranking.yesterday')}</Button>
          <Button size="sm" variant="outline" onClick={() => preset(6, 0)}>{t('ranking.last7')}</Button>
          <Button size="sm" variant="outline" onClick={() => { const t = new Date(); setRange({ from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }) }}>{t('ranking.thisMonth')}</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
      {!data && !error && (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-3xl bg-d-med" />)}</div>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-d-med" />)}
        </div>
      )}

      {data && (
        <div key={tab + String(ranged)}>
          {rows.length === 0 && (!ranged || rangeUsers) && <p className="rounded-xl border border-dashed border-d-border p-10 text-center text-sm text-d-text3">{t('ranking.empty')}</p>}
          {rows.length > 0 && <RankTable rows={rows} cols={cols} defaultSort={tab} />}
        </div>
      )}
      <p className="py-8 text-center text-xs text-d-text3">{t('rk.daily')}</p>
    </div>
  )
}
