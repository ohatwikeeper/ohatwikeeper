import type { ReactNode } from 'react'
import { SidebarSlot } from '@/app/layouts/AppShell'
import MobileMenu from '@/components/dashboard-ui/MobileMenu'
import { Outlet, useLocation } from 'react-router-dom'
import { shareText } from '@/lib/shareText'
import ShareCard from '@/components/dashboard-ui/ShareCard'
import SiteFooter from '@/components/dashboard-ui/SiteFooter'
import SiteLinks, { PUBLIC_LINKS, OWNER_LINKS, GUIDE_LINKS } from '@/components/dashboard-ui/SiteLinks'
import { loginHref } from '@/components/dashboard-ui/LoginRequired'
import { useSession } from '@/lib/session'
import SetupProfileHeader from '@/features/profile/SetupProfileHeader'
import ProfileHeader from '@/features/profile/ProfileHeader'
import GuestToolbar from '@/components/dashboard-ui/GuestToolbar'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/lib/dashboard/hooks'
import { useDashTheme } from '@/lib/dashboard/theme'

// みんなで見る系(ランキング/検索/比較/アンケート等)共通: 左サイドバー固定・右側のみページ切替。
// ログイン済みならダッシュボードと同じサイドバー、未ログインならプロフィール枠をログイン案内にする
export default function SiteLayout({ children }: { children?: ReactNode } = {}) {
  const { pathname, search } = useLocation()
  const { data, error } = useDashboard()
  // dashboard API が未取得/412でも、リンクのグループが欠けないようセッションのUUIDで補う
  const sess = useSession()
  const myUuid = sess.public_uuid ?? undefined
  const { t } = useTranslation()
  const { theme, toggleTheme, accent, setAccent } = useDashTheme()
  // 前方一致が重なる場合は、最も長く一致したリンクを選ぶ
  const activeTo = [...PUBLIC_LINKS, ...GUIDE_LINKS, ...OWNER_LINKS]
    .filter((l) => pathname === l.to || pathname.startsWith(`${l.to}/`) || pathname.startsWith(`${l.to}.`))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to
  const loggedIn = !!data?.account
  // 判定前はゲスト表示を出さない(ログイン済みでも一瞬ゲストUIが見えるのを防ぐ)
  const resolved = !!data || !!error
  // ohax.pw の短縮URL。ベータ環境では ?beta でベータへ振り分けられる
  const isBeta = window.location.hostname.startsWith('beta.')
  const shortUrl = 'https://ohax.pw' + pathname + (isBeta ? (search ? search + '&beta' : '?beta') : search)
  return (
    <>
      <SidebarSlot>
        {loggedIn && data && <ProfileHeader key="profile" profile={data.profile} theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />}
        {resolved && !loggedIn && sess.logged_in && <SetupProfileHeader key="profile" />}
        {resolved && !loggedIn && !sess.logged_in && <GuestToolbar key="profile" loginHref={loginHref(pathname + search)} />}
        <MobileMenu key="menu"><SiteLinks uuid={data?.account?.public_uuid ?? myUuid} mineLabel={t('nav.profile')} activeTo={activeTo} /></MobileMenu>
        <ShareCard key="share-card" url={shortUrl} title={document.title} text={shareText(t, pathname)} />
        <div key="footer" className="max-lg:hidden"><SiteFooter /></div>
      </SidebarSlot>
      {children ?? <Outlet />}
      <div className="pb-8 lg:hidden"><SiteFooter /></div>
    </>
  )
}
