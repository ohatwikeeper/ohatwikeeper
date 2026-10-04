import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface SUser { public_uuid: string; x_username: string | null; display_name?: string; discord_username?: string; avatar_url?: string; post_count: number }
interface SPost { url: string; text: string; x_username: string; date: string; likes: number; avatar_url?: string }
interface Item { key: string; kind: 'user' | 'post'; user?: SUser; post?: SPost; fill?: string }

const SUGGEST = '/app-api/suggest'

// 入力: "@handle" → ユーザー候補 / "@handle 語" → そのユーザーの投稿候補 / それ以外 → ユーザー+投稿の混合候補
function parseInput(v: string) {
  const m = v.match(/^@([^\s]+)(?:\s+(.+))?$/)
  if (m) return { mode: m[2] ? 'user_posts' : 'user_only', handle: m[1], text: m[2] ?? '' } as const
  return { mode: 'mixed', handle: '', text: v } as const
}

export default function SearchBox({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const { t: tr } = useTranslation()
  const nav = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)
  const composing = useRef(false)
  const ctl = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  const run = (v: string) => {
    ctl.current?.abort()
    if (!v) { setOpen(false); return }
    const c = (ctl.current = new AbortController())
    const p = parseInput(v)
    const url = p.mode === 'user_only' ? `${SUGGEST}?type=users&q=${encodeURIComponent(p.handle)}`
      : p.mode === 'user_posts' ? `${SUGGEST}?type=user_posts&user=${encodeURIComponent(p.handle)}&q=${encodeURIComponent(p.text)}`
      : `${SUGGEST}?type=mixed&q=${encodeURIComponent(p.text)}`
    fetch(url, { signal: c.signal }).then((r) => r.json()).then((d) => {
      const out: Item[] = []
      const users: SUser[] = p.mode === 'mixed' ? d.users ?? [] : p.mode === 'user_only' ? d.results ?? [] : []
      const posts: SPost[] = p.mode === 'mixed' ? d.posts ?? [] : p.mode === 'user_posts' ? d.results ?? [] : []
      users.forEach((u) => out.push({ key: `u${u.public_uuid}`, kind: 'user', user: u, fill: p.mode === 'user_only' && u.x_username ? `@${u.x_username}` : undefined }))
      posts.forEach((x, i) => out.push({ key: `p${i}${x.url}`, kind: 'post', post: x }))
      setItems(out); setActive(out.length ? 0 : -1); setOpen(out.length > 0)
    }).catch((e) => { if (e?.name !== 'AbortError') setOpen(false) })
  }

  const schedule = (v: string, ms: number) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => run(v.trim()), ms)
  }

  const pick = (it: Item) => {
    setOpen(false)
    if (it.fill) { onChange(it.fill + ' '); return }
    if (it.kind === 'user') nav(`/search?u=${encodeURIComponent(it.user!.public_uuid)}`)
    else window.open(it.post!.url, '_blank', 'noopener')
  }

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  return (
    <div ref={wrap} className="relative flex-1">
      <input
        type="text" value={value} placeholder={tr('sb.ph')} autoComplete="off" enterKeyHint="search"
        className="h-11 w-full rounded-xl border border-d-border bg-d-med px-4 text-d-text outline-none transition-colors placeholder:text-d-text3 focus:border-d-accent"
        onChange={(e) => { onChange(e.target.value); if (!composing.current) schedule(e.target.value, 200) }}
        onCompositionStart={() => { composing.current = true }}
        onCompositionEnd={(e) => { composing.current = false; schedule(e.currentTarget.value, 80) }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setOpen(false); return }
          if (open && items.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); return }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return }
            if (e.key === 'Enter' && active >= 0 && !e.nativeEvent.isComposing) { e.preventDefault(); pick(items[active]); return }
          }
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); setOpen(false); onSubmit() }
        }}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-xl border border-d-border bg-d-med p-1 shadow-xl">
          {items.map((it, i) => (
            <button key={it.key} type="button" onMouseDown={(e) => { e.preventDefault(); pick(it) }} onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? 'bg-d-light' : ''}`}>
              {(it.user?.avatar_url ?? it.post?.avatar_url)
                ? <img src={(it.user?.avatar_url ?? it.post?.avatar_url)!} alt="" className="size-8 shrink-0 rounded-full bg-d-light object-cover" />
                : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-d-light">{it.kind === 'user' ? '👤' : '🌅'}</span>}
              <span className="min-w-0 flex-1">
                {it.kind === 'user' ? (
                  <>
                    <span className="block truncate text-sm font-semibold text-d-text">{it.user!.display_name || it.user!.x_username || it.user!.discord_username}</span>
                    <span className="block truncate text-xs text-d-text3">{it.user!.x_username && `@${it.user!.x_username} · `}{tr('sb.posts', { n: it.user!.post_count })}</span>
                  </>
                ) : (
                  <>
                    <span className="block truncate text-sm text-d-text">{it.post!.text}</span>
                    <span className="block truncate text-xs text-d-text3">@{it.post!.x_username} · {it.post!.date} · <i className="bx bx-heart" /> {it.post!.likes}</span>
                  </>
                )}
              </span>
              <span className="shrink-0 rounded bg-d-light px-1.5 py-0.5 text-[10px] font-bold text-d-text2">{it.kind === 'user' ? tr('sr.hUsers') : tr('sr.hPosts')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
