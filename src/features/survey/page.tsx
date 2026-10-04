import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { ClipboardList, Lock } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { csrfHeaders } from '@/lib/dashboard/api'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams, Link } from 'react-router-dom'
import { CONFIG } from '@/lib/config'
import { useSession } from '@/lib/session'
import { requiredStep, useOnboard } from '@/lib/onboard'
import { Spinner } from '@/components/ui/spinner'

interface SurveyResponseItem {
  id: number
  world_name: string
  author_name: string
  comment: string
  created_at: string
}

interface SurveyData {
  survey: {
    slug: string
    title: string
    description: string
  }
  responses: SurveyResponseItem[]
}

export default function SurveyPage() {
  const sess = useSession()
  const ob = useOnboard(false)
  const locked = sess.ready && (!sess.logged_in || (ob.ready && !!(requiredStep(ob) || ob.active)))
  const { t } = useTranslation()
  const { slug } = useParams<{ slug?: string }>()
  const surveySlug = slug || 'favoriteohatwiworld'

  const [data, setData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // form state
  const [worldName, setWorldName] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    document.title = `${t('sv.listTitle')} - おはツイKeeper`
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/survey-data?slug=${surveySlug}`)
      .then(r => {
        if (!r.ok) throw new Error(t('sv.pgFail'))
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
  }, [surveySlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worldName.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`${CONFIG.API_BASE}/app-api/survey`, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify({
          survey_slug: surveySlug,
          world_name: worldName.trim(),
          author_name: authorName.trim(),
          comment: comment.trim(),
        }),
      })

      if (res.ok) {
        setSubmitSuccess(true)
        setWorldName('')
        setAuthorName('')
        setComment('')
      } else if (res.status === 412) {
        toast.error(t('ob5.survey'))
      } else {
        toast.error(t('sv.sendFail'))
      }
    } catch {
      toast.error(t('sv.netErr'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text">
      <div className="max-w-4xl mx-auto px-5 py-10">
        {loading ? (
          <div className="py-20 text-center text-d-text3">
            <Spinner className="mb-3" />
            <p>{t('sv.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-d-med border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
            <p className="font-bold">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Survey Header */}
            <div>
              <PageHeader icon={ClipboardList} title={data.survey.title} desc={data.survey.description} right={<Link to={`/survey/${surveySlug}/result`} className="text-d-text2 text-sm hover:text-d-text">{t('sv.seeAll')}</Link>} />
            </div>

            {/* Submission Form */}
            <div className="relative bg-d-med border border-d-border rounded-xl p-6">
              {locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-d-bg/70 p-6 text-center backdrop-blur-[2px]">
                  <div className="flex size-11 items-center justify-center rounded-full border border-d-border bg-d-med"><Lock className="size-5 text-d-text" /></div>
                  <div className="text-base font-bold text-d-text">{sess.logged_in ? t('ob5.lockT') : t('ob5.lockL')}</div>
                  {sess.logged_in && <p className="max-w-xs text-sm text-d-text2">{t('ob5.lockD')}</p>}
                  <Link to={sess.logged_in ? `/onboard/${requiredStep(ob) ?? ob.step}?r=${encodeURIComponent("/survey")}` : '/login?r=/survey'} className="mt-1 rounded-lg !bg-d-text px-5 py-2.5 text-sm font-bold !text-d-bg">{sess.logged_in ? t('ob5.go') : t('ob5.login')}</Link>
                </div>
              )}
              <h2 className="text-sm font-bold text-d-text3 uppercase tracking-wider mb-4">
                {t('sv.formTitle')}
              </h2>

              {submitSuccess ? (
                <div className="p-4 bg-d-med border border-d-border rounded-lg text-d-text text-sm text-center">
                  {t('sv.thanks')}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
                  <div>
                    <label className="block text-xs font-medium text-d-text3 mb-1">
                      {t('sv.world')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('sv.worldPh')}
                      value={worldName}
                      onChange={e => setWorldName(e.target.value)}
                      className="w-full bg-d-bg border border-d-border rounded-lg px-4 py-2.5 text-sm text-d-text outline-none focus:border-d-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-d-text3 mb-1">
                      {t('sv.creator')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('sv.creatorPh')}
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full bg-d-bg border border-d-border rounded-lg px-4 py-2.5 text-sm text-d-text outline-none focus:border-d-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-d-text3 mb-1">
                      {t('sv.comment')}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={t('sv.commentPh')}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full bg-d-bg border border-d-border rounded-lg px-4 py-2.5 text-sm text-d-text outline-none focus:border-d-border resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-d-text text-d-bg font-bold px-6 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {submitting ? t('sv.sending') : t('sv.submit')}
                  </button>
                </fieldset>
                </form>
              )}
            </div>

            {/* Community Responses List */}
            {data.responses && data.responses.length > 0 && (
              <div className="bg-d-med border border-d-border rounded-xl p-6">
                <h2 className="text-sm font-bold text-d-text3 uppercase tracking-wider mb-4">
                  {t('sv.listAll')}
                </h2>

                <div className="divide-y divide-d-border/50">
                  {data.responses.map(item => (
                    <div key={item.id} className="py-4 space-y-1">
                      <div className="flex items-center justify-between text-sm font-bold text-d-text">
                        <span>🌐 {item.world_name}</span>
                        {item.author_name && (
                          <span className="text-xs font-normal text-d-text3">by {item.author_name}</span>
                        )}
                      </div>
                      {item.comment && (
                        <p className="text-xs text-d-text2 leading-relaxed">{item.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
