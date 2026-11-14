import { PageLoader } from '@/components/ui/page-loader'
import { useTranslation } from 'react-i18next'
import { Link2 } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams } from 'react-router-dom'
import StatsView, { type Stats } from './stats-view'
import ShareManager from './share-manager'

export default function RLinkDetailPage({ slug: slugProp }: { slug?: string } = {}) {
  const { t } = useTranslation()
  const params = useParams()
  const slug = slugProp ?? params.slug ?? ''
  const embedded = !!slugProp
  const [d, setD] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (!embedded) document.title = t('rl.docDetail') }, [embedded])
  useEffect(() => {
    fetch(`/app-api/r-links/${slug}/stats`, { credentials: 'include' })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(r.status === 401 ? t('rl.needLogin') : j.message || j.error || t('rl.getFail')); return j })
      .then(setD).catch((e) => setError(friendlyError(e)))
  }, [slug])

  return (
    <div className="dash-scope text-d-text">
      <div className="mx-auto max-w-5xl px-5 py-8">
        {error && <p className="py-16 text-center text-red-400">{error}</p>}
        {!d && !error && <PageLoader />}
        {d && (
          <>
            <div className="mt-5" />
            <PageHeader icon={Link2} title={d.link.title || d.link.slug} desc={<>go.ohax.pw/{d.link.slug} → <span className="break-all text-d-text3">{d.link.original_url}</span></>} />
            <StatsView d={d} />
            <ShareManager slug={slug} />
          </>
        )}
      </div>
    </div>
  )
}
