import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from '@base-ui/react/dialog'
import { useTranslation } from 'react-i18next'
import { ExternalLink, FileText, UserRound, Link2, X } from 'lucide-react'
import { fmt } from '@/lib/dashboard/format'

type Rec = { detail_id: string; date: string; likes: number; reposts: number; replies: number; views: number; image_url?: string | null; video_url?: string | null }
type Item = { at: string; public_uuid: string; name: string; screen_name: string; avatar_url: string; url?: string; text?: string; record?: Rec | null }

const btn = 'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-d-border px-4 text-sm font-medium text-d-text transition-colors hover:bg-d-med'
const when = (s: string) => new Date(s.replace(' ', 'T') + (s.includes('Z') || s.includes('+') ? '' : '+09:00')).toLocaleString('ja-JP')

/** タイムラインの「追加」をクリックして開く右サイドパネル。おはツイの情報と各ページへの導線を出す */
export function TimelinePanel({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { t } = useTranslation()
  const last = useRef<Item | null>(null)
  if (item) last.current = item
  const it = item ?? last.current
  const r = it?.record
  const sid = it?.url?.match(/status\/(\d+)/)?.[1]
  const metrics: [string, number][] = r ? [['rc.likes', r.likes], ['rc.reposts', r.reposts], ['rc.replies', r.replies], ['rc.metrImp', r.views]] : []
  return (
    <Dialog.Root open={!!item} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dash-vars fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm transition-all duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup initialFocus={false} className="dash-vars fixed right-0 top-0 z-[901] flex h-full w-[460px] max-w-full flex-col border-l border-d-border bg-d-bg text-d-text outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          {it && (
            <>
              <header className="flex items-center justify-between border-b border-d-border px-5 py-3">
                <Dialog.Title className="text-sm font-semibold">追加されたおはツイ</Dialog.Title>
                <Dialog.Close aria-label={t('rc.close')} className="grid size-9 place-items-center rounded-full text-d-text2 hover:bg-d-med"><X className="size-4" /></Dialog.Close>
              </header>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <Link to={`/${it.public_uuid}`} onClick={onClose} className="flex items-center gap-3 hover:opacity-80">
                  <img src={it.avatar_url} alt="" className="size-10 rounded-full" />
                  <span className="min-w-0"><span className="block truncate font-semibold">{it.name}</span>{it.screen_name && <span className="block text-xs text-d-text3">@{it.screen_name}</span>}</span>
                </Link>
                <div className="mt-4 text-xs text-d-text3 tabular-nums">追加日時 {when(it.at)}{r?.date && <> / 投稿日時 {r.date.replace('T', ' ').slice(0, 16)}</>}</div>
                <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed">{it.text}</p>
                {r?.image_url && <img src={r.image_url} alt="" className="mt-4 max-h-[320px] w-full rounded-xl border border-d-border object-contain" />}
                {r ? (
                  <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-d-border bg-d-border">
                    {metrics.map(([l, v]) => (
                      <div key={l} className="min-w-0 bg-d-bg p-3">
                        <dt className="truncate text-[11px] text-d-text3">{t(l)}</dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">{fmt(v)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="mt-4 text-sm text-d-text3">このおはツイは既に削除されています。</p>}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {r && <Link to={`/details/${r.detail_id}`} className={btn}><FileText className="size-4" />詳細ページ</Link>}
                  {it.url && <a href={it.url} target="_blank" rel="noopener noreferrer" className={btn}><ExternalLink className="size-4" />Xのポスト</a>}
                  <Link to={`/${it.public_uuid}`} className={btn}><UserRound className="size-4" />ユーザーページ</Link>
                  {sid && <a href={`https://x.ohax.pw/${sid}`} target="_blank" rel="noopener noreferrer" className={btn}><Link2 className="size-4" />短縮URL</a>}
                </div>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
