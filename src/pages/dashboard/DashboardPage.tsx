import i18n from '@/i18n'
import { useTranslation } from 'react-i18next'
import { SidebarSlot } from '@/app/layouts/AppShell'
import MobileMenu from '@/components/dashboard-ui/MobileMenu'
import { PageLoader } from '@/components/ui/page-loader'
import LoginRequired from '@/components/dashboard-ui/LoginRequired'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import SiteLinks, { OWNER_LINKS } from '@/components/dashboard-ui/SiteLinks'
import { apiGet, apiSend, ApiError, friendlyError } from '@/lib/dashboard/api'
import { useDashboard, useRecords } from '@/lib/dashboard/hooks'
import { useSession } from '@/lib/session'
import { requiredStep, useOnboard } from '@/lib/onboard'
import { startTour } from '@/lib/dashboard/tour'
import SiteFooter from '@/components/dashboard-ui/SiteFooter'
import { TourHost } from '@/widgets/TourHost'
import { useDashTheme } from '@/lib/dashboard/theme'
import { FlashMessages, XLinkPrompt } from '@/features/dashboard/Banners'
import OnboardingChecklist from '@/features/dashboard/OnboardingChecklist'
import ProfileHeader from '@/features/profile/ProfileHeader'
import SetupProfileHeader from '@/features/profile/SetupProfileHeader'
import { shareText } from '@/lib/shareText'
import ShareCard from '@/components/dashboard-ui/ShareCard'
import OhaxCliCard from '@/features/share/OhaxCliCard'
import AddRecordBar from '@/features/records/AddRecordBar'
import ContributionGraph from '@/features/records/ContributionGraph'
import SummaryStats, { BadgeList, StreakHero } from '@/features/records/SummaryStats'

import { toast } from '@/lib/toast'
import { onCommand, type DashCommand } from '@/lib/commands'
import RecordPanel from '@/features/records/RecordPanel'
import RecordsSection from '@/features/records/RecordsSection'
import {
  BulkAddModal, DeleteModal, ImageModal, NotificationsModal, ProgressOverlay, SurveyModal, ZipModal,
} from '@/features/records/Modals'

type Progress = { text: string; done?: number; total?: number } | null

const errorScreen = (e: ApiError) => {
  const map: Record<string, { text: string; href: string; label: string }> = {
    auth_required: { text: i18n.t('dp.authReq'), href: '/login?r=dashboard', label: i18n.t('dp.login') },
    x_link_required: { text: i18n.t('dp.xReq'), href: '/login?action=login&provider=x', label: i18n.t('dp.xLink') },
    email_required: { text: i18n.t('dp.mailReq'), href: '/settings', label: i18n.t('dp.register') },
  }
  return map[e.code ?? ''] ?? { text: e.message, href: '/', label: i18n.t('dp.toTop') }
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data, error, reload } = useDashboard()
  const sess = useSession()
  const { records, reload: reloadRecords } = useRecords()
  const { theme, toggleTheme, accent, setAccent } = useDashTheme()
  const { pathname, search } = useLocation()
  // 居るページの ohax.pw 短縮URL(ベータ環境は ?beta で振り分け)
  const shortUrl = 'https://ohax.pw' + pathname + (window.location.hostname.startsWith('beta.') ? (search ? search + '&beta' : '?beta') : search)
  const isHome = /^\/dashboard(\.php)?\/?$/.test(pathname)
  const highlightTo = OWNER_LINKS.find((l) => pathname === l.to || /^[/_.]/.test(pathname.slice(l.to.length)) && pathname.startsWith(l.to))?.to

  const [image, setImage] = useState<{ image: string; video: string | null } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [zipOpen, setZipOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(true)
  const [surveyOpen, setSurveyOpen] = useState(true)
  const [progress, setProgress] = useState<Progress>(null)

  useEffect(() => { if (isHome) document.title = i18n.t('dp.doc') }, [isHome])
  // セットアップ(必須設定・初回オンボード)が終わるまで自動ツアーは出さない
  const ob = useOnboard(false)
  const obDone = ob.ready && !requiredStep(ob) && !ob.active
  useEffect(() => { if (data?.show_tour_auto && obDone) startTour() }, [data?.show_tour_auto, obDone])

  const refreshAll = useCallback(async () => { await Promise.all([reload(), reloadRecords()]) }, [reload, reloadRecords])

  const cmdRef = useRef<(cmd: DashCommand) => void>(() => {})
  useEffect(() => onCommand((cmd) => cmdRef.current(cmd)), [])
  if (error?.code === 'auth_required') return <div className="dash-scope"><LoginRequired message={i18n.t('dp.needLogin')} /></div>
  // メール未登録: オンボードのメール登録へ誘導(ゲートも同様に強制する)
  if (error?.code === 'email_required') return <Navigate to="/onboard/email" replace />
  if (error?.code === 'x_link_required') return <Navigate to="/onboard/x" replace />
  if (error) {
    const e = errorScreen(error)
    // PHP版の require_x_linked と同じく、CSRFトークン付きのX連携ログインへ誘導する
    if (error.code === 'x_link_required') e.href += `&csrf=${encodeURIComponent(sess.csrf_token)}`
    return (
      <>
        {/* セットアップ未完了(412)でもサイドメニューは出す */}
        <SidebarSlot>
          <SetupProfileHeader key="profile" />
          <MobileMenu key="menu"><SiteLinks uuid={sess.public_uuid ?? ''} highlightTo={highlightTo} /></MobileMenu>
          <div key="footer" className="max-lg:hidden"><SiteFooter /></div>
        </SidebarSlot>
      <div className="dash-scope flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-d-border bg-d-med p-8 text-center">
          <p className="mb-4 text-d-text2">{e.text}</p>
          <a href={e.href} className="font-semibold">{e.label}</a>
        </div>
      </div>
      </>
    )
  }
  if (!data || !records) {
    return <PageLoader />
  }

  const { profile, account, stats } = data
  if (!account) {
    return (
      <div className="dash-scope flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-d-border bg-d-med p-8 text-center">
          <p className="mb-4 text-d-text2">{i18n.t('dp.noUser')}</p>
          <a href="/login?r=dashboard" className="font-semibold">{i18n.t('dp.login')}</a>
        </div>
      </div>
    )
  }
  const selIndex = selected ? records.findIndex((x) => x.uniqid === selected) : -1

  const addRecord = async (url: string) => {
    try {
      const r = await apiSend<{ status: string; message: string }>('records', 'POST', { url })
      r.status === 'success' ? toast.success(r.message) : toast.error(r.message)
      if (r.status === 'success') await refreshAll()
      return r.status === 'success'
    } catch (e) {
      toast.error(friendlyError(e))
      return false
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const r = await apiSend<{ message: string }>(`records/${deleteId}`, 'DELETE')
      toast.success(r.message)
      await refreshAll()
    } catch (e) {
      toast.error(friendlyError(e))
    }
    setDeleteId(null)
  }

  /** 過去1ヶ月/全件の記録を50件×3並列で更新する(dashboard.php の handleBatchUpdateProcess 相当) */
  const runUpdate = async (period: 'month' | 'all') => {
    try {
      setProgress({ text: i18n.t('dp.preparing') })
      await apiSend('update_profile', 'POST').catch(() => {})
      const { ids } = await apiGet<{ ids: number[] }>(`record_ids?period=${period}`)
      if (ids.length === 0) {
        setProgress({ text: i18n.t('dp.nothing') })
        setTimeout(() => setProgress(null), 1500)
        return
      }
      const size = 50, parallel = 3
      const chunks: number[][] = []
      for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size))
      let updated = 0, processed = 0
      for (let i = 0; i < chunks.length; i += parallel) {
        const group = chunks.slice(i, i + parallel)
        const res = await Promise.all(group.map((c) => apiSend<{ updated_count: number }>('update_batch', 'POST', { ids: c })))
        res.forEach((r) => { updated += r.updated_count })
        processed = Math.min(processed + group.reduce((n, c) => n + c.length, 0), ids.length)
        setProgress({ text: i18n.t('dp.updating', { a: processed, b: ids.length }), done: processed, total: ids.length })
      }
      setProgress({ text: i18n.t('dp.updated', { n: updated }) })
      await refreshAll()
      setTimeout(() => setProgress(null), 1500)
    } catch (e) {
      setProgress({ text: i18n.t('dp.err', { m: friendlyError(e) }) })
      setTimeout(() => setProgress(null), 3000)
    }
  }

  const runBulk = async (urls: string) => {
    setBulkOpen(false)
    const requestId = Math.random().toString(36).slice(2) + Date.now().toString(36)
    setProgress({ text: i18n.t('dp.regPrep') })
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/app-api/bulk_progress?id=${requestId}`, { credentials: 'include' })
        if (!r.ok) return
        const d = await r.json()
        setProgress(d.total > 0
          ? { text: i18n.t('dp.regging'), done: d.processed, total: d.total }
          : { text: i18n.t('dp.regging2') })
      } catch { /* 次のポーリングで再試行 */ }
    }, 1000)
    try {
      const res = await apiSend<{ results: Record<string, number> }>('bulk_add', 'POST', { urls, request_id: requestId })
      const r = res.results
      toast.success(i18n.t('dp.bulkDone'), { description: i18n.t('dp.bulkDesc', { s: r.success, d: r.duplicate, i: r.invalid_user, e: r.error }) })
      await refreshAll()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      clearInterval(poll)
      setProgress(null)
    }
  }

  const closeSurvey = (noShow: boolean) => {
    setSurveyOpen(false)
    if (noShow) apiSend('survey/no_show', 'POST').catch(() => {})
  }

  const notifications = data.notifications
  const showFlash = { message: data.flash.message ?? undefined, error: data.flash.error ?? undefined }


  cmdRef.current = (cmd) => {
    if (!isHome) return
    if (cmd === 'focus-add') document.getElementById('url')?.focus()
    else if (cmd === 'bulk') setBulkOpen(true)
    else if (cmd === 'zip') records.length === 0 ? toast.error(i18n.t('dp.noImg')) : setZipOpen(true)
    else if (cmd === 'update-month') runUpdate('month')
    else if (cmd === 'update-all') runUpdate('all')
    else if (cmd === 'tour') startTour()
    else if (cmd === 'toggle-theme') toggleTheme(window.innerWidth / 2, window.innerHeight / 2)
    else if (cmd === 'copy-share') navigator.clipboard?.writeText(data.share_url).catch(() => {})
  }

  return (
    <>
      <SidebarSlot>
            <ProfileHeader key="profile" profile={profile} onTour={isHome ? startTour : undefined} theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
            {data.onboarding ? <OnboardingChecklist key="onboard" data={data.onboarding} csrf={data.csrf_token} /> : !account.x_id && <XLinkPrompt key="onboard" csrf={data.csrf_token} />}
            <MobileMenu key="menu"><SiteLinks uuid={account.public_uuid} highlightTo={highlightTo} /></MobileMenu>
            <ShareCard key="share-card" url={shortUrl} title={document.title} text={shareText(t, pathname)} />
            <div key="cli" className="max-lg:hidden"><OhaxCliCard command={data.ohax_command} isPublic={!!account.is_public} /></div>
            <div key="footer" className="max-lg:hidden"><SiteFooter /></div>
      </SidebarSlot>
      <TourHost />
        <div className="shrink-0 pt-4">
          <FlashMessages flash={{ message: showFlash.message ?? null, error: showFlash.error ?? null }} />
        </div>
            {!isHome ? (
              <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
            ) : (
              <>
                <StreakHero stats={stats} records={records} />
                <ContributionGraph records={records} />
                <SummaryStats stats={stats} onUpdateAll={() => runUpdate('all')} updating={progress !== null} />
                <BadgeList badges={data.badges} publicUuid={account.public_uuid} onOpenAwards={() => { window.location.href = `/${account.public_uuid}/awards` }} />
                <AddRecordBar onAdd={addRecord} onBulk={() => setBulkOpen(true)} onUpdate={runUpdate}
                onZip={() => (records.length === 0 ? toast.error(i18n.t('dp.noImg')) : setZipOpen(true))} />
                <RecordsSection
                  records={records}
                  firstPostDate={stats.first_post_date}
                  lastUpdateTime={data.last_update_time}
                  scheduledUpdateTime={data.scheduled_update_time}
                  onImage={(image, video) => setImage({ image, video })}
                  onTweet={setSelected}
                  onDelete={setDeleteId}
                />
              </>
            )}

      <ImageModal media={image} onClose={() => setImage(null)} />
      <RecordPanel
        record={selIndex >= 0 ? records[selIndex] : null}
        index={selIndex}
        total={records.length}
        onClose={() => setSelected(null)}
        onStep={(d) => { const n = records[selIndex + d]; if (n) setSelected(n.uniqid) }}
        onDelete={(id) => { setSelected(null); setDeleteId(id) }}
        onImage={(image, video) => setImage({ image, video })}
      />
      <DeleteModal uniqid={deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} />
      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} onSubmit={runBulk} />
      <ZipModal open={zipOpen} onClose={() => setZipOpen(false)} csrf={data.csrf_token} />
      <NotificationsModal items={notifOpen && obDone ? notifications : []} onClose={() => setNotifOpen(false)} />
      <SurveyModal open={obDone && data.show_survey_popup && surveyOpen && !(notifOpen && notifications.length > 0)} onClose={closeSurvey} />
      <ProgressOverlay state={progress} />
      <div className="pb-8 lg:hidden"><SiteFooter /></div>
    </>
  )
}
