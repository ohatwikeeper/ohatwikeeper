import { useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '@/lib/session'
import { refreshOnboard, requiredStep, useOnboard } from '@/lib/onboard'

// ログイン必須のアプリ画面だけ強制する(トップ・ランキング・公開ページ等は対象外)
const GUARDED = /^\/(dashboard|settings|settings_api|notification|folder|recap|r-links|tools\/get_tweeturl|tools\/search_ohatwi)(\/|\.php|$)/
// セットアップ中でも開けるページ(/login はX連携の経路)
const SKIP = /^\/(onboard|admin|login|confirm_login|logout|terms|policy)(\/|$)/

/** 必須設定(X連携・メール)が未完了、または初回セットアップ中なら、続きの /onboard/<step> に戻す */
export default function OnboardGate() {
  const s = useSession()
  const o = useOnboard(s.ready && s.logged_in)
  const { pathname } = useLocation()
  const must = requiredStep(o)
  // 未完了の間は遷移ごとに最新化(メール登録後の復帰を正しく判定するため)
  useEffect(() => { if (s.ready && s.logged_in && (must || o.active)) void refreshOnboard() }, [pathname])
  return null
}

/** AppShell の本文エリアだけに重ねる案内(サイドメニュー等は操作できるまま) */
export function SetupLock() {
  const s = useSession()
  const o = useOnboard(false)
  const { pathname, search } = useLocation()
  const nav = useNavigate()
  const { t: tr } = useTranslation()
  const must = requiredStep(o)
  void s
  const locked = o.ready && !SKIP.test(pathname) && GUARDED.test(pathname) && !!(must || o.active)
  if (!locked) return null
  // すぐ遷移せず、画面をぼかして案内を出す(ここから続きへ進める)
  return (
    <div className="dash-scope absolute inset-x-0 bottom-0 top-12 z-30 flex items-center justify-center bg-d-bg/70 p-6 backdrop-blur-md">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-d-border bg-d-med"><Lock className="size-5 text-d-text" /></div>
        <div className="text-lg font-bold text-d-text">{tr('ob5.lockT')}</div>
        <p className="text-sm text-d-text2">{tr('ob5.lockP')}</p>
        <Button size="lg" className="mt-2 h-11 px-6 !bg-d-text !text-d-bg" onClick={() => nav(`/onboard/${must ?? o.step}?r=${encodeURIComponent(pathname + search)}`)}>{tr('ob5.go')}</Button>
      </div>
    </div>
  )
}
