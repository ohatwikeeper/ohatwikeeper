import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useCrumbs, useCrumbLabels } from './crumbStore'

// 先頭セグメント → 翻訳キー or 固定ラベル(それ以外は公開UUIDとして扱う)
const TOP: Record<string, string> = {
  dashboard: 'nav.dashboard', folder: 'nav.folder', notification: 'nav.notification', 'r-links': 'nav.rlinks', settings: 'nav.settings',
  settings_api: 'bc.settingsApi', recap: 'nav.dashboard', tools: 'nav.tools', search: 'nav.search', dev: 'nav.dev',
  terminal: 'nav.terminal', howtouse: 'nav.howtouse', patchnote: 'nav.patchnote', terms: 'nav.terms', policy: 'nav.policy',
  ranking: 'nav.ranking', cli: 'nav.cli', diff: 'nav.diff', survey: 'nav.survey', extensions: 'nav.extension', details: 'bc.details', u: 'bc.user',
}
const SUB: Record<string, string> = {
  get_tweeturl: 'bc.tweeturl', search_ohatwi: 'bc.searchOhatwi', 'api-docs': 'bc.apiDocs', today: 'bc.today', webhook: 'Webhook', log: 'bc.log',
  result: 'bc.result', awards: 'bc.awards', graph: 'bc.graph', gallery: 'bc.gallery', recap: 'bc.recap', folders: 'bc.folder', folder: 'bc.folder', grass: 'bc.graph',
}
// 実在しない中間パスは、リンク先をここへ寄せる
const LINK_TO: Record<string, string> = { '/tools/get_tweeturl/search': '/tools/get_tweeturl', '/settings/webhook': '/settings' }

/** 現在のパスをパンくずで表示する(全ページ共通) */
export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const segs = pathname.replace(/\.php$/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const label = (seg: string, i: number) => {
    if (names[seg]) return names[seg]
    if (i === 0) { const k = TOP[seg]; return k ? (/^(nav|bc)\./.test(k) ? t(k) : k) : seg }
    if (segs[0] === 'tools' && seg === 'search') return t('bc.filter')
    return SUB[seg] ? (SUB[seg].startsWith('bc.') ? t(SUB[seg]) : SUB[seg]) : seg
  }
  const over = useCrumbs()
  const names = useCrumbLabels()
  const crumbs = segs.length ? segs : ['']
  let acc = ''
  if (over) return <CrumbList items={over} />
  return (
    <nav aria-label={t('bc.label')} className="flex min-w-0 items-center gap-2 text-sm">
      {crumbs.map((seg, i) => {
        acc += seg ? '/' + encodeURIComponent(seg) : ''
        const last = i === crumbs.length - 1
        const text = seg ? label(seg, i) : t('nav.dashboard')
        const to = LINK_TO[acc] ?? (acc || '/')
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-d-text3" />}
            {last
              ? <span className="truncate font-medium text-d-text" aria-current="page">{text}</span>
              : <Link to={to} className="truncate text-d-text2 transition-colors hover:text-d-text">{text}</Link>}
          </Fragment>
        )
      })}
    </nav>
  )
}

function CrumbList({ items }: { items: { label: string; to?: string }[] }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('bc.label')} className="flex min-w-0 items-center gap-2 text-sm">
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-d-text3" />}
          {c.to && i < items.length - 1
            ? <Link to={c.to} className="truncate text-d-text2 transition-colors hover:text-d-text">{c.label}</Link>
            : <span className={`truncate ${i === items.length - 1 ? 'font-medium text-d-text' : 'text-d-text2'}`} aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  )
}
