import LanguageSwitcher from '@/components/dashboard-ui/LanguageSwitcher'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

interface AuthState { csrf: string; logged_in: boolean; error: string | null }

export const XIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
)
export const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
)

export default function LoginPage() {
  const { t } = useTranslation()
  const [st, setSt] = useState<AuthState | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [pkOpen, setPkOpen] = useState(false)
  const [pkId, setPkId] = useState('')
  const r = new URLSearchParams(window.location.search).get('r') ?? ''

  const passkeyLogin = async (identifier: string) => {
    setBusy('passkey')
    try {
      const post = (path: string, body?: unknown) => fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(async (x) => { const j = await x.json().catch(() => ({})); if (!x.ok) throw new Error(j.error ?? t('lg.loadFail')); return j })
      const optionsJSON = await post('/app-api/auth/passkey/options', { identifier })
      const response = await startAuthentication({ optionsJSON })
      const d = await post('/app-api/auth/passkey/verify', { response, r })
      window.location.href = d.redirect
    } catch (e) {
      setSt((p) => ({ csrf: p?.csrf ?? '', logged_in: false, error: (e as Error)?.name === 'NotAllowedError' ? t('pk.cancelled') : (e as Error).message }))
      setBusy(null)
    }
  }

  useEffect(() => {
    document.title = `${t('lg.title')} - おはツイKeeper`
    fetch('/app-api/auth/state', { credentials: 'include' }).then((x) => x.json()).then((a: AuthState) => {
      // ログイン済みなら移動先(同一サイトのパスのみ)かダッシュボードへ
      if (a.logged_in && !new URLSearchParams(window.location.search).has('action')) { window.location.replace(/^\/(?![\/\\])/.test(r) ? r : '/dashboard'); return }
      setSt(a)
    }).catch(() => setSt({ csrf: '', logged_in: false, error: t('lg.loadFail') }))
  }, [])

  const action = '/login' + (r ? `?r=${encodeURIComponent(r)}` : '')
  const providers = [
    { id: 'x', label: t('lg.withX'), icon: <XIcon />, cls: 'bg-white text-black hover:bg-white/90' },
    { id: 'discord', label: t('lg.withDiscord'), icon: <DiscordIcon />, cls: 'bg-[#5865f2] text-white hover:bg-[#4752c4]' },
  ] as const

  return (
    <div className="dash-scope relative grid min-h-screen overflow-hidden bg-d-bg text-d-text lg:grid-cols-[1.15fr_1fr]">
      {/* 左: ブランドパネル(カードではなく画面いっぱいのグラデーション) */}
      <section className="relative flex flex-col justify-between overflow-hidden px-8 py-8 lg:px-16 lg:py-16">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-[620px] rounded-full bg-d-accent/25 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 size-[480px] rounded-full bg-indigo-500/20 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]" />
        <a href="/" className="relative flex w-fit items-center gap-1.5 text-sm !text-d-text2 transition-colors hover:!text-d-text">
          <ArrowLeft className="size-4" />{t('lg.toTop')}
        </a>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative mt-8 lg:mt-0">
          <h1 className="mt-4 text-3xl font-black leading-[1.15] tracking-tight lg:mt-6 lg:text-5xl">
            <span className="block whitespace-nowrap">{t('lg.tag1')}</span><span className="block whitespace-nowrap bg-gradient-to-r from-d-accent to-emerald-300 bg-clip-text text-transparent">{t('lg.tag2')}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-d-text2 max-lg:hidden lg:mt-6 lg:text-base">{t('lg.tagDesc')}</p>
        </motion.div>
        <p className="relative mt-10 text-xs text-d-text2 max-lg:hidden">© おはツイKeeper</p>
      </section>

      {/* 右: ログイン */}
      <section className="relative flex items-center justify-center px-8 py-12 lg:border-l lg:border-d-border lg:px-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm">
          <h2 className="text-3xl font-extrabold tracking-tight">{t('lg.title')}</h2>
          <p className="mt-2 text-sm text-d-text2">{t('lg.pick')}</p>

          {st?.error && (
            <div role="alert" className="mt-6 flex items-start gap-2 border-l-2 border-red-500 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{st.error}</span>
            </div>
          )}

          <div className="relative mt-8">
          {busy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              role="status"
              className="absolute inset-x-0 top-0 z-10 flex h-14 items-center gap-4 rounded-full border border-d-border bg-d-bg px-6 text-[15px] font-semibold text-d-text2"
            >
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span key={i} className="size-1.5 rounded-full bg-d-text2" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </span>
              <span className="flex size-6 items-center justify-center text-d-text">{busy === 'x' ? <XIcon /> : busy === 'lapount' ? <span className="text-lg font-black text-d-accent">L</span> : busy === 'passkey' ? <KeyRound className="size-5" /> : <span className="text-[#5865f2]"><DiscordIcon /></span>}</span>
              <span>{t('lg.busy', { p: busy === 'x' ? 'X' : busy === 'lapount' ? 'Lapount' : busy === 'passkey' ? t('pk.title') : 'Discord' })}</span>
            </motion.div>
          )}
          <div className={`flex flex-col gap-3 transition-opacity ${busy ? 'pointer-events-none opacity-0' : ''}`}>
            {providers.map((p) => (
              <form key={p.id} method="POST" action={action} onSubmit={() => setBusy(p.id)}>
                <input type="hidden" name="csrf_token" value={st?.csrf ?? ''} />
                <input type="hidden" name="action" value="login" />
                <input type="hidden" name="provider" value={p.id} />
                <Button type="submit" disabled={!st?.csrf || busy !== null} className={`h-14 w-full gap-3 rounded-full border-0 text-[15px] font-bold transition-transform active:scale-[0.97] ${p.cls}`}>
                  {p.icon}
                  {p.label}
                </Button>
              </form>
            ))}
            {browserSupportsWebAuthn() && (
              <div>
                <Button type="button" disabled={busy !== null} aria-expanded={pkOpen} onClick={() => setPkOpen((o) => !o)} className="h-14 w-full gap-3 rounded-full border border-d-border bg-d-bg text-base font-semibold text-d-text hover:bg-d-border/40">
                  <KeyRound className="size-5" />{t('lg.passkey')}
                </Button>
                <AnimatePresence initial={false}>
                  {pkOpen && (
                    <motion.form
                      key="pk-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                      onSubmit={(e) => { e.preventDefault(); void passkeyLogin(pkId) }}
                    >
                      <div className="space-y-3 pt-3">
                        <Input value={pkId} onChange={(e) => setPkId(e.target.value)} placeholder={t('pk.identifier')} aria-label={t('pk.identifier')} autoComplete="username webauthn" autoFocus className="h-12 rounded-full px-5" />
                        <p className="px-2 text-xs text-d-text3">{t('pk.hint')}</p>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" disabled={busy !== null} onClick={() => { setPkOpen(false); setPkId('') }} className="h-12 flex-1 rounded-full border-d-border">{t('pk.cancel')}</Button>
                          <Button type="submit" disabled={busy !== null} className="h-12 flex-1 rounded-full">{t('pk.next')}</Button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}
            <Button type="button" disabled={busy !== null} onClick={() => { setBusy('lapount'); window.location.href = '/auth/lapount/start' + (r ? `?r=${encodeURIComponent(r)}` : '') }} className="h-14 w-full gap-3 rounded-full border border-d-border bg-d-bg text-[15px] font-bold text-d-text transition-transform hover:bg-d-border/40 active:scale-[0.97]">
              <span className="text-lg font-black text-d-accent">L</span>Lapount でログイン
            </Button>
          </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-d-text2">
            {t('lg.discordEnded')}
          </p>

          <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-d-text2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>
              {t('lg.agree1')}<a href="/terms" className="text-d-text2 hover:text-d-text">{t('lg.terms')}</a>{t('lg.and')}<a href="/policy" className="text-d-text2 hover:text-d-text">{t('lg.privacy')}</a>{t('lg.agree2')}
            </span>
          </p>
        </motion.div>
        <div className="absolute bottom-6 left-8 lg:left-16"><TooltipProvider><LanguageSwitcher compact /></TooltipProvider></div>
      </section>
    </div>
  )
}
