import RouteErrorBoundary from '@/app/RouteErrorBoundary'
import { PageLoader } from '@/components/ui/page-loader'
import { useEffect, Suspense, lazy, type ReactNode } from 'react'
import { loadSession } from '@/lib/session'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { GlimmProvider } from 'glimm/react'
// 効果音は無効化中。再開するには bindGlobalClickSounds を import して useEffect 内で呼ぶ
// import { bindGlobalClickSounds } from '@/lib/cuelume-sound'
import ActionWidget from '@/widgets/ActionWidget'
import CommandPalette from '@/widgets/CommandPalette'
import SplashCursor from '@/widgets/SplashCursor'
import DonationBar from '@/components/dashboard-ui/DonationBar'
import MaintenanceGate from '@/features/maintenance/MaintenanceGate'
import TopPage from '@/pages/top/TopPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'

const GraphPage = lazy(() => import('@/pages/public/GraphPage'))
const AwardsPage = lazy(() => import('@/pages/public/AwardsPage'))
const SearchPage = lazy(() => import('@/pages/search/SearchPage'))
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'))
const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage'))
const PublicLayout = lazy(() => import('@/app/layouts/PublicLayout'))
import AppShell from '@/app/layouts/AppShell'
import SiteLayout from '@/app/layouts/SiteLayout'
import { RequireLogin, RedirectToOwn } from '@/components/dashboard-ui/LoginRequired'
const HandleSearchPage = lazy(() => import('@/features/handle/page'))
const SETTINGS_TABS = ['account', 'notify', 'apikey', 'api', 'webhooks', 'webhook', 'widgets', 'theme', 'email']
/** 未知のタブは設定画面ではなく 404 にする */
function SettingsTabRoute() {
  const { tab } = useParams()
  if (tab && !SETTINGS_TABS.includes(tab)) return <SiteLayout><Suspense fallback={<PageLoader />}><ErrorPage kind="not_found" /></Suspense></SiteLayout>
  return <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
}
const ErrorPage = lazy(() => import('@/components/dashboard-ui/ErrorPage'))
const OnboardPage = lazy(() => import('@/features/onboard/page'))
import OnboardGate from '@/features/onboard/OnboardGate'
const LoginPage = lazy(() => import('@/features/login/page'))
const ConfirmLoginPage = lazy(() => import('@/features/login/confirm'))
const DevPage = lazy(() => import('@/features/dev/page'))
const ApiDocsPage = lazy(() => import('@/features/dev/ApiDocsPage'))
const TerminalPage = lazy(() => import('@/features/dev/TerminalPage'))
const PolicyPage = lazy(() => import('@/features/policy/page'))
const TermsPage = lazy(() => import('@/features/terms/page'))
const ExtensionsPage = lazy(() => import('@/features/extensions/page'))
const PatchnotesPage = lazy(() => import('@/features/patchnotes/page'))
const HowToUsePage = lazy(() => import('@/features/howtouse/page'))
const RankingPage = lazy(() => import('@/features/ranking/page'))
const CliPage = lazy(() => import('@/features/cli/page'))
const RLinksPage = lazy(() => import('@/features/rlinks/page'))
const NotificationDetailPage = lazy(() => import('@/features/notifications/detail'))
const Graph3DPage = lazy(() => import('@/pages/public/Graph3DPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/page'))
const FolderPage = lazy(() => import('@/features/folder/page'))
const FolderViewPage = lazy(() => import('@/features/folder/view'))
const FolderListPage = lazy(() => import('@/features/folder/list'))
const SettingsPage = lazy(() => import('@/features/settings/page'))
const RecapPage = lazy(() => import('@/features/recap/page'))
const DiffPage = lazy(() => import('@/features/diff/page'))
const DetailsPage = lazy(() => import('@/features/details/page'))
const SurveyResultPage = lazy(() => import('@/features/survey/result'))
const WebhookLogPage = lazy(() => import('@/features/settings/webhook-log'))
const SurveyListPage = lazy(() => import('@/features/survey/list'))
const SurveyPage = lazy(() => import('@/features/survey/page'))
const ToolsPage = lazy(() => import('@/features/tools/page'))
const GetTweetUrlPage = lazy(() => import('@/features/tools/GetTweetUrl'))
const SearchOhatwiPage = lazy(() => import('@/features/tools/SearchOhatwi'))

// 重いWebGL流体エフェクトのためデフォルトOFF。戻す場合はtrueをfalseに。
const SPLASH_CURSOR_ENABLED = false

const splashCursorDisabled =
  !SPLASH_CURSOR_ENABLED || new URLSearchParams(window.location.search).get('nocursor') === '1'

function App() {
  useEffect(() => {
    // マウス/タップでボタンを押した後は、その後のキー操作でフォーカス枠(選択状態)が出ないようフォーカスを外す
    const onClick = (e: MouseEvent) => {
      if (e.detail === 0) return // キーボード操作による click は除外
      const b = (e.target as HTMLElement | null)?.closest<HTMLElement>('button, [role=button], summary')
      if (b) requestAnimationFrame(() => b.blur())
    }
    document.addEventListener('click', onClick)
    void loadSession() // CSRFトークンを書き込み系ページ(設定/r-links等)でも使えるようにする
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <BrowserRouter>
      <GlimmProvider palette="azure" brightness={0.85}>
        {!splashCursorDisabled && <SplashCursor />}
        <MaintenanceGate>
        <DonationBar />
        <RouteErrorBoundary>
        <Routes>
            <Route path="/onboard" element={<Suspense fallback={<PageLoader />}><OnboardPage /></Suspense>} />
            <Route path="/onboard/:step" element={<Suspense fallback={<PageLoader />}><OnboardPage /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
            <Route path="/confirm_login" element={<Suspense fallback={<PageLoader />}><ConfirmLoginPage /></Suspense>} />
          <Route path="/" element={<TopPage />} />
          <Route element={<AppShell />}>
          <Route element={<DashboardPage />}>
            <Route path="/dashboard" element={null} />
            <Route path="/r-links/:slug?" element={<Suspense fallback={<PageLoader />}><RLinksPage /></Suspense>} />
            <Route path="/r-links/*" element={<Suspense fallback={<PageLoader />}><RLinksPage /></Suspense>} />
            <Route path="/notification" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
            <Route path="/notification/:code" element={<Suspense fallback={<PageLoader />}><NotificationDetailPage /></Suspense>} />
            <Route path="/notification.php" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
            <Route path="/folder" element={<Suspense fallback={<PageLoader />}><FolderPage /></Suspense>} />
            <Route path="/folder.php" element={<Suspense fallback={<PageLoader />}><FolderPage /></Suspense>} />
            <Route path="/recap" element={<RedirectToOwn suffix="recap" />} />
            <Route path="/recap.php" element={<RedirectToOwn suffix="recap" />} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="/settings.php" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="/settings/:tab" element={<SettingsTabRoute />} />
            <Route path="/settings/webhook/:id" element={<Suspense fallback={<PageLoader />}><WebhookLogPage /></Suspense>} />
            <Route path="/settings/webhook/:id/log" element={<Suspense fallback={<PageLoader />}><WebhookLogPage /></Suspense>} />
            <Route path="/settings_api" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>
          <Route element={<SiteLayout />}>
          <Route path="/tools" element={<Suspense fallback={<PageLoader />}><ToolsPage /></Suspense>} />
          <Route path="/tools/get_tweeturl" element={<Suspense fallback={<PageLoader />}><RequireLogin><GetTweetUrlPage /></RequireLogin></Suspense>} />
          <Route path="/tools/get_tweeturl/search/:id" element={<Suspense fallback={<PageLoader />}><RequireLogin><GetTweetUrlPage /></RequireLogin></Suspense>} />
          <Route path="/tools/search_ohatwi" element={<Suspense fallback={<PageLoader />}><RequireLogin><SearchOhatwiPage /></RequireLogin></Suspense>} />
          <Route path="/tools/search_ohatwi/:uuid" element={<Suspense fallback={<PageLoader />}><RequireLogin><SearchOhatwiPage /></RequireLogin></Suspense>} />
          <Route path="/tools/index.php" element={<Suspense fallback={<PageLoader />}><ToolsPage /></Suspense>} />
          <Route path="/u/:handle" element={<Suspense fallback={<PageLoader />}><HandleSearchPage /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
          <Route path="/dev" element={<Suspense fallback={<PageLoader />}><DevPage /></Suspense>} />
          <Route path="/dev/api-docs" element={<Suspense fallback={<PageLoader />}><ApiDocsPage /></Suspense>} />
          <Route path="/terminal" element={<Suspense fallback={<PageLoader />}><TerminalPage /></Suspense>} />
          <Route path="/howtouse" element={<Suspense fallback={<PageLoader />}><HowToUsePage /></Suspense>} />
          <Route path="/howtouse/:section" element={<Suspense fallback={<PageLoader />}><HowToUsePage /></Suspense>} />
          <Route path="/howtouse/:section/:sub" element={<Suspense fallback={<PageLoader />}><HowToUsePage /></Suspense>} />
          <Route path="/howtouse.php" element={<Suspense fallback={<PageLoader />}><HowToUsePage /></Suspense>} />
          <Route path="/patchnote" element={<Suspense fallback={<PageLoader />}><PatchnotesPage /></Suspense>} />
          <Route path="/patchnote/:version" element={<Suspense fallback={<PageLoader />}><PatchnotesPage /></Suspense>} />
          <Route path="/patchnote.php" element={<Suspense fallback={<PageLoader />}><PatchnotesPage /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
          <Route path="/policy" element={<Suspense fallback={<PageLoader />}><PolicyPage /></Suspense>} />
          <Route path="/policy.php" element={<Suspense fallback={<PageLoader />}><PolicyPage /></Suspense>} />
          <Route path="/extension" element={<Suspense fallback={<PageLoader />}><ExtensionsPage /></Suspense>} />
          <Route path="/ranking/today" element={<Navigate to="/ranking" replace />} />
          <Route path="/ranking_today.php" element={<Navigate to="/ranking" replace />} />
          <Route path="/ranking" element={<Suspense fallback={<PageLoader />}><RankingPage /></Suspense>} />
          <Route path="/ranking.php" element={<Suspense fallback={<PageLoader />}><RankingPage /></Suspense>} />
          <Route path="/cli" element={<Suspense fallback={<PageLoader />}><CliPage /></Suspense>} />
          <Route path="/diff" element={<Suspense fallback={<PageLoader />}><DiffPage /></Suspense>} />
          <Route path="/diff/:u1/:u2" element={<Suspense fallback={<PageLoader />}><DiffPage /></Suspense>} />
          <Route path="/diff.php" element={<Suspense fallback={<PageLoader />}><DiffPage /></Suspense>} />
          <Route path="/details/:id" element={<Suspense fallback={<PageLoader />}><DetailsPage /></Suspense>} />
          <Route path="/details.php" element={<Suspense fallback={<PageLoader />}><DetailsPage /></Suspense>} />
          <Route path="/survey/:slug/result" element={<Suspense fallback={<PageLoader />}><SurveyResultPage /></Suspense>} />
          <Route path="/survey/:slug/result.php" element={<Suspense fallback={<PageLoader />}><SurveyResultPage /></Suspense>} />
          <Route path="/survey/:slug" element={<Suspense fallback={<PageLoader />}><SurveyPage /></Suspense>} />
            <Route path="/survey" element={<Suspense fallback={<PageLoader />}><SurveyListPage /></Suspense>} />
          </Route>
          <Route
            path="/:publicUuid"
            element={
              <Suspense fallback={<PageLoader />}>
                <PublicLayout />
              </Suspense>
            }
          >
            <Route index element={<PublicHomePage />} />
            <Route path="grass" element={<Navigate to="../graph" replace relative="path" />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="graph/3d" element={<Suspense fallback={<PageLoader />}><Graph3DPage /></Suspense>} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="awards" element={<AwardsPage />} />
            <Route path="recap" element={<RecapPage />} /> <Route path="recap/:year/:month" element={<RecapPage />} />
            <Route path="folder" element={<FolderListPage />} />
            <Route path="folders" element={<Navigate to="../folder" replace relative="path" />} />
            <Route path="folder/:slug" element={<FolderViewPage />} />
          </Route>
          <Route path="*" element={<SiteLayout><Suspense fallback={<PageLoader />}><ErrorPage kind="not_found" /></Suspense></SiteLayout>} />
          </Route>
        </Routes>
        </RouteErrorBoundary>
        </MaintenanceGate>
        <NotAdmin><ActionWidget /></NotAdmin>
        <CommandPalette />
        <OnboardGate />
      </GlimmProvider>
    </BrowserRouter>
  )
}

export default App

/** 管理画面ではフローティングウィジェットを出さない */
function NotAdmin({ children }: { children: ReactNode }) {
  return useLocation().pathname.startsWith('/admin') ? null : <>{children}</>
}
