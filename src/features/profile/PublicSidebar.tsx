import { useLocation, useNavigate } from 'react-router-dom'
import { Languages, Palette, Sun } from 'lucide-react'
import IconStack from '@/components/dashboard-ui/IconStack'
import AuthButton from '@/components/dashboard-ui/AuthButton'
import MobileMenu from '@/components/dashboard-ui/MobileMenu'
import SiteLinks from '@/components/dashboard-ui/SiteLinks'
import { useDashboard } from '@/lib/dashboard/hooks'
import { Link } from 'react-router-dom'
import type { Profile } from '@/lib/dashboard/types'
import { useTranslation } from 'react-i18next'
import { fmt, joinedLabel } from '@/lib/dashboard/format'
import { useDashTheme } from '@/lib/dashboard/theme'
import ThemeToggle from '@/features/profile/ThemeToggle'
import BioText from '@/features/profile/BioText'
import OhaxCliCard from '@/features/share/OhaxCliCard'
import { shareText } from '@/lib/shareText'
import ShareCard from '@/components/dashboard-ui/ShareCard'
import OwnerBadge from '@/features/profile/OwnerBadge'
import { useSession } from '@/lib/session'
import Tip from '@/components/dashboard-ui/Tip'

type PageKey = 'records' | 'graph' | 'awards' | 'gallery' | 'recap' | 'folders'

const NAV: { key: PageKey; label: string; icon: string; to: (u: string) => string; external?: boolean }[] = [
  { key: 'records', label: 'nb.home', icon: 'bx-home-alt', to: (u) => `/${u}` },
  { key: 'awards', label: 'nb.awards', icon: 'bxs-trophy', to: (u) => `/${u}/awards` },
  { key: 'graph', label: 'nb.graph', icon: 'bx-line-chart', to: (u) => `/${u}/graph` },
  { key: 'gallery', label: 'nb.gallery', icon: 'bx-grid-alt', to: (u) => `/${u}/gallery` },
  { key: 'recap', label: 'nb.recap', icon: 'bx-calendar-star', to: (u) => `/${u}/recap` },
  { key: 'folders', label: 'nb.folder', icon: 'bx-folder-open', to: (u) => `/${u}/folder` },
]

export function PublicProfileCard({ profile, publicUuid }: {
  profile: Profile
  publicUuid: string
}) {
  const nav = useNavigate()
  const { t, i18n } = useTranslation()
  const sess = useSession()
  const myUuid = sess.public_uuid
  const own = !!myUuid && myUuid === publicUuid
  const { theme, toggleTheme } = useDashTheme()
  const showX = profile.has_x_linked
  const nums: [string, number][] = [
    ...(showX ? ([['Following', profile.following], ['Followers', profile.followers], ['Tweets', profile.tweets]] as [string, number][]) : []),
    ['Views', profile.page_views],
  ]

  return (
    <section id="public-profile">
      <OwnerBadge own={own} />
      {profile.banner_url && (
        <img src={profile.banner_url} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" />
      )}
      <div className="flex items-start justify-between">
        <img className={`size-20 rounded-full border-4 border-background bg-d-light ${profile.banner_url ? "-mt-10" : ""}`} src={profile.avatar_url} alt="" />
        <div className="flex items-center">
          <IconStack chips={[Sun, Palette, Languages]} total={4}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Tip label={t('nb.themeSettings')}>
            <button
              type="button"
              onClick={() => nav('/settings/theme')}
              aria-label={t('nb.openThemeSettings')}
              data-cuelume-skip
              className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text"
            >
              <Palette className="size-[18px]" />
            </button>
          </Tip>
          <AuthButton />
          </IconStack>
        </div>
      </div>

      <h1 className="mt-4 font-[family-name:var(--d-serif)] text-2xl font-semibold leading-tight tracking-tight">
        {showX ? profile.name : t('nb.user')}
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        {showX && (
          <a href={`https://x.com/${profile.screen_name}`} target="_blank" rel="noopener" title={t('nb.viewOnX')} className="!text-d-text2 hover:!text-d-text">
            @{profile.screen_name}
          </a>
        )}
        {profile.is_developer && <Link to="/dev" className="border border-d-dev px-1.5 text-xs !text-d-dev no-underline">Developer</Link>}
      </div>
      <BioText html={profile.bio_html} />

      {(profile.location || profile.website?.url) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-d-text3">
          {profile.location && <span className="inline-flex items-center gap-1"><i className="bx bx-map" />{profile.location}</span>}
          {profile.website?.url && (
            <a href={profile.website.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 !text-d-text2">
              <i className="bx bx-link" />{profile.website.display_url ?? profile.website.url}
            </a>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-d-text3">{t('nb.joined', { d: joinedLabel(profile.joined, i18n.language) })}</p>

      <dl className="mt-4 grid grid-cols-2 border-t border-d-border text-sm">
        {nums.map(([l, v]) => (
          <div key={l} className="border-b border-d-border py-2">
            <dd className="font-bold tabular-nums">{fmt(v)}</dd>
            <dt className="text-xs text-d-text3">{l}</dt>
          </div>
        ))}
      </dl>

    </section>
  )
}

/** 他レイアウト(SiteLayout)と同じ構造(MobileMenu + SiteLinks)にして、行き来しても再構築されないようにする */
export function PublicMenu({ publicUuid, active }: { publicUuid: string; active: PageKey }) {
  const { t } = useTranslation()
  const dashLoggedIn = !!useDashboard().data?.account
  const sess = useSession()
  // dashboard API が412等で取れなくても、セッション上のログインで管理・設定を出す
  const loggedIn = dashLoggedIn || sess.logged_in
  // 自分のプロフィール上では他ページと同じ見出しにする(他人のときだけ「このユーザー」)
  const own = !!sess.public_uuid && sess.public_uuid === publicUuid
  return (
    <MobileMenu>
      <SiteLinks owner={loggedIn} uuid={publicUuid} mineLabel={own ? t('nav.profile') : t('nb.thisUser')} activeTo={NAV.find((n) => n.key === active)?.to(publicUuid)} />
    </MobileMenu>
  )
}

export function PublicShare({ profile }: { profile: Profile; shareUrl?: string }) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  // 居るページの ohax.pw 短縮URL(ベータ環境は ?beta で振り分け)
  const url = 'https://ohax.pw' + pathname + (window.location.hostname.startsWith('beta.') ? (search ? search + '&beta' : '?beta') : search)
  return <ShareCard url={url} title={t('nb.shareTitle', { name: profile.name })} text={shareText(t, pathname, profile.name)} />
}

export function PublicCli({ publicUuid }: { publicUuid: string }) {
  // 居るページに合ったコマンド(CLIに対応するサブコマンドが無いページは profile / all)
  const sub = useLocation().pathname.split('/')[2] ?? ''
  const cmd = ({ graph: 'graph', awards: 'awards', gallery: 'gallery', recap: 'all' } as Record<string, string>)[sub] ?? 'profile'
  return <div className="max-lg:hidden"><OhaxCliCard command={`ohax ${cmd} ${publicUuid}`} isPublic /></div>
}
