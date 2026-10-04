import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { friendlyError } from '@/lib/dashboard/api'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, ClipboardList, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { CONFIG } from '@/lib/config'

interface Survey { slug: string; title: string; description: string; icon: string; color: string; status: 'open' | 'closed'; answers: number; survey_url: string; result_url: string }

export default function SurveyListPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Survey[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    document.title = `${t('sv.listTitle')} - おはツイKeeper`
    fetch(`${CONFIG.API_BASE}/app-api/surveys`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(t('sv.fetchFail')))))
      .then((j) => setItems(j.surveys))
      .catch((e) => setError(friendlyError(e)))
  }, [])
  const open = items?.filter((s) => s.status === 'open') ?? []
  const closed = items?.filter((s) => s.status === 'closed') ?? []

  const Item = ({ s }: { s: Survey }) => (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 py-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-lg text-xl" style={{ color: s.color }}>
        <i className={`bx ${s.icon}`} />
      </div>
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-d-text">{s.title}</h2>
          <Badge variant={s.status === 'open' ? 'default' : 'secondary'}>{s.status === 'open' ? t('sv.open') : t('sv.closed')}</Badge>
        </div>
        {s.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-d-text2">{s.description}</p>}
        <span className="mt-1.5 flex items-center gap-1 text-xs text-d-text3"><Users className="size-3" />{t('sv.answers', { n: s.answers.toLocaleString() })}</span>
      </div>
      <div className="flex shrink-0 gap-2">
        {s.status === 'open' && (
          <Link to={s.survey_url} className="inline-flex items-center gap-1.5 rounded-lg bg-d-text px-4 py-2 text-sm font-bold !text-d-bg transition active:scale-95">
            {t('sv.answer')} <ArrowRight className="size-4" />
          </Link>
        )}
        <Link to={s.result_url} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-d-border px-4 py-2 text-sm font-semibold !text-d-text2 transition active:scale-95">
          <BarChart3 className="size-4" /> {t('sv.result')}
        </Link>
      </div>
    </li>
  )
  const List = ({ list }: { list: Survey[] }) => <ul className="divide-y divide-dashed divide-d-border border-y border-d-border">{list.map((s) => <Item key={s.slug} s={s} />)}</ul>

  return (
    <div className="py-6">
      <PageHeader icon={ClipboardList} title={t('sv.listTitle')} desc={t('sv.pageDesc')} />
      {error && <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
      {!items && !error && <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-2xl bg-d-med" />)}</div>}
      {items && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-d-text3">{t('sv.open')}</h2>
          {open.length ? <List list={open} />
            : <AppEmpty icon={ClipboardList} title={t('sv.emptyT')} description={t('sv.emptyD')} />}
          {closed.length > 0 && (
            <>
              <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wider text-d-text3">{t('sv.ended')}</h2>
              <List list={closed} />
            </>
          )}
        </>
      )}
    </div>
  )
}
