import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, History } from 'lucide-react'
import { Pagination } from '@/components/arc/pagination/pagination'
import PageHeader from '@/components/dashboard-ui/PageHeader'

type Item = { id: number; action: 'add' | 'delete'; at: string; public_uuid: string; name: string; screen_name: string; avatar_url: string; url?: string; text?: string; count?: number }

const dt = (s: string) => new Date(s.replace(' ', 'T') + (s.includes('Z') || s.includes('+') ? '' : 'Z'))
const full = (s: string) => dt(s).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dayKey = (s: string) => dt(s).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

export default function TimelinePage() {
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/app-api/view/timeline?page=${page}`).then((r) => r.json())
      .then((j) => { setItems(j.items); setPages(j.pages); window.scrollTo({ top: 0 }) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [page])

  let last = ''
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <PageHeader icon={History} title="タイムライン" desc="公開ユーザーのおはツイの追加・削除を新しい順に表示します" />
      {loading && <p className="text-sm text-d-text3">読み込み中…</p>}
      {!loading && !items.length && <p className="text-sm text-d-text3">まだ記録がありません。</p>}
      <ol className="relative ml-4 border-l border-d-border">
        {items.map((it) => {
          const day = dayKey(it.at), head = day !== last
          last = day
          const add = it.action === 'add'
          return (
            <li key={it.id} className="pb-5 pl-6">
              {head && <div className="-ml-6 mb-3 pl-6 pt-2 text-xs font-semibold text-d-text3">{day}</div>}
              <span className={`absolute -left-[11px] flex size-5 items-center justify-center rounded-full border border-d-border bg-d-bg ${add ? 'text-green-400' : 'text-red-400'}`}>
                {add ? <Plus className="size-3" /> : <Trash2 className="size-3" />}
              </span>
              <div className="rounded-xl border border-d-border bg-d-bg px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <img src={it.avatar_url} alt="" className="size-6 rounded-full" loading="lazy" />
                  <Link to={`/u/${it.screen_name || it.public_uuid}`} className="truncate font-semibold text-d-text hover:underline" data-user-card={it.public_uuid}>{it.name}</Link>
                  <span className="shrink-0 text-d-text2">{add ? 'がおはツイを追加' : it.count && it.count > 1 ? `がおはツイを${it.count}件削除` : 'がおはツイを削除'}</span>
                  <time className="ml-auto shrink-0 text-xs text-d-text3 tabular-nums" title={full(it.at)}>{full(it.at)}</time>
                </div>
                {add && it.text && (
                  <a href={it.url} target="_blank" rel="noreferrer" className="mt-2 block line-clamp-3 break-words text-sm text-d-text2 hover:underline">{it.text}</a>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-d-text2">
          <span className="tabular-nums">{page} / {pages}</span>
          <Pagination page={page} pageCount={pages} onPageChange={setPage} label="タイムライン" />
        </div>
      )}
    </div>
  )
}
