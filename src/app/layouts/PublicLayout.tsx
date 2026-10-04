import { useTranslation } from 'react-i18next'
import { PageLoader } from '@/components/ui/page-loader'
import SiteLayout from '@/app/layouts/SiteLayout'
import ErrorPage from '@/components/dashboard-ui/ErrorPage'
import SiteFooter from '@/components/dashboard-ui/SiteFooter'
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation, useParams, Navigate } from 'react-router-dom'
import { SidebarSlot } from '@/app/layouts/AppShell'
import type { Profile, Stats } from '@/lib/dashboard/types'
import type { PublicCtx } from '@/app/layouts/publicContext'
import { useSetCrumbLabel } from './crumbStore'
import { PublicProfileCard, PublicMenu, PublicShare, PublicCli } from '@/features/profile/PublicSidebar'

interface ProfileData {
  public_uuid: string
  is_public: boolean
  share_url?: string
  profile?: Profile
  stats?: Stats
  error?: string
}

const Centered = ({ icon, text }: { icon: string; text: string }) => (
  <div className="dash-scope dash-shell grid place-items-center px-4 text-center">
    <div className="max-w-md rounded-2xl border border-d-border bg-d-med p-8">
      <i className={`bx ${icon} mb-3 text-4xl text-d-text3`} />
      <p className="text-d-text2">{text}</p>
    </div>
  </div>
)

export default function PublicLayout() {
  const { t: tr } = useTranslation()
  const { publicUuid } = useParams<{ publicUuid: string }>()
  const location = useLocation()
  const [data, setData] = useState<ProfileData | null>(null)
  const [canonical, setCanonical] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pf = data?.profile
  useSetCrumbLabel(publicUuid, pf?.name ? `${pf.name}${pf.screen_name ? ` @${pf.screen_name}` : ''} (${publicUuid})` : undefined)

  const active = location.pathname.endsWith('/graph') ? 'graph' : location.pathname.endsWith('/awards') ? 'awards' : location.pathname.endsWith('/gallery') ? 'gallery' : /\/recap(\/|$)/.test(location.pathname) ? 'recap' : /\/folders?(\/|$)/.test(location.pathname) ? 'folders' : 'records'

  useEffect(() => {
    if (!publicUuid) return
    setData(null); setError(null); setCanonical(null)
    fetch(`/app-api/view/profile-data?uuid=${encodeURIComponent(publicUuid)}`)
      .then((r) => r.json())
      .then((d: ProfileData) => {
        if (d.error) return setError(d.error)
        setData(d)
        fetch(`/app-api/view/canonical-uuid?uuid=${encodeURIComponent(publicUuid)}`).then((r) => r.json()).then((c) => c.public_uuid && setCanonical(c.public_uuid)).catch(() => {})
      })
      .catch(() => setError(tr('gl.fail')))
  }, [publicUuid])

  // 大文字小文字違いのURLは正規の public_uuid へ 301 相当で寄せる(PHP版 gallery.php / folder_view.php と同じ)
  const canon = canonical
  if (canon && publicUuid && canon !== publicUuid && canon.toLowerCase() === publicUuid.toLowerCase())
    return <Navigate to={{ pathname: location.pathname.replace(/^\/[^/]+/, `/${canon}`), search: location.search, hash: location.hash }} replace />
  if (error && /not found|invalid uuid|見つかりません/i.test(error)) return <SiteLayout><ErrorPage kind="user_not_found" /></SiteLayout>
  if (error) return <Centered icon="bx-error-circle" text={error} />
  if (!data) return <PageLoader />
  if (!data.is_public || !data.profile || !data.stats) return <Centered icon="bx-lock-alt" text={tr('cn.private')} />

  const ctx: PublicCtx = { publicUuid: publicUuid!, profile: data.profile, stats: data.stats }

  return (
    <>
      <SidebarSlot>
        <PublicProfileCard key="profile" profile={data.profile} publicUuid={publicUuid!} />
        <PublicMenu key="menu" publicUuid={publicUuid!} active={active} />
        <PublicShare key="share-card" profile={data.profile} shareUrl={data.share_url ?? ''} />
        <PublicCli key="cli" publicUuid={publicUuid!} />
        <div key="footer" className="max-lg:hidden"><SiteFooter /></div>
      </SidebarSlot>
      <div className="pt-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet context={ctx} />
        </Suspense>
      </div>
    </>
  )
}
