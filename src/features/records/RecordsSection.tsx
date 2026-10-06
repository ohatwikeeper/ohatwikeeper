import { DateRangePicker } from '@/components/arc/date-range-picker/date-range-picker'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RecordItem, SortKey } from '@/lib/dashboard/types'
import { copyText, fmt, lastUpdateLabel, shortDate } from '@/lib/dashboard/format'
import { useFlash } from '@/lib/dashboard/hooks'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import FilterPanel from '@/components/dashboard-ui/FilterPanel'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { HoldToDeleteButton } from '@/components/ui/hold-to-delete-button'
import { AnimatePresence, motion } from 'motion/react'
import { dbtn } from '@/components/dashboard-ui/DButton'
import ViewToggle from '@/features/records/ViewToggle'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import Tip from '@/components/dashboard-ui/Tip'

/** 一度に描画する件数。スクロールでこの単位ずつ増やし、全件同時描画による重さを防ぐ */
const PAGE = 30

interface Props {
  records: RecordItem[]
  firstPostDate: string | null
  lastUpdateTime: string | null
  scheduledUpdateTime?: string
  onImage: (imageUrl: string, videoUrl: string | null) => void
  onTweet: (url: string) => void
  /** 期間・フィルターUIを隠す(recapなど期間が固定の画面用) */
  hideFilters?: boolean
  onDelete?: (uniqid: string) => void
}

type Tri = 'any' | 'yes' | 'no'
type Flag = 'image' | 'video' | 'error'
type Metric = 'likes' | 'reposts' | 'replies' | 'views'
const TRI_LABEL: Record<Tri, string> = { any: 'rc.any', yes: 'rc.yes', no: 'rc.no' }
const FLAGS: { key: Flag; label: string }[] = [{ key: 'image', label: 'rc.image' }, { key: 'video', label: 'rc.video' }, { key: 'error', label: 'rc.fetchErr' }]
const METRICS: { key: Metric; label: string }[] = [{ key: 'likes', label: 'rc.likes' }, { key: 'reposts', label: 'rc.reposts' }, { key: 'replies', label: 'rc.replies' }, { key: 'views', label: 'rc.views' }]
const numCls = 'h-9 w-full min-w-0 rounded-lg border border-d-border bg-transparent px-2.5 text-sm tabular-nums outline-none focus-visible:border-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
const VIEW_KEY = 'ohatwiKeeperView'
const readView = (): 'list' | 'grid' => {
  try { return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list' } catch { return 'list' }
}

const toOhaxUrl = (u: string) => {
  const m = u.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return m ? `https://x.ohax.pw/${m[1]}` : null
}

/** 投稿URLを x.ohax.pw の短縮形式にしてコピーする */
function CopyXUrlButton({ url }: { url: string }) {
  const { t } = useTranslation()
  const [ok, flash] = useFlash()
  return (
    <Tip label={t('rc.copyXTip')}>
    <button
      type="button"
      aria-label={t('rc.copyX')}
      onClick={(e) => {
        e.stopPropagation()
        const s = toOhaxUrl(url)
        if (s) copyText(s).then(flash)
      }}
      className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full align-middle text-base transition-colors ${ok ? 'text-emerald-400' : 'text-d-text2 hover:text-d-text'}`}
    >
      <AnimatePresence>
        {ok && <motion.span key="ring" aria-hidden className="absolute inset-0 rounded-full border border-emerald-400" initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.5, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.i
          key={ok ? 'ok' : 'copy'}
          className={`bx ${ok ? 'bx-check' : 'bx-copy'} pointer-events-none`}
          initial={{ scale: 0.3, opacity: 0, filter: 'blur(4px)', rotate: ok ? -30 : 0 }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', rotate: 0 }}
          exit={{ scale: 0.3, opacity: 0, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          whileTap={{ scale: 0.85 }}
        />
      </AnimatePresence>
    </button>
    </Tip>
  )
}

function ErrBadge({ tile }: { tile?: boolean }) {
  const { t } = useTranslation()
  return (
    <Tip label={t('rc.metricErr')}>
      <span className={tile ? 'absolute right-3 top-3 inline-flex' : 'inline-flex'}>
        <Badge variant="destructive" className={tile ? '' : 'ml-2'}>
          <i className="bx bx-error" />{t('rc.fail')}
        </Badge>
      </span>
    </Tip>
  )
}

function Thumb({ r, onImage, size }: { r: RecordItem; onImage: Props['onImage']; size: 'cell' | 'tile' }) {
  const { t } = useTranslation()
  if (!r.image_url) return null
  const badge = r.video_url && (
    <span
      title={t('rc.video')}
      className={`pointer-events-none absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white ${
        size === 'cell' ? 'size-5 text-[0.9rem]' : 'size-9 text-[1.4rem]'
      }`}
    >
      <i className="bx bx-play-circle" />
    </span>
  )
  const open = (e: React.MouseEvent) => { e.stopPropagation(); onImage(r.image_url!, r.video_url) }
  return size === 'cell' ? (
    <span className="relative inline-block cursor-pointer" onClick={open}>
      <img loading="lazy" decoding="async" fetchPriority="low" width={50} height={50} src={thumb(r.image_url, "thumb")} alt="Post image" className="size-[50px] cursor-zoom-in rounded object-cover" />
      {badge}
    </span>
  ) : (
    <div className="relative flex h-[180px] w-full cursor-pointer items-center justify-center bg-d-bg" onClick={open}>
      <img loading="lazy" decoding="async" fetchPriority="low" src={thumb(r.image_url, "small")} alt="Post image" className="size-full object-contain" />
      {badge}
    </div>
  )
}

function ActionButtons({ r, onDelete }: { r: RecordItem; onDelete: Props['onDelete'] }) {
  const { t } = useTranslation()
  return (
    <>
      <Tip label={t('rc.openDetail')}>
        <a href={`/details/${r.detail_id}`} target="_blank" rel="noopener noreferrer" aria-label={t('rc.openDetail')} className={dbtn('icon', 'grow-0 !text-white')} onClick={(e) => e.stopPropagation()}>
          <i className="bx bx-detail" />
        </a>
      </Tip>
      <Tip label={t('rc.openOrig')}>
        <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={t('rc.openOrig')} className={dbtn('icon', '!text-white')} onClick={(e) => e.stopPropagation()}>
          <i className="bx bx-link-external" />
        </a>
      </Tip>
      <CopyXUrlButton url={r.url} />
      {onDelete && (
        <Tip label={t('rc.delete')}>
          <HoldToDeleteButton label={t('rc.delHold')} className={dbtn('danger')} onDelete={() => onDelete(r.uniqid)}>
            <i className="bx bx-trash" />
          </HoldToDeleteButton>
        </Tip>
      )}
    </>
  )
}

const HEADERS: { label: string; key?: SortKey; icon?: string; cls?: string }[] = [
  { label: 'Image' },
  { label: 'Date', key: 'date', icon: 'bx-calendar', cls: 'w-[150px] min-w-[150px]' },
  { label: 'Content' },
  { label: 'Likes', key: 'likes', icon: 'bx-heart', cls: 'text-right font-[family-name:monospace,monospace]' },
  { label: 'Reposts', key: 'reposts', icon: 'bx-repost', cls: 'text-right font-[family-name:monospace,monospace]' },
  { label: 'Replies', key: 'replies', icon: 'bx-message-square-dots', cls: 'text-right font-[family-name:monospace,monospace]' },
  { label: 'Views', key: 'views', icon: 'bx-show', cls: 'text-right font-[family-name:monospace,monospace]' },
  { label: 'Actions', cls: 'text-right' },
]

/** X(pbs.twimg.com)の画像は ?name= で縮小版を取得できる。一覧では原寸を読まない */
function thumb(url: string | null, name: 'thumb' | 'small') {
  if (!url || !/^https:\/\/pbs\.twimg\.com\//.test(url)) return url ?? undefined
  try { const u = new URL(url); u.searchParams.set('name', name); return u.toString() } catch { return url }
}

export default function RecordsSection(props: Props) {
  const { t } = useTranslation()
  const wdays = t('rc.wdays').split(',')
  const [delId, setDelId] = useState<string | null>(null)
  const tweetRef = useRef(props.onTweet)
  tweetRef.current = props.onTweet
  const canDelete = !!props.onDelete
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ action: string; id: string }>).detail
      if (d.action === 'tweet') tweetRef.current(d.id)
      else if (d.action === 'delete' && canDelete) setDelId(d.id)
    }
    document.addEventListener('ctx-record', h)
    return () => document.removeEventListener('ctx-record', h)
  }, [canDelete])
  const { records, lastUpdateTime, scheduledUpdateTime, onImage, onTweet, onDelete } = props
  const [view, setView] = useState(readView)
  const [sort, setSort] = useState<{ key: SortKey; order: 'asc' | 'desc' }>({ key: 'date', order: 'desc' })
  const [range, setRange] = useState<[Date, Date] | null>(null)
  const [flags, setFlags] = useState<Record<Flag, Tri>>({ image: 'any', video: 'any', error: 'any' })
  const [q, setQ] = useState('')
  const [metric, setMetric] = useState<Record<Metric, [string, string]>>({ likes: ['', ''], reposts: ['', ''], replies: ['', ''], views: ['', ''] })
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [visible, setVisible] = useState(PAGE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const changeView = (v: 'list' | 'grid') => {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* 保存できなくても表示は切り替わる */ }
  }

  const rows = useMemo(() => {
    let data = records
    if (range) {
      const end = new Date(range[1])
      end.setHours(23, 59, 59, 999)
      data = data.filter((r) => {
        const d = new Date(r.date.replace(' ', 'T'))
        return d >= range[0] && d <= end
      })
    }
    const has: Record<Flag, (r: RecordItem) => boolean> = { image: (r) => !!r.image_url, video: (r) => !!r.video_url, error: (r) => r.metrics_error }
    for (const f of FLAGS) if (flags[f.key] !== 'any') data = data.filter((r) => has[f.key](r) === (flags[f.key] === 'yes'))
    const kw = q.trim().toLowerCase()
    if (kw) data = data.filter((r) => r.text.toLowerCase().includes(kw))
    for (const m of METRICS) {
      const [lo, hi] = metric[m.key]
      if (lo !== '') data = data.filter((r) => r[m.key] >= Number(lo))
      if (hi !== '') data = data.filter((r) => r[m.key] <= Number(hi))
    }
    if (weekdays.length) data = data.filter((r) => weekdays.includes(new Date(r.date.replace(' ', 'T')).getDay()))
    const dir = sort.order === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const va = sort.key === 'date' ? new Date(a.date.replace(' ', 'T')).getTime() : a[sort.key]
      const vb = sort.key === 'date' ? new Date(b.date.replace(' ', 'T')).getTime() : b[sort.key]
      return va < vb ? -dir : va > vb ? dir : 0
    })
  }, [records, range, sort, flags, q, metric, weekdays])

  // 絞り込み・並べ替え・表示切替が変わったら描画数を初期化する
  useEffect(() => { setVisible(PAGE) }, [range, sort, view, records])

  // 末尾のセンチネルが見えたら描画数を増やす(残りがある間だけ監視)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visible >= rows.length) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => Math.min(v + PAGE, rows.length))
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rows.length])

  const shown = rows.slice(0, visible)
  const hasMore = visible < rows.length

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, order: s.order === 'desc' ? 'asc' : 'desc' } : { key, order: 'desc' }))

  const errCls = (r: RecordItem) => (r.metrics_error ? 'text-[#ef4444]' : '')

  const setMetricPart = (k: Metric, idx: 0 | 1, val: string) => setMetric((v) => ({ ...v, [k]: idx === 0 ? [val, v[k][1]] : [v[k][0], val] }))
  const chips: { id: string; label: string; clear: () => void }[] = [
    ...FLAGS.filter((f) => flags[f.key] !== 'any').map((f) => ({ id: f.key, label: t(flags[f.key] === 'yes' ? 'rc.flagYes' : 'rc.flagNo', { f: t(f.label) }), clear: () => setFlags((v) => ({ ...v, [f.key]: 'any' })) })),
    ...(q.trim() ? [{ id: 'q', label: `「${q.trim()}」`, clear: () => setQ('') }] : []),
    ...(weekdays.length ? [{ id: 'wd', label: t('rc.wdLabel', { d: [...weekdays].sort().map((d) => wdays[d]).join(t('rc.wdSep')) }), clear: () => setWeekdays([]) }] : []),
    ...METRICS.filter((m) => metric[m.key][0] !== '' || metric[m.key][1] !== '').map((m) => {
      const [lo, hi] = metric[m.key]
      return { id: m.key, label: `${t(m.label)} ${lo !== '' ? lo : ''}〜${hi !== '' ? hi : ''}`, clear: () => { setMetricPart(m.key, 0, ''); setMetricPart(m.key, 1, '') } }
    }),
  ]
  const resetAll = () => { setRange(null); setFlags({ image: 'any', video: 'any', error: 'any' }); setQ(''); setMetric({ likes: ['', ''], reposts: ['', ''], replies: ['', ''], views: ['', ''] }); setWeekdays([]) }

  return (
    <>
      <ConfirmDialog open={delId !== null} onOpenChange={(o) => !o && setDelId(null)} title={t('rc.delete')} onConfirm={() => { if (delId) props.onDelete?.(delId) }} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {!props.hideFilters && (<>
          <DateRangePicker label={t('rc.period')} value={range ? { start: range[0], end: range[1] } : null} onChange={(v) => setRange([v.start, v.end])} onClear={() => setRange(null)} />
          <FilterPanel
          activeCount={chips.length}
          resultCount={rows.length}
          onReset={resetAll}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-q">{t('rc.keyword')}</Label>
            <input id="f-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('rc.searchBody')} className="h-9 rounded-lg border border-d-border bg-transparent px-3 text-sm outline-none focus-visible:border-ring" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t('rc.weekday')}</Label>
            <div className="flex gap-1">
              {wdays.map((w, i) => (
                <button key={w} type="button" onClick={() => setWeekdays((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))}
                  className={`h-8 flex-1 cursor-pointer rounded-full text-sm ${weekdays.includes(i) ? 'bg-foreground font-semibold text-background' : 'border border-d-border text-d-text2'}`}>{w}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {METRICS.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <Label className="w-14 shrink-0">{t(m.label)}</Label>
                <input type="number" min={0} value={metric[m.key][0]} onChange={(e) => setMetric((v) => ({ ...v, [m.key]: [e.target.value, v[m.key][1]] }))} placeholder={t('rc.min')} className={numCls} />
                <span className="text-d-text3">〜</span>
                <input type="number" min={0} value={metric[m.key][1]} onChange={(e) => setMetric((v) => ({ ...v, [m.key]: [v[m.key][0], e.target.value] }))} placeholder={t('rc.max')} className={numCls} />
              </div>
            ))}
          </div>
          {FLAGS.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <Label>{t(f.label)}</Label>
              <div className="flex gap-0.5 rounded-full border border-d-border p-0.5">
                {(['any', 'yes', 'no'] as Tri[]).map((tv) => (
                  <button key={tv} type="button" onClick={() => setFlags((v) => ({ ...v, [f.key]: tv }))}
                    className={`relative h-6 cursor-pointer rounded-full px-2.5 text-xs transition-colors ${flags[f.key] === tv ? 'font-semibold text-background' : 'text-d-text2'}`}>
                    {flags[f.key] === tv && <motion.span layoutId={`tri-${f.key}`} className="absolute inset-0 rounded-full bg-foreground" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                    <span className="relative">{t(TRI_LABEL[tv])}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </FilterPanel>
          {chips.map((c) => (
            <button key={c.id} type="button" onClick={c.clear} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--arc-border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-secondary)]">
              {c.label}<X className="size-3.5 text-[var(--text-muted)]" />
            </button>
          ))}
          </>)}
        {!props.hideFilters && <span className="text-[0.8rem] tabular-nums text-d-text2">{t('rc.count', { n: rows.length })}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {scheduledUpdateTime && <Tip label={t('rc.autoTip', { t: scheduledUpdateTime })}>
            <span className="hidden cursor-help items-center gap-1.5 whitespace-nowrap text-[0.8rem] leading-none text-d-text2 md:inline-flex">
              <i className="bx bx-time-five text-base leading-none" />
              <span>{t('rc.updated', { t: lastUpdateLabel(lastUpdateTime) })}</span>
              <i className="bx bx-info-circle text-sm leading-none text-d-text3" />
            </span>
          </Tip>}
          {!props.hideFilters && <ViewToggle value={view} onChange={changeView} />}
        </div>
      </div>

      <div id="records-container">
        {view === 'list' ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="">
                  {HEADERS.map((h) => (
                    <TableHead key={h.label} className={`font-mono text-[11px] uppercase tracking-wider text-muted-foreground ${h.cls ?? ''}`}>
                      {h.key ? (
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); toggleSort(h.key!) }}
                          className={`flex items-center gap-1 !text-d-text2 hover:!text-d-text ${h.cls?.includes('text-right') ? 'justify-end' : ''}`}
                        >
                          <i className={`bx ${h.icon}`} title={h.label} /> <span className="max-md:hidden">{h.label}</span>
                          <span className="ml-2 inline-flex max-md:ml-0.5 flex-col text-[0.8em] leading-[0.7]">
                            <i className={`bx bxs-up-arrow ${sort.key === h.key && sort.order === 'asc' ? 'text-d-text' : 'text-d-text3'}`} />
                            <i className={`bx bxs-down-arrow ${sort.key === h.key && sort.order === 'desc' ? 'text-d-text' : 'text-d-text3'}`} />
                          </span>
                        </a>
                      ) : h.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8}><AppEmpty title={records.length ? t('rc.emptyFilter') : t('rc.emptyNone')} description={records.length ? t('rc.emptyFilterD') : undefined} /></TableCell></TableRow>
                )}
                {shown.map((r) => (
                  <TableRow key={r.uniqid} data-ctx-record={r.uniqid} data-ctx-url={r.url} data-ctx-detail={r.detail_id} className="cursor-pointer" onClick={() => onTweet(r.uniqid)}>
                    <TableCell className="px-2 py-3 "><Thumb r={r} onImage={onImage} size="cell" /></TableCell>
                    <TableCell className="px-2 py-3 ">
                      {shortDate(r.date)}{r.metrics_error && <ErrBadge />}
                    </TableCell>
                    <TableCell className="px-2 py-3  whitespace-normal max-w-[240px]"><span className="line-clamp-2">{r.text}</span></TableCell>
                    <TableCell className="px-2 py-3 text-right tabular-nums font-medium"><span className={errCls(r)}>{fmt(r.likes)}</span></TableCell>
                    <TableCell className="px-2 py-3 text-right tabular-nums font-medium"><span className={errCls(r)}>{fmt(r.reposts)}</span></TableCell>
                    <TableCell className="px-2 py-3 text-right tabular-nums font-medium"><span className={errCls(r)}>{fmt(r.replies)}</span></TableCell>
                    <TableCell className="px-2 py-3 text-right tabular-nums font-medium">{fmt(r.views)}</TableCell>
                    <TableCell className="px-2 py-3 text-right tabular-nums font-medium">
                      <span className="inline-flex items-center"><ActionButtons r={r} onDelete={onDelete} /></span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            {rows.length === 0 && <div className="col-span-full"><AppEmpty title={records.length ? t('rc.emptyFilter') : t('rc.emptyNone')} description={records.length ? t('rc.emptyFilterD') : undefined} /></div>}
            {shown.map((r) => (
              <div
                key={r.uniqid}
                data-ctx-record={r.uniqid} data-ctx-url={r.url} data-ctx-detail={r.detail_id}
                onClick={() => onTweet(r.uniqid)}
                className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-d-border hover:border-d-text3"
              >
                {r.image_url ? <Thumb r={r} onImage={onImage} size="tile" /> : <div className="h-2 bg-d-light" />}
                <div className="relative grow p-4">
                  {r.metrics_error && <ErrBadge tile />}
                  <div className="mb-3 text-[0.8rem] text-d-text2">{shortDate(r.date)}</div>
                  <p className="line-clamp-4 h-[6.2em] overflow-hidden text-[0.9rem] leading-[1.6] text-d-text">{r.text}</p>
                </div>
                <div className="flex justify-around border-t border-d-border px-4 py-3 text-[0.8rem] text-d-text2 [&>div]:flex [&>div]:items-center [&>div]:gap-[0.3rem] [&_i]:text-[1.1rem]">
                  <div className={errCls(r)}><i className="bx bxs-heart" /> {fmt(r.likes)}</div>
                  <div className={errCls(r)}><i className="bx bxs-repost" /> {fmt(r.reposts)}</div>
                  <div><i className="bx bxs-show" /> {fmt(r.views)}</div>
                  <div className={errCls(r)}><i className="bx bxs-message-square-dots" /> {fmt(r.replies)}</div>
                </div>
                <div className="flex gap-2 border-t border-d-border bg-d-med px-4 py-3 [&>a]:grow">
                  <ActionButtons r={r} onDelete={onDelete} />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6 text-d-text2">
            <i className="bx bx-loader-alt animate-spin text-xl" />
          </div>
        )}
      </div>
    </>
  )
}
