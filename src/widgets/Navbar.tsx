import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '@/lib/config'
import GlimmLink from '@/widgets/GlimmLink'

interface SessionData {
  logged_in: boolean
  public_uuid: string | null
  x_username: string | null
}

// ヘッダーは常に「おはツイKeeper｜ページ名」。先頭一致で判定する(上から順に評価)
const PAGE_NAMES: [string, string][] = [
  ['/dashboard', 'nb.dashboard'], ['/howtouse', 'nb.howtouse'], ['/patchnote', 'nb.patchnote'], ['/terms', 'nb.terms'], ['/policy', 'nb.privacy'],
  ['/extensions', 'nb.extensions'], ['/ranking', 'nb.ranking'], ['/cli', 'CLI'], ['/r-links', 'nb.links'],
  ['/notification', 'nb.notification'], ['/folder', 'nb.folder'], ['/recap', 'nb.recap'], ['/diff', 'nb.diff'],
  ['/details', 'nb.details'], ['/survey/favoriteohatwiworld', 'nb.survey'], ['/tools', 'nb.tools'], ['/settings', 'nb.settings'],
  ['/search', 'nb.search'], ['/dev', 'nb.dev'],
]
function pageNameOf(pathname: string): string | null {
  if (pathname === '/') return 'nb.top'
  const hit = PAGE_NAMES.find(([p]) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '.'))
  if (hit) return hit[1]
  const seg = pathname.split('/').filter(Boolean)
  if (seg.length === 1) return 'nb.public'
  return ({ graph: 'nb.graph', awards: 'nb.awards', gallery: 'nb.gallery', recap: 'nb.recap', folder: 'nb.folder' } as Record<string, string>)[seg[1]] ?? 'nb.public'
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const pk = pageNameOf(pathname)
  const pageName = pk ? t(pk) : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    services: false,
    misc: false,
  })
  const [session, setSession] = useState<SessionData | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [copyIcon, setCopyIcon] = useState('bx-link')
  const [copyActive, setCopyActive] = useState(false)
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function copyShortUrl() {
    // ベータ環境では ohax.pw 側が ?beta でベータへ振り分ける
    const isBeta = window.location.hostname.startsWith('beta.')
    const q = window.location.search
    const shortUrl = 'https://ohax.pw' + window.location.pathname + (isBeta ? (q ? q + '&beta' : '?beta') : q)
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopyIcon('bx-check')
      setCopyActive(true)
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
      copyResetTimer.current = setTimeout(() => {
        setCopyIcon('bx-link')
        setCopyActive(false)
      }, 1500)
    }).catch(err => {
      console.error('URLのコピーに失敗しました: ', err)
    })
  }

  useEffect(() => {
    fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(setSession)
      .catch(() => setSession({ logged_in: false, public_uuid: null, x_username: null }))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  function toggleSection(section: string) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const isLoggedIn = session?.logged_in ?? false

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <GlimmLink to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <i className="bx bxs-sun" />
          <span>
            おはツイKeeper
            {pageName && (
              <span style={{ color: 'var(--navbar-muted)', fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>｜{pageName}</span>
            )}
          </span>
        </GlimmLink>

        <div className="nav-right-group">
          {window.location.hostname === 'ohatwikeeper.com' && (
            <button
              className="mobile-menu-button"
              aria-label={t('nb.copyShort')}
              title={t('nb.copyShort')}
              onClick={copyShortUrl}
              style={copyActive ? { borderColor: 'var(--navbar-accent)' } : undefined}
            >
              <i className={`bx ${copyIcon}`} />
            </button>
          )}
          <div className="mobile-menu-container" ref={dropdownRef}>
            <button className="mobile-menu-button" aria-label={t('nb.openMenu')} aria-expanded={menuOpen} onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}>
              <i className="bx bx-menu" />
            </button>
            <div className={`mobile-dropdown${menuOpen ? ' visible' : ''}`} onClick={e => e.stopPropagation()}>

              {isLoggedIn && (
                <>
                  <button className="menu-section-toggle open" onClick={() => toggleSection('my')}>
                    <span className="toggle-label"><i className="bx bx-user-circle" />{t('nb.mypage')}</span>
                    <i className={`bx bx-chevron-down toggle-arrow${openSections.my ? ' open' : ''}`} />
                  </button>
                  <div className={`menu-section-body${openSections.my ? ' open' : ''}`}>
                    <a href={CONFIG.PAGES.PROFILE(session?.public_uuid || '')} className="menu-item"><i className="bx bx-user-circle" />{t('nb.yourPublic')}</a>
                    <a href={CONFIG.PAGES.PROFILE(session?.public_uuid || '') + '/awards'} className="menu-item"><i className="bx bxs-award" />{t('nb.awards')}</a>
                    <a href={CONFIG.PAGES.PROFILE(session?.public_uuid || '') + '/graph'} className="menu-item"><i className="bx bx-line-chart" />{t('nb.graph')}</a>
                    <a href={CONFIG.PAGES.PROFILE(session?.public_uuid || '') + '/gallery'} className="menu-item"><i className="bx bx-grid-alt" />{t('nb.galleryImg')}</a>
                    <a href={CONFIG.PAGES.PROFILE(session?.public_uuid || '') + '/rss'} className="menu-item"><i className="bx bx-rss" />{t('nb.rss')}</a>
                  </div>
                  <div className="divider" />
                </>
              )}

              {isLoggedIn && (
                <>
                  <button className="menu-section-toggle open" onClick={() => toggleSection('account')}>
                    <span className="toggle-label"><i className="bx bx-cog" />{t('nb.account')}</span>
                    <i className={`bx bx-chevron-down toggle-arrow${openSections.account ? ' open' : ''}`} />
                  </button>
                  <div className={`menu-section-body${openSections.account ? ' open' : ''}`}>
                    <a href={CONFIG.PAGES.DASHBOARD} className="menu-item"><i className="bx bxs-dashboard" />{t('nb.dashboard')}</a>
                    <a href={CONFIG.PAGES.FOLDER} className="menu-item"><i className="bx bx-folder" />{t('nb.folder')}</a>
                    <a href={CONFIG.PAGES.RECAP()} className="menu-item"><i className="bx bx-calendar-star" />{t('nb.recap')}</a>
                    <a href={CONFIG.PAGES.NOTIFICATIONS} className="menu-item"><i className="bx bx-bell" />{t('nb.notification')}</a>
                    <a href={CONFIG.PAGES.R_LINKS} className="menu-item"><i className="bx bx-link" />{t('nb.linksManage')}</a>
                    <a href={CONFIG.PAGES.TOOLS} className="menu-item"><i className="bx bx-wrench" />{t('nb.handyTools')}</a>
                    <a href={CONFIG.PAGES.SETTINGS} className="menu-item"><i className="bx bx-cog" />{t('nb.settings')}</a>
                    <a href={'/settings'} className="menu-item"><i className="bx bx-envelope" />{t('nb.emailSettings')}</a>
                  </div>
                  <div className="divider" />
                </>
              )}

              <button className="menu-section-toggle" onClick={() => toggleSection('services')}>
                <span className="toggle-label"><i className="bx bx-grid-alt" />{t('nb.service')}</span>
                <i className={`bx bx-chevron-down toggle-arrow${openSections.services ? ' open' : ''}`} />
              </button>
              <div className={`menu-section-body${openSections.services ? ' open' : ''}`}>
                <a href={CONFIG.PAGES.HOME} className="menu-item"><i className="bx bx-home" />{t('nb.topPage')}</a>
                <a href={CONFIG.PAGES.SEARCH} className="menu-item"><i className="bx bx-search" />{t('nb.search')}</a>
                <a href={CONFIG.PAGES.RANKING} className="menu-item"><i className="bx bx-trophy" />{t('nb.ranking')}</a>
                <a href={CONFIG.PAGES.DIFF()} className="menu-item"><i className="bx bx-git-compare" />{t('nb.userDiff')}</a>
                <a href={CONFIG.PAGES.SURVEY()} className="menu-item"><i className="bx bx-poll" />{t('nb.survey')}</a>
                <a href={CONFIG.EXTERNAL.TIMELINE} className="menu-item"><i className="bx bx-spreadsheet" />おはツイTimeline</a>
                <a href={CONFIG.EXTERNAL.PROFILE_CARD} className="menu-item"><i className="bx bx-id-card" />Profile Card</a>
                <a href={CONFIG.PAGES.CLI_TOOLS} className="menu-item"><i className="bx bx-terminal" />{t('nb.terminal')}</a>
              </div>

              <div className="divider" />
              <button className="menu-section-toggle" onClick={() => toggleSection('misc')}>
                <span className="toggle-label"><i className="bx bx-dots-horizontal-rounded" />{t('nb.more')}</span>
                <i className={`bx bx-chevron-down toggle-arrow${openSections.misc ? ' open' : ''}`} />
              </button>
              <div className={`menu-section-body${openSections.misc ? ' open' : ''}`}>
                <a href={CONFIG.PAGES.HOW_TO_USE} className="menu-item small"><i className="bx bx-book-open" />{t('nb.usage')}</a>
                <a href={CONFIG.EXTERNAL.API_DOCS} target="_blank" rel="noopener" className="menu-item small"><i className="bx bx-code-alt" />{t('nb.apiDocs')}</a>
                <a href={CONFIG.PAGES.PATCHNOTES} className="menu-item small"><i className="bx bx-history" />{t('nb.updateHistory')}</a>
                <a href={CONFIG.PAGES.EXTENSIONS} className="menu-item small"><i className="bx bxl-chrome" />{t('nb.browserExt')}</a>
                <a href={CONFIG.PAGES.POLICY} className="menu-item small"><i className="bx bx-file" />{t('nb.termsPrivacy')}</a>
                <a href={CONFIG.EXTERNAL.STATUS} target="_blank" rel="noopener" className="menu-item small"><i className="bx bx-pulse" />{t('nb.status')}</a>
                <a href={CONFIG.PAGES.DEV} className="menu-item small"><i className="bx bx-user-circle" />{t('nb.aboutDev')}</a>
              </div>

              <div className="divider" />
              {isLoggedIn ? (
                <a href={CONFIG.EXTERNAL.LOGOUT} className="menu-item small"><i className="bx bx-log-out" />{t('nb.logout')}</a>
              ) : (
                <a href={CONFIG.EXTERNAL.X_LOGIN()} className="menu-item"><i className="bx bx-log-in-circle" />{t('nb.login')}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
