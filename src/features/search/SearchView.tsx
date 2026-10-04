import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import SearchEmpty from '@/components/dashboard-ui/SearchEmpty'
import { Search } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { Link, useSearchParams } from 'react-router-dom'
import { fmt } from '@/lib/dashboard/format'
import SearchBox from '@/features/search/SearchBox'

interface SUser { public_uuid: string; name: string; x_username: string | null; x_icon: string | null; post_count: number }
interface SPost { public_uuid: string; name: string; x_icon: string | null; date: string; text: string; likes: number; reposts: number; replies: number; views: number; url: string }
interface SearchData {
  has_filter: boolean; is_advanced: boolean; from_resolved: boolean; type: 'all' | 'users' | 'posts'
  page: number; per_page: number; user_total: number; post_total: number; total_pages: number
  highlight: string; display_query: string; summary: string[]
  scope_user: { public_uuid: string; name: string; x_username: string | null; x_icon: string | null } | null
  users: SUser[]; posts: SPost[]
}

// 高度な検索の項目(URLパラメータ名 → ラベル)
const ADV: { key: string; label: string; type?: 'number' | 'date'; wide?: boolean }[] = [
  { key: 'from', label: 'sr.from', wide: true },
  { key: 'phrase', label: 'sr.phrase', wide: true },
  { key: 'any', label: 'sr.any', wide: true },
  { key: 'none', label: 'sr.none', wide: true },
  { key: 'min_likes', label: 'sr.minLikes', type: 'number' }, { key: 'max_likes', label: 'sr.maxLikes', type: 'number' },
  { key: 'min_reposts', label: 'sr.minRp', type: 'number' }, { key: 'max_reposts', label: 'sr.maxRp', type: 'number' },
  { key: 'min_replies', label: 'sr.minRe', type: 'number' }, { key: 'max_replies', label: 'sr.maxRe', type: 'number' },
  { key: 'min_views', label: 'sr.minV', type: 'number' }, { key: 'max_views', label: 'sr.maxV', type: 'number' },
  { key: 'since', label: 'sr.since', type: 'date' }, { key: 'until', label: 'sr.until', type: 'date' },
]
const TABS: { key: 'all' | 'users' | 'posts'; label: string }[] = [
  { key: 'all', label: 'sr.all' }, { key: 'users', label: 'sr.users' }, { key: 'posts', label: 'sr.posts' },
]

function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  const words = q.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!words.length) return text
  return text.split(new RegExp(`(${words.join('|')})`, 'giu')).map((part, i) =>
    i % 2 === 1 ? <mark key={i} className="rounded-sm bg-d-accent/25 px-0.5 text-d-text">{part}</mark> : part)
}

const Avatar = ({ src, cls = 'size-10' }: { src: string | null; cls?: string }) =>
  src ? <img src={src} alt="" className={`${cls} shrink-0 rounded-full bg-d-light object-cover`} />
    : <span className={`${cls} grid shrink-0 place-items-center rounded-full bg-d-light`}>👤</span>

export default function SearchView() {
  const { t: tr } = useTranslation()
  const [sp, setSp] = useSearchParams()
  const qs = sp.toString()
  const [data, setData] = useState<SearchData | null>(null)
  const [error, setError] = useState(false)
  const [text, setText] = useState(sp.get('q') ?? '')
  const [advOpen, setAdvOpen] = useState(() => ADV.some((a) => sp.get(a.key)))
  const [adv, setAdv] = useState<Record<string, string>>(() => Object.fromEntries(ADV.map((a) => [a.key, sp.get(a.key) ?? ''])))

  useEffect(() => {
    setText(sp.get('q') ?? '')
    setAdv(Object.fromEntries(ADV.map((a) => [a.key, sp.get(a.key) ?? ''])))
    setData(null); setError(false)
    const c = new AbortController()
    fetch(`/app-api/view/search-data/?${qs}`, { signal: c.signal }).then((r) => r.json()).then(setData)
      .catch((e) => { if (e?.name !== 'AbortError') setError(true) })
    return () => c.abort()
  }, [qs]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = data?.display_query ? tr('sr.docQ', { q: data.display_query }) : tr('sr.doc')
  }, [data?.display_query])

  const go = () => {
    const n = new URLSearchParams()
    const base: Record<string, string> = { q: text.trim(), ...adv, u: sp.get('u') ?? '', type: sp.get('type') ?? '' }
    Object.entries(base).forEach(([k, v]) => { if (v) n.set(k, v) })
    setSp(n)
  }

  const pageHref = (over: Record<string, string>) => {
    const n = new URLSearchParams(sp)
    Object.entries(over).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)))
    return `/search?${n.toString()}`
  }

  const scoped = !!data?.scope_user
  const showTabs = data && !scoped && data.has_filter && !data.is_advanced
  const hiQ = data?.highlight ?? ''
  const total = useMemo(() => {
    if (!data) return 0
    if (scoped || data.is_advanced || data.from_resolved) return data.post_total
    return data.type === 'users' ? data.user_total : data.type === 'posts' ? data.post_total : data.user_total + data.post_total
  }, [data, scoped])

  return (
    <div className="dash-scope dash-shell overflow-y-auto">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6">
        <PageHeader icon={Search} title={tr('sr.title')} />

        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); go() }}>
          <SearchBox value={text} onChange={setText} onSubmit={go} />
          <button type="button" aria-label={tr('sr.adv')} onClick={() => setAdvOpen((o) => !o)}
            className={`grid size-11 place-items-center rounded-xl border border-d-border text-lg transition-colors ${advOpen ? 'bg-d-light text-d-text' : 'bg-d-med text-d-text2 hover:text-d-text'}`}><i className="bx bx-slider-alt" /></button>
          <button type="submit" className="h-11 rounded-xl bg-d-text px-5 font-semibold !text-d-bg transition-opacity hover:opacity-90">{tr('sr.go')}</button>
        </form>

        {advOpen && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-d-border bg-d-med p-4 max-sm:grid-cols-1">
            {ADV.map((a) => (
              <label key={a.key} className={`flex flex-col gap-1 text-xs text-d-text3 ${a.wide ? 'col-span-2 max-sm:col-span-1' : ''}`}>
                {tr(a.label)}
                <input type={a.type ?? 'text'} min={a.type === 'number' ? 0 : undefined} value={adv[a.key]} onChange={(e) => setAdv({ ...adv, [a.key]: e.target.value })}
                  className="h-9 rounded-lg border border-d-border bg-d-bg px-3 text-sm text-d-text outline-none focus:border-d-accent" />
              </label>
            ))}
            <div className="col-span-2 flex justify-end gap-2 max-sm:col-span-1">
              <Link to="/search" className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm !text-d-text2 hover:!text-d-text"><i className="bx bx-x" />{tr('sr.reset')}</Link>
              <button type="button" onClick={go} className="h-9 rounded-lg bg-d-text px-4 text-sm font-semibold !text-d-bg">{tr('sr.goCond')}</button>
            </div>
          </div>
        )}

        {error && <p className="mt-8 text-center text-d-text2">{tr('sr.fail')}</p>}
        {!data && !error && <p className="mt-8 text-center text-d-text2">{tr('sr.busy')}</p>}

        {data && (
          <>
            {data.scope_user && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-d-border bg-d-med p-3">
                <Avatar src={data.scope_user.x_icon} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-d-text">{data.scope_user.name}</div>
                  {data.scope_user.x_username && <div className="text-xs text-d-text3">{tr('sr.inUser', { u: data.scope_user.x_username })}</div>}
                </div>
                <Link to={`/search${text ? `?q=${encodeURIComponent(text)}` : ''}`} className="text-sm !text-d-text2 hover:!text-d-text"><i className="bx bx-x" />{tr('sr.unscope')}</Link>
                <Link to={`/${data.scope_user.public_uuid}`} className="text-sm !text-d-accent"><i className="bx bx-user" />{tr('sr.profile')}</Link>
              </div>
            )}

            {showTabs && (
              <div className="mt-4 flex gap-1 border-b border-d-border">
                {TABS.map((t) => (
                  <Link key={t.key} to={pageHref({ type: t.key === 'all' ? '' : t.key, page: '' })}
                    className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${data.type === t.key ? 'border-d-accent !text-d-text' : 'border-transparent !text-d-text2 hover:!text-d-text'}`}>{tr(t.label)}</Link>
                ))}
              </div>
            )}

            <p className="mt-4 text-sm text-d-text2">
              {data.summary.length ? tr('sr.sumQ', { s: data.summary.join(' '), n: fmt(total) }) : tr('sr.sumAll', { n: fmt(total) })}
              {data.scope_user && tr('sr.inName', { n: data.scope_user.name })}
            </p>

            {!scoped && !data.is_advanced && !data.from_resolved && data.type !== 'posts' && data.users.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-2 text-sm font-semibold text-d-text"><i className="bx bx-user mr-1" />{tr('sr.hUsers')}{data.type === 'all' && tr('sr.top', { n: data.per_page })}</h2>
                <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                  {data.users.map((u) => (
                    <Link key={u.public_uuid} to={`/${u.public_uuid}`} className="flex items-center gap-3 rounded-xl border border-d-border bg-d-med p-3 transition-colors">
                      <Avatar src={u.x_icon} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-d-text"><Highlight text={u.name} q={hiQ} /></div>
                        {u.x_username && <div className="truncate text-xs text-d-text3">@<Highlight text={u.x_username} q={hiQ} /></div>}
                      </div>
                      <span className="text-xs text-d-text2"><i className="bx bx-edit" /> {fmt(u.post_count)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {!scoped && !data.is_advanced && data.type === 'users' && data.users.length === 0 && data.has_filter && (
              <SearchEmpty kind="none" title={tr('sr.noUser')} />
            )}

            {data.posts.length > 0 && (
              <section className="mt-5">
                {!scoped && !data.is_advanced && !data.from_resolved && (
                  <h2 className="mb-2 text-sm font-semibold text-d-text"><i className="bx bx-message-rounded-dots mr-1" />{tr('sr.hPosts')}{data.type === 'all' && tr('sr.top', { n: data.per_page })}</h2>
                )}
                <div className="flex flex-col gap-2">
                  {data.posts.map((p, i) => (
                    <article key={i} className="rounded-xl border border-d-border bg-d-med p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs text-d-text3">
                        <Avatar src={p.x_icon} cls="size-6" />
                        <Link to={`/search?u=${encodeURIComponent(p.public_uuid)}`} className="!text-d-text2 hover:!text-d-text">{p.name}</Link>
                        <span>·</span><span>{p.date}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-d-text"><Highlight text={p.text} q={hiQ} /></p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-d-text2">
                        <span><i className="bx bx-heart" /> {fmt(p.likes)}</span>
                        <span><i className="bx bx-refresh" /> {fmt(p.reposts)}</span>
                        <span><i className="bx bx-chat" /> {fmt(p.replies)}</span>
                        <span><i className="bx bx-show" /> {fmt(p.views)}</span>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="ml-auto !text-d-accent">{tr('sr.view')}</a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {data.has_filter && data.posts.length === 0 && (data.type === 'posts' || scoped || data.is_advanced || data.from_resolved) && (
              <SearchEmpty kind="none" title={tr('sr.noPost')} />
            )}
            {data.has_filter && !scoped && !data.is_advanced && data.type === 'all' && data.users.length === 0 && data.posts.length === 0 && (
              <SearchEmpty kind="none" title={tr('sr.noBoth')} />
            )}

            {!data.has_filter && data.posts.length === 0 && data.users.length === 0 && <SearchEmpty kind="initial" />}

            {data.total_pages > 1 && (
              <nav className="mt-6 flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: Math.min(data.total_pages, data.page + 2) - Math.max(1, data.page - 2) + 1 }, (_, k) => Math.max(1, data.page - 2) + k).map((n) =>
                  n === data.page
                    ? <span key={n} className="grid size-9 place-items-center rounded-lg bg-d-text font-semibold !text-d-bg">{n}</span>
                    : <Link key={n} to={pageHref({ page: String(n) })} className="grid size-9 place-items-center rounded-lg border border-d-border bg-d-med !text-d-text2 hover:!text-d-text">{n}</Link>)}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
