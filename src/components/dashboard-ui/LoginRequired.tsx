import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { useSession } from '@/lib/session'

/** ログイン後に元のページへ戻れるログイン画面 URL */
export function loginHref(path: string) {
  const r = path.replace(/^\/+/, '')
  return r ? `/login?r=${encodeURIComponent(r)}` : '/login'
}

/** 未ログインで認証必須ページを開いたら、元のページを覚えたままログイン画面へ移動する */
export default function LoginRequired(_props: { message?: string }) {
  const { pathname, search } = useLocation()
  return <Navigate to={loginHref(pathname + search)} replace />
}

/** /recap など旧URL: 自分の公開URL(/:uuid/recap)へ移動する */
export function RedirectToOwn({ suffix }: { suffix: string }) {
  const s = useSession()
  if (!s.ready) return null
  return s.logged_in && s.public_uuid ? <Navigate to={`/${s.public_uuid}/${suffix}`} replace /> : <LoginRequired />
}

/** 閲覧は誰でも可、中身(ツール本体)だけログイン必須にする */
export function RequireLogin({ children }: { children: ReactNode }) {
  const { t: tr } = useTranslation()
  const s = useSession()
  const { pathname, search } = useLocation()
  if (!s.ready) return null
  if (s.logged_in) return <>{children}</>
  return (
    <AppEmpty icon={Lock} title={tr('cn.loginReq')} description={tr('cn.loginReqDesc')}>
      <Link to={loginHref(pathname + search)} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">{tr('cn.login')}</Link>
    </AppEmpty>
  )
}
