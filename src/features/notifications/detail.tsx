import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/page-loader'
import { apiGet } from '@/lib/dashboard/api'
import ErrorPage from '@/components/dashboard-ui/ErrorPage'
import { fmt, renderFormattedBody, type Notif } from './page'

/** お知らせ詳細: /notification/{12文字コード} */
export default function NotificationDetailPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const [n, setN] = useState<Notif | null | undefined>(undefined)

  useEffect(() => {
    setN(undefined)
    apiGet<{ notifications: Notif[] }>('notifications/all')
      .then((r) => setN(r.notifications.find((x) => x.code === code) ?? null))
      .catch(() => setN(null))
  }, [code])

  useEffect(() => { if (n) document.title = `${n.title} - おはツイKeeper` }, [n])

  if (n === undefined) return <PageLoader />
  if (n === null) return <ErrorPage kind="not_found" />
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link to="/notification" className="mb-4 inline-flex items-center gap-1 text-xs !text-d-text2 no-underline hover:!text-d-text">
        <ArrowLeft className="size-3.5" />{t('nt.title')}
      </Link>
      <h1 className="text-lg font-bold text-d-text">{n.title}</h1>
      <div className="mt-1 text-xs text-d-text3">{fmt(n.created_at)}</div>
      {n.image_url && <img src={n.image_url} alt={n.title} className="mt-4 max-h-80 w-full rounded-lg border border-d-border/60 object-cover" />}
      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-d-text2">{renderFormattedBody(n.body)}</div>
      {n.cta_buttons?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {n.cta_buttons.map((b, i) => (
            <Button key={i} size="sm" variant="outline" nativeButton={false} render={<a href={b.url} target={b.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" />}>
              {b.label}{b.url.startsWith('http') && <ExternalLink className="size-3" />}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
