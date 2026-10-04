import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import type { DashTheme } from '@/lib/dashboard/theme'
import { cn } from '@/lib/utils'
import Tip from '@/components/dashboard-ui/Tip'

/** 地平線から太陽が沈む/昇るアイコンのテーマ切替ボタン(account.lapius7.com と同じ意匠) */
export default function ThemeToggle({ theme, onToggle, className }: { theme: DashTheme; onToggle: (x: number, y: number) => void; className?: string }) {
  const { t: tr } = useTranslation()
  return (
    <Tip label={theme === 'dark' ? tr('cn.toLight') : tr('cn.toDark')}>
    <button
      type="button"
      onClick={(e) => onToggle(e.clientX, e.clientY)}
      aria-label={tr('cn.themeToggle')}
      className={cn('flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text', className)}
    >
      {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
    </Tip>
  )
}
