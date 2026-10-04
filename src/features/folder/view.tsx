import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams } from 'react-router-dom'
import { CONFIG } from '@/lib/config'
import { Spinner } from '@/components/ui/spinner'
import { useSetCrumbLabel } from '@/app/layouts/crumbStore'

interface FolderRecord {
  id: string
  date: string
  text: string
  likes: number
  reposts: number
  views: number
  url: string
  media_urls: string[]
}

interface FolderViewData {
  user: {
    display_name: string
    x_username: string
    x_icon: string
    public_uuid: string
  }
  folder: {
    id: number
    name: string
    description: string | null
    slug: string
    created_at: string
  }
  records: FolderRecord[]
}

export default function FolderViewPage() {
  const { t } = useTranslation()
  const { publicUuid, slug } = useParams<{ publicUuid?: string; slug?: string }>()
  const [data, setData] = useState<FolderViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useSetCrumbLabel(slug, data?.folder.name)

  useEffect(() => {
    document.title = t('fd.docPub')
  }, [])

  useEffect(() => {
    if (!publicUuid || !slug) {
      setLoading(false)
      setError(t('fd.badUrl'))
      return
    }

    setLoading(true)
    setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/folder-view?uuid=${publicUuid}&slug=${slug}`)
      .then(r => {
        if (!r.ok) throw new Error(t('fd.loadFail'))
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
  }, [publicUuid, slug])

  return (
    <div className="dash-scope text-d-text">
      <div className="max-w-5xl mx-auto px-5 py-10">
        {loading ? (
          <div className="py-20 text-center text-d-text3">
            <Spinner className="mb-3" />
            <p>{t('fd.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-d-med border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
            <p className="font-bold">{error}</p>
            <p className="text-xs text-d-text3 mt-2">{t('fd.notFound')}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="bg-d-med border border-d-border rounded-xl p-6">
              <PageHeader icon={FolderOpen} title={data.folder.name} desc={data.folder.description || undefined} />

              <div className="-mt-3 flex items-center justify-between text-xs text-d-text3">
                <div>{t('fd.count', { n: data.records.length })}</div>
                <div>{t('fd.createdAt', { d: data.folder.created_at?.split(' ')[0] })}</div>
              </div>
            </div>

            {/* Folder Records List (Matte List Layout) */}
            <div className="bg-d-med border border-d-border rounded-xl p-6">
              <h2 className="text-sm font-bold text-d-text3 uppercase tracking-wider mb-4">
                {t('fd.posts')}
              </h2>

              {data.records.length === 0 ? (
                <div className="py-12 text-center text-xs text-d-text3">{t('fd.noRec')}</div>
              ) : (
                <div className="space-y-4">
                  {data.records.map(r => (
                    <div key={r.id} className="bg-d-bg border border-d-border rounded-lg p-4 leading-relaxed">
                      <div className="text-xs text-d-text3 mb-2">{r.date}</div>
                      <p className="text-sm text-d-text mb-3 whitespace-pre-wrap">{r.text}</p>
                      
                      {/* Media Thumbnails */}
                      {r.media_urls && r.media_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {r.media_urls.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt=""
                              className="w-24 h-24 object-cover rounded-lg border border-d-border"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-d-text3 pt-2 border-t border-d-border/40">
                        <div className="flex gap-4">
                          <span>❤️ {r.likes || 0}</span>
                          <span>🔄 {r.reposts || 0}</span>
                          <span>👁️ {r.views || 0}</span>
                        </div>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-d-text2 hover:text-d-text">
                            {t('fd.openX')}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
