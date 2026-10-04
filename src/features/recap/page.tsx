import { SimpleSelect } from '@/components/ui/simple-select'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { friendlyError } from '@/lib/dashboard/api'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { CONFIG } from '@/lib/config'
import RecordPanel from '@/features/records/RecordPanel'
import { ImageModal } from '@/features/records/Modals'
import RecordsSection from '@/features/records/RecordsSection'
import type { RecordItem } from '@/lib/dashboard/types'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { Spinner } from '@/components/ui/spinner'
import { MetricCard } from '@/components/arc/metric-card/metric-card'

interface RecapData {
  user: {
    display_name: string
    x_username: string
    x_icon: string
    public_uuid: string
  }
  period: {
    year: number
    month: number
  }
  summary: {
    total_posts: number
    total_likes: number
    total_views: number
    total_reposts: number
    current_consecutive_streak: number
    max_streak: number
  }
  top_post?: {
    id: string
    date: string
    text: string
    likes: number
    reposts: number
    views: number
    url: string
  }
  records: RecordItem[]
}

export default function RecapPage() {
  const { t: tr } = useTranslation()
  const [searchParams] = useSearchParams()
  const { publicUuid, year: yearPath, month: monthPath } = useParams<{ publicUuid?: string; year?: string; month?: string }>()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [image, setImage] = useState<{ image: string; video: string | null } | null>(null)
  const [sessionUuid, setSessionUuid] = useState('')
  const [sessionDone, setSessionDone] = useState(false)
  const userUuid = publicUuid || searchParams.get('user') || searchParams.get('uuid') || sessionUuid
  const yearParam = yearPath || searchParams.get('year') || String(new Date().getFullYear())
  const monthParam = monthPath || searchParams.get('month') || String(new Date().getMonth() + 1)

  const goTo = (y: string, m: string) =>
    navigate(userUuid ? `/${userUuid}/recap/${y}/${m}` : `/recap?year=${y}&month=${m}`)

  // 旧形式 ?user=&year=&month= を /:uuid/recap/:year/:month へ正規化
  useEffect(() => {
    const u = searchParams.get('user') || searchParams.get('uuid')
    if (u && !yearPath) navigate(`/${u}/recap/${yearParam}/${monthParam}`, { replace: true })
  }, [])

  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = tr('rcp.doc')
  }, [])

  useEffect(() => {
    if (publicUuid || searchParams.get('user') || searchParams.get('uuid')) { setSessionDone(true); return }
    fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSessionUuid(d.public_uuid || ''))
      .catch(() => {})
      .finally(() => setSessionDone(true))
  }, [publicUuid, searchParams])

  useEffect(() => {
    if (!sessionDone) return
    if (!userUuid) {
      setLoading(false)
      navigate('/login?r=recap', { replace: true })
      return
    }

    setLoading(true)
    setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/recap-data?uuid=${userUuid}&year=${yearParam}&month=${monthParam}`)
      .then(r => {
        if (!r.ok) throw new Error(tr('rcp.fail'))
        return r.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(friendlyError(err))
        setLoading(false)
      })
  }, [sessionDone, userUuid, yearParam, monthParam])

  const selIndex = selected && data ? data.records.findIndex((x) => x.uniqid === selected) : -1
  return (
    <div className="dash-scope text-d-text">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <PageHeader icon={CalendarDays} title={tr('rcp.title')} desc={tr('rcp.desc')} right={
          <div className="flex items-center gap-2">
            <SimpleSelect value={String(yearParam)} onChange={v => goTo(v, monthParam)} options={[2024, 2025, 2026].map(y => ({ value: String(y), label: tr('rcp.year', { y }) }))} />
            <SimpleSelect value={String(monthParam)} onChange={v => goTo(yearParam, v)} options={Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({ value: String(m), label: tr('rcp.month', { m }) }))} />
          </div>
        } />

        {loading ? (
          <div className="py-20 text-center text-d-text3">
            <Spinner className="mb-3" />
            <p>{tr('rcp.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-d-med border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
            <p className="font-bold">{error}</p>
            <p className="text-xs text-d-text3 mt-2">{tr('rcp.retry')}</p>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* User Profile Bar */}
            <div className="border-t border-d-border pt-5 first:border-t-0 first:pt-0 flex items-center gap-4">
              {data.user.x_icon && (
                <img src={data.user.x_icon} alt="" className="w-12 h-12 rounded-full border border-d-border" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-d-text">{data.user.display_name}</div>
                <div className="text-sm text-d-text3">@{data.user.x_username}</div>
              </div>
              <Link
                to={CONFIG.PAGES.PROFILE(data.user.public_uuid)}
                className="text-xs text-d-text2 hover:text-d-text border border-d-border px-3 py-1.5 rounded-lg"
              >
                {tr('rcp.public')}
              </Link>
            </div>

            {/* Summary Metrics Row (Matte layout) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label={tr('rcp.mPosts')} value={data.summary.total_posts} suffix={tr('rcp.uCount')} context={tr('rcp.cPosts')} />
              <MetricCard label={tr('rcp.mLikes')} value={data.summary.total_likes} suffix={tr('rcp.uCount')} context={tr('rcp.cLikes')} />
              <MetricCard label={tr('rcp.mViews')} value={data.summary.total_views} suffix={tr('rcp.uTimes')} context={tr('rcp.cViews')} />
              <MetricCard label={tr('rcp.mStreak')} value={data.summary.current_consecutive_streak} suffix={tr('rcp.uDays')} context={tr('rcp.cStreak')} />
            </div>

            {/* Top Post Highlight */}
            {data.top_post && (
              <div className="border-t border-d-border pt-6 first:border-t-0 first:pt-0">
                <h2 className="text-sm font-bold text-d-text3 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>⭐</span> {tr('rcp.hl')}
                </h2>
                <div className="p-4 bg-d-bg border border-d-border rounded-lg leading-relaxed text-d-text text-sm">
                  {data.top_post.text}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-d-text3">
                  <div className="flex gap-4">
                    <span>❤️ {data.top_post.likes.toLocaleString()}</span>
                    <span>🔄 {data.top_post.reposts.toLocaleString()}</span>
                    <span>👁️ {data.top_post.views.toLocaleString()}</span>
                  </div>
                  {data.top_post.url && (
                    <a href={data.top_post.url} target="_blank" rel="noopener noreferrer" className="text-d-accent hover:text-d-text">
                      {tr('rcp.openX')}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Posts List */}
            <div className="border-t border-d-border pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-sm font-bold text-d-text3 uppercase tracking-wider mb-4">
                {tr('rcp.hist', { n: data.records.length })}
              </h2>
              <RecordsSection
                hideFilters
                records={data.records}
                firstPostDate={null}
                lastUpdateTime={null}
                onImage={(image, video) => setImage({ image, video })}
                onTweet={setSelected}
              />
              <ImageModal media={image} onClose={() => setImage(null)} />
              <RecordPanel
                record={selIndex >= 0 ? data.records[selIndex] : null}
                index={selIndex}
                total={data.records.length}
                onClose={() => setSelected(null)}
                onStep={(d) => { const n = data.records[selIndex + d]; if (n) setSelected(n.uniqid) }}
                onImage={(image, video) => setImage({ image, video })}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
