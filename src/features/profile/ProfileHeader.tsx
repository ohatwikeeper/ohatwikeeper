import { useNavigate } from 'react-router-dom'
import { Compass, LogOut, Palette } from 'lucide-react'
import { askLogout } from '@/widgets/LogoutDialog'
import type { Profile } from '@/lib/dashboard/types'
import { useTranslation } from 'react-i18next'
import { fmt, joinedLabel } from '@/lib/dashboard/format'
import type { DashTheme } from '@/lib/dashboard/theme'
import OwnerBadge from '@/features/profile/OwnerBadge'
import LanguageSwitcher from '@/components/dashboard-ui/LanguageSwitcher'
import ThemeToggle from '@/features/profile/ThemeToggle'
import BioText from '@/features/profile/BioText'
import { Link } from 'react-router-dom'
import NotificationBell from '@/features/profile/NotificationBell'
import Tip from '@/components/dashboard-ui/Tip'

export default function ProfileHeader({ profile, onTour, theme, onToggleTheme }: {
  profile: Profile
  onTour?: () => void
  theme: DashTheme
  onToggleTheme: (x: number, y: number) => void
  accent: string
  onAccent: (name: string) => void
}) {
  const nav = useNavigate()
  const { t, i18n } = useTranslation()
  const showX = profile.has_x_linked
  const nums: [string, number][] = [
    ...(showX ? ([['Following', profile.following], ['Followers', profile.followers], ['Tweets', profile.tweets]] as [string, number][]) : []),
    ['Views', profile.page_views],
  ]
  return (
    <section id="profile-header">
      <OwnerBadge own />
      {profile.banner_url && (
        <img src={profile.banner_url} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      )}
      <div className="flex items-start justify-between">
        <img className={`size-20 rounded-full bg-d-light ${profile.banner_url ? 'border-4 border-background -mt-10' : ''}`} src={profile.avatar_url} alt="" />
        <div className="flex items-center gap-1">
          {onTour && (
          <Tip label={t('nb.tour')}>
            <button
              type="button"
              onClick={onTour}
              aria-label={t('nb.tour')}
              data-cuelume-skip
              className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text"
            >
              <Compass className="size-[18px]" />
            </button>
          </Tip>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
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
          <LanguageSwitcher compact />
          <NotificationBell />
          <Tip label={t('nb.logout')}>
            <button
              type="button"
              onClick={askLogout}
              aria-label={t('nb.logout')}
              data-cuelume-skip
              className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-red-400"
            >
              <LogOut className="size-[18px]" />
            </button>
          </Tip>
        </div>
      </div>
      <h1 className="mt-4 font-[family-name:var(--d-serif)] text-2xl font-semibold tracking-tight leading-tight">
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
