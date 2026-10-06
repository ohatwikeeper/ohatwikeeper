import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { IS_BETA } from '@/lib/beta/env'

interface Card { public_uuid: string; name: string; screen_name: string; avatar_url: string; banner_url: string | null; bio_html: string; following: number; followers: number; records: number }
const cache = new Map<string, Card | null>()
const num = (n: number) => n.toLocaleString()

/** beta 限定: [data-user-card="<public_uuid>"] にホバーすると X 風のプロフィールカードを表示する */
export default function UserHoverCard() {
  const [st, setSt] = useState<{ uuid: string; card: Card; x: number; y: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hold = useRef(false)
  useEffect(() => {
    if (!IS_BETA) return
    const close = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { if (!hold.current) setSt(null) }, 180) }
    const over = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-user-card]')
      if (!el) return
      const uuid = el.dataset.userCard!
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        if (!cache.has(uuid)) {
          try { const r = await fetch(`/app-api/view/user-card?uuid=${encodeURIComponent(uuid)}`); cache.set(uuid, r.ok ? await r.json() : null) } catch { cache.set(uuid, null) }
        }
        const card = cache.get(uuid)
        if (!card || !el.isConnected || !el.matches(':hover')) return
        const b = el.getBoundingClientRect()
        const below = b.bottom + 300 < window.innerHeight
        setSt({ uuid, card, x: Math.max(8, Math.min(b.left, window.innerWidth - 360)), y: below ? b.bottom + 6 : Math.max(8, b.top - 286) })
      }, 350)
    }
    const out = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('[data-user-card]')) close() }
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    return () => { document.removeEventListener('mouseover', over); document.removeEventListener('mouseout', out) }
  }, [])
  if (!IS_BETA) return null
  const c = st?.card
  return (
    <AnimatePresence>
      {st && c && (
        <motion.div
          key={st.uuid}
          initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          onMouseEnter={() => { hold.current = true; clearTimeout(timer.current) }}
          onMouseLeave={() => { hold.current = false; timer.current = setTimeout(() => setSt(null), 180) }}
          className="dash-vars fixed z-[60] w-[22rem] overflow-hidden rounded-2xl border border-d-border bg-d-bg shadow-2xl"
          style={{ left: st.x, top: st.y }}
        >
          <div className="h-20 bg-d-light">{c.banner_url && <img src={c.banner_url} alt="" className="size-full object-cover" />}</div>
          <div className="px-4 pb-4">
            <Link to={`/${c.public_uuid}`} onClick={() => setSt(null)} className="-mt-9 block w-fit">
              <img src={c.avatar_url} alt="" className="size-[72px] rounded-full border-4 border-d-bg bg-d-border object-cover" />
            </Link>
            <Link to={`/${c.public_uuid}`} onClick={() => setSt(null)} className="mt-1.5 block">
              <div className="truncate text-base font-bold text-d-text">{c.name}</div>
              {c.screen_name && <div className="truncate text-sm text-d-text3">@{c.screen_name}</div>}
            </Link>
            {c.bio_html && <div className="mt-2 line-clamp-4 text-sm leading-5 text-d-text [&_a]:text-d-accent" dangerouslySetInnerHTML={{ __html: c.bio_html }} />}
            <div className="mt-3 flex justify-between gap-3 whitespace-nowrap text-xs text-d-text3">
              <span><b className="text-d-text">{num(c.following)}</b> フォロー</span>
              <span><b className="text-d-text">{num(c.followers)}</b> フォロワー</span>
              <span><b className="text-d-text">{num(c.records)}</b>おはツイ</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
