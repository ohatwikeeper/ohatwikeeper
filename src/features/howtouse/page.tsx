import JaOnlyNotice from '@/components/dashboard-ui/JaOnlyNotice'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DOC_SECTIONS } from './sections'
import { CATEGORY_ORDER, DOC_PAGES, pagesOf } from './docs'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useSetCrumbs } from '@/app/layouts/crumbStore'
import { ChevronRight } from 'lucide-react'

const BASE = '/howtouse'
const href = (sec: string, sub?: string) => (sub ? `${BASE}/${sec}/${sub}` : `${BASE}/${sec}`)

/** 使い方ガイド: 章 → ページの2階層。/howtouse(トップ) /howtouse/:章(章の目次) /howtouse/:章/:ページ(本文) */
export default function HowToUsePage() {
  const { t: tr } = useTranslation()
  const { section: secId, sub } = useParams<{ section?: string; sub?: string }>()
  const section = DOC_SECTIONS.find((s) => s.id === secId)
  const pages = section ? pagesOf(section.id) : []
  const page = section && sub ? pages.find((p) => p.slug === sub) : undefined
  const idx = page ? DOC_PAGES.indexOf(page) : -1
  const prev = idx > 0 ? DOC_PAGES[idx - 1] : null
  const next = idx >= 0 && idx < DOC_PAGES.length - 1 ? DOC_PAGES[idx + 1] : null
  const [tocOpen, setTocOpen] = useState(false)
  // 表示中のカテゴリを手動で折りたたむ(ページを移動すると解除)
  const [folded, setFolded] = useState<string | null>(null)
  useEffect(() => { setFolded(null) }, [section?.id])

  const title = page?.title ?? section?.title ?? tr('lp.guide')
  useSetCrumbs([
    { label: tr('lp.guide'), to: BASE },
    ...(section ? [{ label: section.shortTitle, to: href(section.id) }] : []),
    ...(page ? [{ label: page.title }] : []),
  ], `${secId}/${sub}`)
  useEffect(() => {
    document.title = `${title} - ${tr('lp.guide')} - おはツイKeeper`
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
    setTocOpen(false)
  }, [title, secId, sub, tr])

  const tree = (
    <nav aria-label={tr('lp.guideToc')} className="space-y-5">
      {CATEGORY_ORDER.map((cat) => {
        const secs = DOC_SECTIONS.filter((s) => s.category === cat)
        if (!secs.length) return null
        return (
          <div key={cat}>
            <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-d-text3">{cat}</div>
            {secs.map((s) => {
              const current = s.id === section?.id
              const open = current && folded !== s.id
              return (
                <div key={s.id}>
                  <Link to={href(s.id)} onClick={(e) => { if (current) { e.preventDefault(); setFolded(open ? s.id : null) } }} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${current ? 'font-bold text-d-text' : 'text-d-text2 hover:bg-d-med'}`}>
                    <i className={`bx ${s.icon} text-sm`} />{s.shortTitle}
                    <ChevronRight className={`ml-auto size-3 transition-transform ${open ? 'rotate-90' : ''}`} />
                  </Link>
                  {open && (
                    <div className="mb-1 ml-4 border-l border-d-border pl-2">
                      {pagesOf(s.id).map((p) => (
                        <Link key={p.slug} to={href(s.id, p.slug)} aria-current={p.slug === sub ? 'page' : undefined}
                          className={`block rounded-md px-2 py-1 text-xs transition ${p.slug === sub ? 'bg-d-med font-bold text-d-text' : 'text-d-text3 hover:text-d-text'}`}>{p.title}</Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </nav>
  )

  const card = 'no-hover-bg group rounded-xl border border-d-border bg-d-med p-4 transition-colors hover:border-d-text3'
  return (
    <div className="py-6">
      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-0 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto">
          <button type="button" className="mb-3 flex w-full items-center justify-between rounded-lg border border-d-border px-3 py-2 text-xs font-semibold text-d-text2 lg:hidden"
            onClick={() => setTocOpen((v) => !v)} aria-expanded={tocOpen}>
            {tr('lp.toc')}<i className={`bx bx-chevron-down text-base transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`${tocOpen ? 'block' : 'hidden'} mb-4 lg:mb-0 lg:block`}>{tree}</div>
        </aside>

        <main className="min-w-0">
          {!section ? (
            <>
              <PageHeader iconNode={<i className="bx bx-book-open text-2xl text-d-text2" />} title={tr('lp.guide')} />
              <p className="my-3 text-sm text-d-text2">{tr('lp.guideIntro')}</p>
              <JaOnlyNotice className="mb-4" />
              {CATEGORY_ORDER.map((cat) => (
                <section key={cat} className="mt-8">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-d-text3">{cat}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DOC_SECTIONS.filter((s) => s.category === cat).map((s) => (
                      <Link key={s.id} to={href(s.id)} className={card}>
                        <div className="flex items-center gap-2 text-sm font-bold text-d-text"><i className={`bx ${s.icon} text-lg text-d-text2`} />{s.title}</div>
                        <div className="mt-2 text-xs leading-5 text-d-text3">{pagesOf(s.id).map((p) => p.title).join(' / ')}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : !page ? (
            <>
              <PageHeader iconNode={<i className={`bx ${section.icon} text-2xl text-d-text2`} />} title={section.title} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pages.map((p, i) => (
                  <Link key={p.slug} to={href(section.id, p.slug)} className={card}>
                    <div className="text-[10px] font-bold text-d-text3">{String(i + 1).padStart(2, '0')}</div>
                    <div className="mt-1 text-sm font-bold text-d-text">{p.title}</div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <JaOnlyNotice className="mb-3" />
              <div className="mb-2 text-xs text-d-text3">{section.category} ・ {section.title}</div>
              <PageHeader iconNode={<i className={`bx ${section.icon} text-2xl text-d-text2`} />} title={page.title} />
              <div className="prose-content mb-8 max-w-none">{page.content}</div>
              <div className="mb-6 grid gap-4 border-t border-d-border/60 pt-6 sm:grid-cols-2">
                {prev ? <Link to={href(prev.section.id, prev.slug)} className={`${card} text-left`}><div className="mb-1 text-[10px] font-bold text-d-text3">{tr('lp.prev')}</div><div className="truncate text-xs font-bold text-d-text">{prev.title}</div></Link> : <div />}
                {next ? <Link to={href(next.section.id, next.slug)} className={`${card} text-right`}><div className="mb-1 text-[10px] font-bold text-d-text3">{tr('lp.next')}</div><div className="truncate text-xs font-bold text-d-text">{next.title}</div></Link> : <div />}
              </div>
            </>
          )}
          <div className="rounded-xl border border-d-border bg-d-med p-5 text-center">
            <p className="mb-3 text-xs text-d-text2">{tr('lp.unsolved')}</p>
            <div className="flex justify-center gap-3">
              <a href="https://discord.ohatwikeeper.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-2 text-xs font-bold text-white"><i className="bx bxl-discord" /> {tr('lp.discord')}</a>
              <a href="https://x.com/Lapius7" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-d-border px-3 py-2 text-xs font-semibold text-d-text hover:border-d-text3"><i className="bx bxl-twitter" /> {tr('lp.contact')}</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
