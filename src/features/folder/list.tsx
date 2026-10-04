import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { PageLoader } from '@/components/ui/page-loader'
import { useEffect, useState } from 'react'
import { friendlyError } from '@/lib/dashboard/api'
import { Link, useParams } from 'react-router-dom'
import { CONFIG } from '@/lib/config'

interface FolderItem { id: number; name: string; description: string | null; slug: string; created_at: string; record_count: number }

export default function FolderListPage() {
  const { t } = useTranslation()
  const { publicUuid } = useParams<{ publicUuid: string }>()
  const [folders, setFolders] = useState<FolderItem[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { document.title = t('fd.docList') }, [])
  useEffect(() => {
    setFolders(null); setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/folders?uuid=${publicUuid}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(t('fd.listFail')))))
      .then(d => setFolders(d.folders))
      .catch(e => setError(friendlyError(e)))
  }, [publicUuid])

  if (error) return <p className="py-20 text-center text-d-text3">{error}</p>
  if (!folders) return <PageLoader />
  return (
    <div className="mx-auto max-w-3xl py-6">
      <PageHeader icon={FolderOpen} title={t('fd.pubTitle')} />
      {folders.length === 0 ? (
        <p className="py-12 text-center text-sm text-d-text3">{t('fd.noPub')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {folders.map(f => (
            <li key={f.id}>
              <Link to={`/${publicUuid}/folder/${f.slug}`} className="block rounded-xl border border-d-border bg-d-med p-4 hover:border-d-text3">
                <div className="font-bold text-d-text">📁 {f.name}</div>
                {f.description && <p className="mt-1 line-clamp-2 text-xs text-d-text2">{f.description}</p>}
                <div className="mt-2 text-xs text-d-text3">{t('fd.n', { n: f.record_count })}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
