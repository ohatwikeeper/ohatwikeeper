import { useTranslation } from 'react-i18next'
import { PageLoader } from '@/components/ui/page-loader'
import { MessageSquareDashed } from 'lucide-react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { Globe } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface Answer { world_name: string; world_url: string; message: string }
interface Result { public_uuid: string; name: string; screen_name: string; avatar_url: string | null; created_at: string; answers: Answer[] }

export default function SurveyResultPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Result[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    document.title = `${t('sv.resTitle')} - おはツイKeeper`
    fetch('/app-api/survey-results')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRows(d.results))
      .catch(() => setError(t('sv.resFail')))
  }, [])

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <PageHeader icon={Globe} title={t('sv.resHead')} desc={t('sv.resDesc')} />
        <Link to="/survey/favoriteohatwiworld" className="text-d-text2 mt-3 inline-block text-sm hover:text-d-text">{t('sv.goAnswer')}</Link>

        <div className="mt-8 border-t border-d-border">
          {error && <p className="py-10 text-center text-red-400">{error}</p>}
          {!rows && !error && <PageLoader />}
          {rows?.length === 0 && <AppEmpty icon={MessageSquareDashed} title={t('sv.noAnsT')} description={t('sv.noAnsD')} />}
          {rows?.map((r, i) => (
            <section key={i} className="border-b border-d-border py-6">
              <Link to={`/${r.public_uuid}`} className="flex items-center gap-3 !text-d-text">
                {r.avatar_url
                  ? <img src={r.avatar_url} alt="" className="size-10 rounded-full bg-d-light object-cover" />
                  : <span className="grid size-10 place-items-center rounded-full bg-d-light"><i className="bx bx-user" /></span>}
                <span className="min-w-0"><span className="block font-bold">{r.name}</span>{r.screen_name && <span className="block text-xs text-d-text3">@{r.screen_name}</span>}</span>
              </Link>
              <ul className="mt-4 space-y-4 pl-[3.25rem]">
                {r.answers.map((a, j) => (
                  <li key={j}>
                    <div className="flex items-center gap-1.5 font-semibold"><i className="bx bx-map-pin text-d-text" />{a.world_name}</div>
                    {a.world_url && <a href={a.world_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-xs"><i className="bx bx-link-external" />{a.world_url}</a>}
                    {a.message && <p className="mt-2 whitespace-pre-wrap border-t border-d-border/60 pt-2 text-sm text-d-text2">{a.message}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
