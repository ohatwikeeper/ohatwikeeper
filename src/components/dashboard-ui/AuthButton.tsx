import { KeyRound, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useDashboard } from '@/lib/dashboard/hooks'
import { useSession } from '@/lib/session'
import { askLogout } from '@/widgets/LogoutDialog'
import { loginHref } from '@/components/dashboard-ui/LoginRequired'
import LanguageSwitcher from '@/components/dashboard-ui/LanguageSwitcher'
import NotificationBell from '@/features/profile/NotificationBell'
import Tip from '@/components/dashboard-ui/Tip'

const cls = 'flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text'

// アイコン列用: ログイン状態に応じてログアウト/ログインのアイコンボタンを出す
function Auth() {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const { data, error } = useDashboard()
  const sess = useSession()
  // 判定前にログインアイコンが一瞬出てログアウトに切り替わるちらつきを防ぐ
  if (!data && !error && !sess.ready) return <span className="size-9" aria-hidden />
  // dashboard API が412等で取れなくても、セッション上のログインならログアウトを出す
  if (data?.account || sess.logged_in) {
    const label = t('nb.logout')
    return <Tip label={label}><button type="button" onClick={askLogout} aria-label={label} data-cuelume-skip className={`${cls} hover:!text-red-400`}><LogOut className="size-[18px]" /></button></Tip>
  }
  const label = t('guest.login')
  return <Tip label={label}><a href={loginHref(pathname + search)} aria-label={label} className={cls}><KeyRound className="size-[18px]" /></a></Tip>
}

/** 言語切替 + ログイン/ログアウト。言語ボタンは常にログアウト(ログイン)の左 */
export default function AuthButton() {
  const sess = useSession()
  return <><LanguageSwitcher compact />{sess.logged_in && <NotificationBell />}<Auth /></>
}
