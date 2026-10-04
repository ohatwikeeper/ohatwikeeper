import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/lib/session'
import { requiredStep, useOnboard } from '@/lib/onboard'

/** オンボード未完了のとき、強制リダイレクトしないページの上部に出す案内 */
export default function SetupBanner() {
  const { t } = useTranslation()
  const s = useSession()
  const o = useOnboard(false)
  const { pathname, search } = useLocation()
  const must = requiredStep(o)
  if (!s.logged_in || !o.ready || !(must || o.active) || /^\/(onboard|admin)(\/|$)/.test(pathname)) return null
  return (
    <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-d-border px-4 py-2.5 text-sm text-d-text2">
      <span>{t('ob5.banner')}</span>
      <Link to={`/onboard/${must ?? o.step}?r=${encodeURIComponent(pathname + search)}`} className="font-medium text-d-text underline underline-offset-4">{t('ob5.go')}</Link>
    </div>
  )
}
