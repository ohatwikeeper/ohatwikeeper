import { Languages, LogIn, Palette, Sun } from 'lucide-react'
import IconStack from '@/components/dashboard-ui/IconStack'
import { useTranslation } from 'react-i18next'
import { useDashTheme } from '@/lib/dashboard/theme'
import ThemeToggle from '@/features/profile/ThemeToggle'
import { useNavigate } from 'react-router-dom'
import AuthButton from '@/components/dashboard-ui/AuthButton'
import OwnerBadge from '@/features/profile/OwnerBadge'
import Tip from '@/components/dashboard-ui/Tip'
import { Skeleton } from '@/components/ui/skeleton'

/** 未ログイン用: ログイン時のプロフィール(ProfileHeader)のスケルトン版。操作アイコン列とログイン導線つき */
export default function GuestToolbar({ loginHref }: { loginHref: string }) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useDashTheme()
  const nav = useNavigate()
  return (
    <section aria-label="guest-profile">
      <OwnerBadge own={false} guest />
      <div className="flex items-start justify-between">
        <Skeleton shimmer={false} className="size-20 rounded-full bg-d-light" />
        <div className="flex items-center">
          <IconStack chips={[Sun, Palette, Languages]} total={4}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Tip label={t('cm.theme')}>
            <button type="button" onClick={() => nav('/settings/theme')} aria-label={t('cm.themeOpen')} data-cuelume-skip
              className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text">
              <Palette className="size-[18px]" />
            </button>
          </Tip>
          <AuthButton />
          </IconStack>
        </div>
      </div>
      <Skeleton shimmer={false} className="mt-4 h-7 w-40 bg-d-light" />
      <Skeleton shimmer={false} className="mt-2 h-4 w-24 bg-d-light" />
      <p className="mt-3 text-xs leading-snug text-d-text2">{t('guest.msg')}</p>
      <a href={loginHref} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-d-accent px-3.5 py-2 text-sm font-bold !text-d-accent-fg transition hover:brightness-110">
        <LogIn className="size-4" />{t('guest.login')}
      </a>
      <dl className="mt-4 grid grid-cols-2 border-t border-d-border text-sm">
        {[0, 1].map((i) => (
          <div key={i} className="border-b border-d-border py-2">
            <Skeleton shimmer={false} className="h-4 w-10 bg-d-light" />
            <Skeleton shimmer={false} className="mt-1.5 h-3 w-14 bg-d-light" />
          </div>
        ))}
      </dl>
    </section>
  )
}
