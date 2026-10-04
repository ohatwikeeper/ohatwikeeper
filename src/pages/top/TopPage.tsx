import LanguageSwitcher from '@/components/dashboard-ui/LanguageSwitcher'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Check, Copy, Download, Globe, ImageIcon, LineChart, Terminal, Users } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import GlimmLink from '@/widgets/GlimmLink'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

interface PageData { logged_in: boolean; total_users: number; total_records: number; today_users: number }
interface RankItem { public_uuid: string; x_icon: string | null; author: string | { screen_name?: string } | null; total_posts: number }

const ACCENT = 'var(--d-accent)'
const EASE = [0.22, 1, 0.36, 1] as const
const CLI_INSTALL = "npm i -g @lapius/ohatwikeeper-cli"
const MARQUEE = ['tp.mqSave', 'tp.mqTimeline', 'tp.mqGrass', 'tp.mqAwards', 'tp.mqOgp', 'tp.mqBulk', 'tp.mqStreak', 'tp.mqRanking', 'tp.mqCli', 'tp.mqExt']
const FAQ = [['tp.faqQ1', 'tp.faqA1'], ['tp.faqQ2', 'tp.faqA2'], ['tp.faqQ3', 'tp.faqA3']]
const STEPS = [['tp.stepT1', 'tp.stepD1'], ['tp.stepT2', 'tp.stepD2'], ['tp.stepT3', 'tp.stepD3']]

const authorName = (a: RankItem['author']) => {
  if (!a) return ''
  if (typeof a === 'object') return a.screen_name ?? ''
  try { return JSON.parse(a).screen_name ?? '' } catch { return a }
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </motion.div>
  )
}

function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const c = animate(0, value, { duration: 1.4, ease: EASE, onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() } })
    return () => c.stop()
  }, [inView, value])
  return <span ref={ref} className={className}>0</span>
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/50"><span className="h-px w-8" style={{ background: ACCENT }} />{children}</div>
}

const GRASS = Array.from({ length: 16 * 7 }, (_, i) => ((i * 37 + (i % 5) * 11) % 7) % 4)
const TONE = ['bg-white/[0.06]', 'bg-[color-mix(in_oklab,var(--d-accent)_30%,transparent)]', 'bg-[color-mix(in_oklab,var(--d-accent)_60%,transparent)]', 'bg-[var(--d-accent)]']

function Preview({ data }: { data: PageData }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  // ヒーロー(画面−ナビ)に収まるよう、低い画面ではプレビュー全体を縮小する
  useEffect(() => {
    const fit = () => {
      const el = ref.current
      if (!el) return
      el.style.zoom = '1'
      const nav = document.querySelector('.navbar')?.getBoundingClientRect().height ?? 65
      const avail = window.innerHeight - nav - 128 // 上下余白(py-16 x2)
      // zoom 下では実寸が比例しない場合があるため、実測して2回補正する
      for (let i = 0; i < 6; i++) {
        const z = parseFloat(el.style.zoom)
        const h = el.getBoundingClientRect().height
        el.style.zoom = String(Math.min(1, Math.max(0.5, (z * avail) / h)))
      }
    }
    fit()
    const t = setTimeout(fit, 1500) // 登場アニメ(rotateX)終了後に再計測
    window.addEventListener('resize', fit)
    return () => { clearTimeout(t); window.removeEventListener('resize', fit) }
  }, [])
  return (
    <motion.div ref={ref} aria-hidden className="relative max-md:hidden" initial={{ opacity: 0, y: 40, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1, delay: 0.25, ease: EASE }} style={{ perspective: 1200 }}>
      <div className="absolute -inset-6 rounded-[2rem] opacity-40 blur-3xl" style={{ background: `radial-gradient(60% 60% at 70% 30%, ${ACCENT}, transparent 70%)` }} />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d0f12]/90 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-center text-[11px] text-white/40">ohatwikeeper.com/dashboard</span>
        </div>
        <div className="grid grid-cols-4 divide-x divide-white/10 border-b border-white/10 text-center">
          {[[data.total_records || 1284, t('tp.pvRecords')], [365, t('tp.pvStreak')], [4812, t('tp.pvAvgLikes')], [48, t('tp.pvBest')]].map(([v, l]) => (
            <div key={l as string} className="py-4"><div className="text-xl font-bold tabular-nums" style={{ color: ACCENT }}>{Number(v).toLocaleString()}</div><div className="mt-0.5 text-[11px] text-white/40">{l}</div></div>
          ))}
        </div>
        <div className="border-b border-white/10 p-4">
          <div className="mb-2 text-[11px] text-white/40">{t('tp.pvGrass')}</div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {GRASS.map((g, i) => <motion.span key={i} className={cn('aspect-square rounded-[3px]', TONE[g])} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.7 + Math.floor(i / 7) * 0.04 }} />)}
          </div>
        </div>
        <div className="grid grid-cols-[1.4fr_1fr] divide-x divide-white/10 border-b border-white/10">
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/40"><span>{t('tp.pvTrend')}</span><span style={{ color: ACCENT }}>+12%</span></div>
            <svg viewBox="0 0 120 40" className="h-14 w-full overflow-visible" preserveAspectRatio="none">
              <defs><linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--d-accent)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--d-accent)" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 32 L15 26 L30 30 L45 18 L60 22 L75 12 L90 16 L105 6 L120 9 L120 40 L0 40Z" fill="url(#pv)" />
              <motion.path d="M0 32 L15 26 L30 30 L45 18 L60 22 L75 12 L90 16 L105 6 L120 9" fill="none" stroke="var(--d-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.9, ease: EASE }} />
            </svg>
          </div>
          <div className="p-4">
            <div className="mb-2 text-[11px] text-white/40">{t('tp.pvAwards')}</div>
            <div className="flex flex-wrap gap-1.5">
              {['tp.pvAw1', 'tp.pvAw2', 'tp.pvAw3'].map(a => <span key={a} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/70">{t(a)}</span>)}
            </div>
          </div>
        </div>
        <ul className="divide-y divide-white/10 text-xs">
          {['tp.pvPost1', 'tp.pvPost2', 'tp.pvPost3'].map((pk, i) => (
            <li key={pk} className="flex items-center gap-3 px-4 py-3"><span className="size-7 shrink-0 rounded-full" style={{ background: `color-mix(in oklab, ${ACCENT} 35%, transparent)` }} /><span className="min-w-0 flex-1 truncate text-white/70">{t(pk)}</span><span className="tabular-nums text-white/40">♥ {['2,840', '1,201', '3,566'][i]}</span></li>
          ))}
        </ul>
      </div>
      <motion.div className="absolute -bottom-16 left-6 rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 shadow-xl" animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="text-[11px] text-white/40">{t('tp.pvStreak')}</div><div className="text-lg font-bold" style={{ color: ACCENT }}>{t('tp.pvStreakVal')}</div>
      </motion.div>
    </motion.div>
  )
}

function Bento({ className, icon: Icon, title, desc, children }: { className?: string; icon: typeof Globe; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <Reveal className={cn('group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-7', className)}>
      <div className="mb-5 inline-flex size-10 items-center justify-center rounded-lg border border-white/15" style={{ color: ACCENT }}><Icon className="size-5" /></div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">{desc}</p>
      {children}
    </Reveal>
  )
}

const FOOT_COLS: [string, [string, string][]][] = [
  ['tp.ftUse', [[CONFIG.PAGES.DASHBOARD, 'nb.dashboard'], [CONFIG.PAGES.HOW_TO_USE, 'nb.howtouse'], [CONFIG.PAGES.EXTENSIONS, 'nb.extensions'], [CONFIG.PAGES.PATCHNOTES, 'nb.patchnote']]],
  ['tp.ftView', [[CONFIG.PAGES.RANKING, 'nb.ranking'], [CONFIG.PAGES.AWARDS, 'nb.awards'], [CONFIG.PAGES.GALLERY, 'nb.gallery'], [CONFIG.PAGES.SEARCH, 'nb.search']]],
  ['tp.ftConnect', [[CONFIG.EXTERNAL.DISCORD, 'Discord'], [CONFIG.EXTERNAL.VRCHAT, 'VRChat'], ['https://x.com/ohatwikeeper', 'tp.ftXOfficial'], [CONFIG.PAGES.DEV, 'nb.aboutDev'], [CONFIG.PAGES.POLICY, 'nb.privacy']]],
]
const SUN_SAYS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `tp.sun${n}`)
function greetKey() {
  const h = new Date().getHours()
  return h < 4 ? 'tp.greet1' : h < 11 ? 'tp.greet2' : h < 18 ? 'tp.greet3' : 'tp.greet4'
}

function TopFooter() {
  const { t } = useTranslation()
  const [n, setN] = useState(0)
  const [pops, setPops] = useState<{ id: number; x: number; e: string }[]>([])
  const reduce = useReducedMotion()
  function poke() {
    const id = Date.now() + n
    setN((v) => v + 1)
    if (!reduce) {
      setPops((p) => [...p.slice(-8), { id, x: Math.round((Math.random() - 0.5) * 120), e: ['☀️', '✨', '🌅', '⭐', '☕'][n % 5] }])
      setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 1400)
    }
  }
  const link = '!text-white/50 hover:!text-white'
  return (
    <footer className="relative overflow-hidden border-t border-white/10 px-6 pb-8 pt-14 text-sm text-white/40">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <div className="relative inline-block">
            <button type="button" onClick={poke} aria-label={t('tp.sunAria')} className="text-5xl text-white transition-transform duration-150 active:scale-90">☀️</button>
            {pops.map((q) => (
              <motion.span key={q.id} aria-hidden className="pointer-events-none absolute left-2 top-0 text-xl text-white" initial={{ opacity: 1, y: 0, x: 0 }} animate={{ opacity: 0, y: -90, x: q.x }} transition={{ duration: 1.2, ease: 'easeOut' }}>{q.e}</motion.span>
            ))}
          </div>
          <p className="mt-2 min-h-5 text-white/70">{t(n === 0 ? greetKey() : SUN_SAYS[(n - 1) % SUN_SAYS.length])}</p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed">{t('tp.ftTag1')}<br />{t('tp.ftTag2')}</p>
        </div>
        {FOOT_COLS.map(([ck, items]) => (
          <nav key={ck}>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-white/70">{t(ck)}</h3>
            <ul className="space-y-2">
              {items.map(([href, label]) => (
                <li key={label}><a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})} className={link}>{/^(tp|nb)\./.test(label) ? t(label) : label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs">
        <p>&copy; {new Date().getFullYear()} おはツイKeeper by 狐ノ瀬つづり</p>
        <div className="flex items-center gap-4"><p>{t('tp.ftMade')}</p><TooltipProvider><LanguageSwitcher compact /></TooltipProvider></div>
      </div>
    </footer>
  )
}

export default function TopPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<PageData>({ logged_in: false, total_users: 0, total_records: 0, today_users: 0 })
  const [rank, setRank] = useState<RankItem[]>([])
  const [copied, setCopied] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [faqH, setFaqH] = useState<number[]>([])
  const faqRef = useRef<HTMLDivElement>(null)
  // 開閉でページ全体の高さが変わるとフッターが動くので、全項目の高さを小数精度で測り続けて補正する
  useEffect(() => {
    const root = faqRef.current
    if (!root) return
    const m = () => setFaqH(Array.from(root.children).map((el) => el.getBoundingClientRect().height))
    m()
    const ro = new ResizeObserver(m)
    ro.observe(root)
    Array.from(root.children).forEach((el) => ro.observe(el))
    document.fonts?.ready.then(m)
    return () => ro.disconnect()
  }, [])
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])


  useEffect(() => { document.title = t('tp.docTitle') }, [t, i18n.language])
  useEffect(() => {
    fetch('/session_api.php', { credentials: 'include' }).then(r => r.json()).then(setData).catch(() => {})
    fetch(`${CONFIG.API_BASE}/app-api/ranking/full`).then(r => r.json()).then(d => setRank((d.total_posts ?? []).slice(0, 5))).catch(() => {})
  }, [])

  const copy = () => navigator.clipboard?.writeText(CLI_INSTALL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  const ctaPrimary = cn(buttonVariants({ size: 'lg' }), 'group/cta relative h-12 overflow-hidden rounded-full border-0 px-7 text-base font-bold !text-black transition-transform duration-150 active:scale-95')
  const ctaBg = { backgroundImage: `linear-gradient(135deg, ${ACCENT}, color-mix(in oklab, ${ACCENT} 55%, #7dd3fc))` }

  return (
    <main className="dash-vars min-h-screen overflow-x-clip bg-[#07080a] bg-[radial-gradient(80%_50%_at_50%_100%,color-mix(in_oklab,var(--d-accent)_9%,transparent),transparent)] text-[#f3f3ef]">
      {/* Hero */}
      <section ref={heroRef} className="relative isolate flex min-h-[calc(100dvh-var(--navbar-real-h,0px))] items-center">
        <motion.div aria-hidden style={{ y: glowY }} className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[46rem]">
          <div className="absolute left-[8%] top-10 size-[34rem] rounded-full opacity-25 blur-[120px]" style={{ background: ACCENT }} />
          <div className="absolute right-[4%] top-40 size-[30rem] rounded-full bg-sky-500 opacity-20 blur-[120px]" />
          <div className="absolute left-[38%] top-[26rem] size-[26rem] rounded-full bg-violet-500 opacity-[0.16] blur-[130px]" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 -z-10 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-16 px-6 py-16 max-md:grid-cols-1">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <Badge variant="outline" className="h-7 gap-2 rounded-full border-white/15 bg-white/5 px-3 font-normal text-white/70">
                <span className="size-1.5 rounded-full" style={{ background: ACCENT }} />{t('tp.badge')}
              </Badge>
            </motion.div>
            <motion.h1 className="mt-7 text-6xl font-black leading-[1.08] tracking-tight max-lg:text-5xl max-sm:text-4xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>
              {t('tp.hero1')}<br />
              <span className="whitespace-nowrap bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(100deg, ${ACCENT}, #7dd3fc)` }}>{t('tp.hero2')}</span>
            </motion.h1>
            <motion.p className="mt-7 max-w-lg text-lg leading-relaxed text-white/60" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }}>
              {t('tp.heroDesc')}
            </motion.p>
            <motion.div className="mt-9 flex flex-wrap items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }}>
              {data.logged_in
                ? <a href={CONFIG.PAGES.DASHBOARD} className={ctaPrimary} style={ctaBg}>{t('tp.toDash')} <ArrowRight className="size-4" /></a>
                : <GlimmLink to="login" className={ctaPrimary} style={ctaBg}>{t('tp.startNow')} <ArrowRight className="size-4" /></GlimmLink>}
              <a href={CONFIG.PAGES.HOW_TO_USE} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-base !text-white backdrop-blur transition-transform duration-150 active:scale-95')}>{t('tp.howTo')}</a>
              <a href={CONFIG.EXTERNAL.TIMELINE} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-12 rounded-full px-5 text-base !text-white/70')}>{t('tp.timeline')}</a>
            </motion.div>
          </div>
          <Preview data={data} />
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-white/10 py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <motion.div className="flex w-max gap-12 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.2em] text-white/35" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} className="flex items-center gap-12">{t(m)}<span style={{ color: ACCENT }}>✦</span></span>)}
        </motion.div>
      </div>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-3 divide-x divide-white/10 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y">
          {[[data.total_users, t('tp.stUsers')], [data.total_records, t('tp.stRecords')], [data.today_users, t('tp.stToday')]].map(([v, l], i) => (
            <Reveal key={l as string} delay={i * 0.08} className="px-8 py-6 max-sm:px-0">
              <Counter value={Number(v)} className="text-6xl font-black tabular-nums max-sm:text-5xl" />
              <div className="mt-2 text-sm text-white/50">{l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal><Eyebrow>Features</Eyebrow><h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight max-sm:text-3xl">{t('tp.ftH1')}<br />{t('tp.ftH2')}</h2></Reveal>
        <div className="mt-12 grid grid-cols-6 gap-4 max-md:grid-cols-1">
          <Bento className="col-span-3 max-md:col-span-1" icon={ImageIcon} title={t('tp.bAutoT')} desc={t('tp.bAutoD')}>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/40"><span className="flex-1 truncate">https://x.com/user/status/1784930…</span><Check className="size-4" style={{ color: ACCENT }} /></div>
          </Bento>
          <Bento className="col-span-3 max-md:col-span-1" icon={LineChart} title={t('tp.bAnaT')} desc={t('tp.bAnaD')}>
            <div className="mt-6 flex h-14 items-end gap-1.5">{[30, 55, 40, 70, 50, 85, 65, 95].map((h, i) => <motion.span key={i} className="flex-1 rounded-sm" style={{ background: ACCENT, opacity: 0.25 + i * 0.1 }} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }} />)}</div>
          </Bento>
          <Bento className="col-span-2 max-md:col-span-1" icon={Globe} title={t('tp.bPageT')} desc={t('tp.bPageD')} />
          <Bento className="col-span-2 max-md:col-span-1" icon={Users} title={t('tp.bTlT')} desc={t('tp.bTlD')} />
          <Bento className="col-span-2 max-md:col-span-1" icon={Download} title={t('tp.bZipT')} desc={t('tp.bZipD')} />
        </div>
      </section>

      {/* Ranking */}
      {rank.length > 0 && (
        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-16 px-6 py-28 max-md:grid-cols-1 max-md:gap-10">
            <Reveal>
              <Eyebrow>Ranking</Eyebrow>
              <h2 className="text-4xl font-black leading-tight tracking-tight max-sm:text-3xl">{t('tp.rankH')}</h2>
              <p className="mt-4 text-white/55">{t('tp.rankD')}</p>
              <a href={CONFIG.PAGES.RANKING} className={cn(buttonVariants({ variant: 'outline' }), 'mt-8 h-10 rounded-full border-white/20 bg-transparent px-5 !text-white')}>{t('tp.rankAll')} <ArrowRight className="size-4" /></a>
            </Reveal>
            <ol>
              {rank.map((u, i) => (
                <motion.li key={u.public_uuid} className="border-b border-white/10 first:border-t" initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}>
                  <a href={`/${u.public_uuid}`} className="flex items-center gap-5 py-4 !text-white">
                    <span className="w-8 text-3xl font-black tabular-nums" style={{ color: i === 0 ? ACCENT : 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                    {u.x_icon ? <img src={u.x_icon} alt="" className="size-11 rounded-full" /> : <span className="size-11 rounded-full bg-white/10" />}
                    <span className="min-w-0 flex-1 truncate font-semibold">@{authorName(u.author) || u.public_uuid}</span>
                    <span className="tabular-nums text-white/60"><b className="text-lg text-white">{u.total_posts.toLocaleString()}</b>{t('tp.postsUnit')}</span>
                  </a>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <Reveal><Eyebrow>How it works</Eyebrow><h2 className="text-4xl font-black tracking-tight max-sm:text-3xl">{t('tp.howH')}</h2></Reveal>
        <div className="mt-14 grid grid-cols-3 gap-10 max-md:grid-cols-1">
          {STEPS.map(([tk, dk], i) => (
            <Reveal key={tk} delay={i * 0.1}>
              <div className="text-7xl font-black leading-none [-webkit-text-stroke:1px_rgba(255,255,255,0.25)] text-transparent">0{i + 1}</div>
              <Separator className="my-5 bg-white/15" />
              <h3 className="text-lg font-bold">{t(tk)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{t(dk)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CLI */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-14 max-md:grid-cols-1">
          <Reveal>
            <Eyebrow>CLI &amp; Extension</Eyebrow>
            <h2 className="text-4xl font-black leading-tight tracking-tight max-sm:text-3xl">{t('tp.cliH1')}<br />{t('tp.cliH2')}</h2>
            <p className="mt-4 text-white/55">{t('tp.cliD')}</p>
            <div className="mt-7 flex gap-3">
              <a href={CONFIG.PAGES.CLI} className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full border-white/20 bg-transparent !text-white')}>{t('tp.cliMore')}</a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0b0d10] shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-white/40"><Terminal className="size-3.5" />ohax</div>
              <div className="space-y-3 p-5 font-mono text-[13px] leading-relaxed">
                <button type="button" onClick={copy} className="flex w-full items-center gap-3 text-left">
                  <span style={{ color: ACCENT }}>$</span><span className="min-w-0 flex-1 truncate text-white/85">{CLI_INSTALL}</span>
                  <span className="flex items-center gap-1 text-xs text-white/40">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? t('tp.copied') : t('tp.copy')}</span>
                </button>
                <div className="text-white/40">{t('tp.cliInstalled')}</div>
                <div><span style={{ color: ACCENT }}>$</span> <span className="text-white/85">ohax stats</span></div>
                <div className="text-white/55">{t('tp.cliStats')}</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <Reveal><Eyebrow>FAQ</Eyebrow><h2 className="mb-8 text-4xl font-black tracking-tight max-sm:text-3xl">{t('tp.faqH')}</h2></Reveal>
        <div className="relative transition-[padding] duration-300" style={{ paddingBottom: Math.max(0, Math.max(0, ...faqH) - (faqOpen === null ? 0 : faqH[faqOpen] ?? 0)) }}>
        <div ref={faqRef} aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10 text-sm leading-relaxed">
          {FAQ.map(([q, a]) => <div key={q} className="pb-5">{t(a)}</div>)}
        </div>
        <Accordion className="border-t border-white/10" onValueChange={(v) => setFaqOpen(v.length ? Number(String(v[0]).slice(1)) : null)}>
          {FAQ.map(([q, a], i) => <AccordionItem key={q} value={`f${i}`}><AccordionTrigger>{t(q)}</AccordionTrigger><AccordionContent>{t(a)}</AccordionContent></AccordionItem>)}
        </Accordion></div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden border-t border-white/10">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-30 blur-[100px]" style={{ background: `radial-gradient(50% 80% at 50% 120%, ${ACCENT}, transparent)` }} />
        <Reveal className="mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="text-5xl font-black leading-tight tracking-tight max-sm:text-3xl">{t('tp.ctaH1')}<br />{t('tp.ctaH2')}</h2>
          <div className="mt-9 flex justify-center">
            {data.logged_in
              ? <a href={CONFIG.PAGES.DASHBOARD} className={ctaPrimary} style={ctaBg}>{t('tp.toDash')} <ArrowRight className="size-4" /></a>
              : <GlimmLink to="login" className={ctaPrimary} style={ctaBg}>{t('tp.startFree')} <ArrowRight className="size-4" /></GlimmLink>}
          </div>
        </Reveal>
      </section>

      <TopFooter />
    </main>
  )
}
