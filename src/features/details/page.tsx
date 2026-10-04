import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams, Link } from 'react-router-dom'
import { CONFIG } from '@/lib/config'
import TweetEmbed from '@/features/records/TweetEmbed'
import { Spinner } from '@/components/ui/spinner'

interface RecordDetailsData {
  record: {
    id: number
    history_id: string
    date: string
    text: string
    url: string
    likes: number
    reposts: number
    views: number
    value: number
    media_urls: string[]
    author?: {
      name?: string
      screen_name?: string
      avatar_url?: string
    }
    metrics?: Record<string, any>
  }
  user: {
    public_uuid: string
    display_name: string
    x_username: string
    x_icon: string
  }
  prev_id: string | null
  next_id: string | null
}

export default function DetailsPage() {
  const { t: tr } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<RecordDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = tr('dt.doc')
  }, [])

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/details-data?id=${id}`)
      .then(r => {
        if (!r.ok) throw new Error(tr('dt.fail'))
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
  }, [id])

  const r = data?.record
  const stats: [string, number | undefined, string][] = r ? [
    [tr('dt.likes'), r.likes, 'bx-heart'], [tr('dt.reposts'), r.reposts, 'bx-repost'],
    [tr('dt.views'), r.views, 'bx-show'],
  ] : []
  const step = 'inline-flex items-center gap-1 rounded-full border border-d-border bg-d-med px-3 py-1.5 text-xs font-semibold text-d-text2 transition-colors hover:border-d-accent hover:text-d-accent'

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text">
      <div className="mx-auto max-w-4xl px-5 py-8">
        {loading ? (
          <div className="py-24 text-center text-d-text3">
            <Spinner className="mb-3" />
            <p>{tr('dt.loading')}</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-d-danger/30 bg-d-med p-6 text-center">
            <p className="font-bold text-d-danger">{error}</p>
            <p className="mt-2 text-xs text-d-text3">{tr('dt.gone')}</p>
          </div>
        ) : data && r ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to={CONFIG.PAGES.PROFILE(data.user.public_uuid)} className={step}>
                <i className="bx bx-arrow-back" />{tr('dt.back', { n: data.user.display_name })}
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
              <section className="min-w-0 space-y-5">
                <div className="rounded-2xl border border-d-border bg-d-med p-6">
                  <div className="mb-5 flex items-center gap-4 border-b border-d-border/60 pb-5">
                    {data.user.x_icon && <img src={data.user.x_icon} alt="" className="size-12 shrink-0 rounded-full border border-d-border" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold">{data.user.display_name}</div>
                      <div className="text-xs text-d-text3">@{data.user.x_username}</div>
                    </div>
                    <div className="text-right text-xs text-d-text3">
                      <div>{tr('dt.at')}</div>
                      <div className="mt-0.5 font-mono text-d-text">{r.date}</div>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{r.text}</p>
                  {r.media_urls?.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {r.media_urls.map((m, i) => (
                        <img key={i} src={m} alt="" loading="lazy" className="h-auto max-h-96 w-full rounded-lg border border-d-border object-cover" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-d-border bg-d-border">
                  {stats.map(([label, v, icon]) => (
                    <div key={label} className="bg-d-med p-4">
                      <div className="flex items-center gap-1 text-[11px] text-d-text3"><i className={`bx ${icon}`} />{label}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{(v ?? 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-d-text3">
                  <span className="font-mono">ID: {r.history_id || r.id}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-d-border bg-d-med px-4 py-2 text-sm font-semibold !text-d-accent transition-colors">
                      <i className="bx bx-link-external" />{tr('dt.viewX')}
                    </a>
                  )}
                </div>
              </section>

              {r.url && (
                <aside className="min-w-0">
                  <div className="rounded-2xl border border-d-border bg-d-med p-5 lg:sticky lg:top-6">
                    <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-d-text3">Embed</div>
                    <TweetEmbed url={r.url} />
                  </div>
                </aside>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
