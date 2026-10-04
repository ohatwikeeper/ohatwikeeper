import MiniFooter from '@/components/dashboard-ui/MiniFooter'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Home, SearchX, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'

type Kind = 'not_found' | 'user_not_found'

const COPY: Record<Kind, { code: string; title: string; text: string; Icon: typeof SearchX }> = {
  not_found: { code: '404', title: 'er.nfTitle', text: 'er.nfText', Icon: SearchX },
  user_not_found: { code: '404', title: 'er.unTitle', text: 'er.unText', Icon: UserX },
}

const SAYS = ['er.s0', 'er.s1', 'er.s2', 'er.s3', 'er.s4', 'er.s5']

/** 404 系エラーページ。表示時にエラーIDを発行し、管理者が /admin/errors で確認できる */
export default function ErrorPage({ kind = 'not_found', footer = false }: { kind?: Kind; footer?: boolean }) {
  const { pathname, search } = useLocation()
  const [id, setId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [n, setN] = useState(0)
  const reduce = useReducedMotion()
  const poke = () => setN((v) => v + 1)
  const { t: tr } = useTranslation()
  const { code, title: titleKey, text: textKey } = COPY[kind]
  const title = tr(titleKey)
  const text = tr(textKey)

  useEffect(() => {
    document.title = `${title} - おはツイKeeper`
    fetch('/app-api/errors', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, path: pathname + search, referrer: document.referrer }),
    }).then((r) => r.json()).then((d) => setId(d.error_id ?? null)).catch(() => {})
  }, [kind, pathname, search, title])

  const copy = () => {
    if (!id) return
    navigator.clipboard?.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }

  return (
    <div className="dash-scope relative grid place-items-center overflow-hidden px-5 py-16 lg:!min-h-[calc(100dvh-var(--navbar-real-h,0px)-3rem)] lg:-mb-8 lg:py-8">
      <div className="relative w-full max-w-lg text-center">
        <div className="flex items-center justify-center text-[110px] font-black leading-none tracking-tighter text-d-text/15">
          <span>{code[0]}</span>
          <button type="button" onClick={poke} aria-label={tr('er.poke')} className="mx-1 select-none text-[84px] leading-none active:scale-90 transition-transform duration-150">
            <motion.span className="inline-block" animate={reduce ? undefined : { y: [0, -8, 0], rotate: [-6, 6, -6] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} key={n}>{n % 2 ? '😵' : '😴'}</motion.span>
          </button>
          <span>{code[2]}</span>
        </div>
        <p className="mt-1 min-h-5 text-xs text-d-text3">{n === 0 ? tr('er.zzz') : tr(SAYS[(n - 1) % SAYS.length])}</p>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-d-text">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-d-text2">{text}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-d-text px-5 py-2.5 text-sm font-bold !text-d-bg transition-transform duration-150 active:scale-95"><Home className="size-4" />{tr('er.top')}</Link>
        </div>
        <button type="button" onClick={copy} disabled={!id} className="mx-auto mt-8 inline-flex items-center gap-2 rounded-lg border border-d-border/70 bg-d-med/60 px-3 py-1.5 font-mono text-xs text-d-text3 transition-transform duration-150 active:scale-95 disabled:opacity-50">
          {tr('er.id', { id: id ?? tr('er.issuing') })} {id && (copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />)}
        </button>
        <p className="mt-2 text-[11px] text-d-text3">{tr('er.contact')}</p>
      </div>
      {footer && <MiniFooter />}
    </div>
  )
}
