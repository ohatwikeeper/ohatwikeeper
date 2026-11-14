import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link2 } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import StatsView, { type Stats } from './stats-view'

// 持ち主が発行した共有URLで見る、ログイン不要の解析ページ。出す項目はサーバーが絞る
export default function LinkStatsSharePage() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const [d, setD] = useState<Stats | null>(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    document.title = t('rs.pDoc')
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex'; document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  useEffect(() => {
    fetch(`/app-api/rl-share/${encodeURIComponent(token)}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setGone(true))
  }, [token])
  return (
    <div className="dash-scope min-h-dvh bg-d-bg text-d-text">
      <header className="border-b border-d-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-5">
          <a href="/" className="text-sm font-bold text-d-text">おはツイKeeper</a>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-10">
        {gone && <p className="py-24 text-center text-d-text3">{t('rs.pGone')}</p>}
        {!d && !gone && <PageLoader />}
        {d && (
          <>
            <PageHeader icon={Link2} title={d.link.title || d.link.slug} desc={<>{d.link.short_url.replace(/^https?:\/\//, '')}{d.link.original_url && <> → <span className="break-all text-d-text3">{d.link.original_url}</span></>}</>} />
            <p className="mt-2 text-sm text-pretty text-d-text3">{t('rs.pLead')}</p>
            <StatsView d={d} />
          </>
        )}
      </div>
    </div>
  )
}
