import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// 閲覧者(誰でも)向け
export const PUBLIC_LINKS: { to: string; label: string; icon: string }[] = [
  { to: '/ranking', label: 'nav.ranking', icon: 'bx-bar-chart-alt-2' },
  { to: '/search', label: 'nav.search', icon: 'bx-search' },
  { to: '/diff', label: 'nav.diff', icon: 'bx-git-compare' },
  { to: '/survey', label: 'nav.survey', icon: 'bx-poll' },
]
// 使い方・連携ツール
export const GUIDE_LINKS: { to: string; label: string; icon: string; external?: boolean }[] = [
  { to: '/howtouse', label: 'nav.howtouse', icon: 'bx-book-open' },
  { to: '/cli', label: 'nav.cli', icon: 'bx-terminal' },
  { to: '/extension', label: 'nav.extension', icon: 'bx-extension' },
  { to: '/tools', label: 'nav.tools', icon: 'bx-wrench' },
 { to: '/patchnote', label: 'nav.patchnote', icon: 'bx-news' },
 { to: '/api-docs', label: 'nav.apidocs', icon: 'bx-code-curly' },
 { to: '/terminal', label: 'nav.terminal', icon: 'bx-terminal' },
 { to: '/dev', label: 'nav.dev', icon: 'bx-code-alt' },
 { to: '/terms', label: 'nav.terms', icon: 'bx-file' },
  { to: '/policy', label: 'nav.policy', icon: 'bx-shield-quarter' },
]
// 自分のデータを管理する人(ログインユーザー)向け
export const OWNER_LINKS: { to: string; label: string; icon: string }[] = [
  { to: '/dashboard', label: 'nav.dashboard', icon: 'bx-home-alt' },
  { to: '/folder', label: 'nav.folder', icon: 'bx-folder' },
  { to: '/notification', label: 'nav.notification', icon: 'bx-bell' },
  { to: '/r-links', label: 'nav.rlinks', icon: 'bx-link' },
  { to: '/settings', label: 'nav.settings', icon: 'bx-cog' },
]

const mine = (u: string, own: boolean) => [
  { to: `/${u}`, label: own ? 'nb.myPublic' : 'nb.home', icon: 'bx-user-circle' },
  { to: `/${u}/awards`, label: own ? 'nb.myAwards' : 'nb.awards', icon: 'bxs-trophy' },
  { to: `/${u}/graph`, label: own ? 'nb.myGraph' : 'nb.graph', icon: 'bx-line-chart' },
  { to: `/${u}/gallery`, label: own ? 'nb.myGallery' : 'nb.gallery', icon: 'bx-grid-alt' },
  { to: `/${u}/recap`, label: own ? 'nb.myRecap' : 'nb.recap', icon: 'bx-calendar-star' },
  { to: `/${u}/folder`, label: own ? 'nb.myFolder' : 'nb.folder', icon: 'bx-folder-open' },
]

export default function SiteLinks({ className = '', uuid, mineLabel, activeTo, highlightTo, owner = true }: { owner?: boolean; className?: string; uuid?: string; mineLabel?: string; activeTo?: string; highlightTo?: string }) {
  const { t } = useTranslation()
  const List = ({ items }: { items: typeof GUIDE_LINKS }) => (
    <ul className="grid grid-cols-2 gap-x-4">
      {items.map((l, i) => (
        <li key={l.to}>
          {l.external ? (
            <a href={l.to}
              className={`no-underline flex items-center gap-2 ${i >= items.length - (items.length % 2 || 2) ? '' : 'border-b border-d-border/50'} py-2 text-[13px] font-medium transition-colors ${l.to === (highlightTo ?? activeTo) ? '!text-d-accent' : '!text-d-text2 hover:!text-d-text'}`}>
            <i className={`bx ${l.icon} text-base text-d-text3`} />{t(l.label, { defaultValue: l.label })}
            </a>
          ) : (
            <Link to={l.to}
              className={`no-underline flex items-center gap-2 ${i >= items.length - (items.length % 2 || 2) ? '' : 'border-b border-d-border/50'} py-2 text-[13px] font-medium transition-colors ${l.to === (highlightTo ?? activeTo) ? '!text-d-accent' : '!text-d-text2 hover:!text-d-text'}`}>
            <i className={`bx ${l.icon} text-base text-d-text3`} />{t(l.label, { defaultValue: l.label })}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
  const head = 'mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-d-text3'
  return (
    <nav id="site-links" aria-label={t('nav.aria')} className={className}>
      {uuid && (
        <>
          <div className={head}>{mineLabel ?? t('nav.profile')}</div>
          <List items={mine(uuid, false)} />
          <div className="my-5 h-px bg-d-border" />
        </>
      )}
      <div className={head}>{t('nav.group.public')}</div>
      <List items={PUBLIC_LINKS} />
      {uuid && owner && (
        <>
          <div className="my-5 h-px bg-d-border" />
          <div className={head}>{t('nav.group.owner')}</div>
          <List items={OWNER_LINKS} />
        </>
      )}
      <div className="my-5 h-px bg-d-border" />
      <div className={head}>{t('nav.group.guide')}</div>
      <List items={GUIDE_LINKS} />
    </nav>
  )
}
