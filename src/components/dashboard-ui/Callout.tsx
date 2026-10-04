import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'warning' | 'info'

const styles: Record<Variant, { box: string; icon: string; accent: string }> = {
  warning: {
    box: 'border-d-danger/30 bg-d-danger/10',
    icon: 'bx-error-circle text-d-danger',
    accent: 'text-d-danger',
  },
  info: {
    box: 'border-d-border bg-d-med',
    icon: 'bx-info-circle text-d-text2',
    accent: 'text-d-text',
  },
}

interface Action { label: string; onClick: () => void; icon?: string; busy?: boolean }

/** ダッシュボードの注意書き用コールアウト。アイコン＋本文、任意で右側にアクションボタン */
export default function Callout({
  variant = 'warning',
  children,
  action,
  className,
}: { variant?: Variant; children: ReactNode; action?: Action; className?: string }) {
  const s = styles[variant]
  return (
    <div
      role={variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-3 text-xs leading-relaxed', s.box, className)}
    >
      <i className={cn('bx shrink-0 text-base', s.icon)} />
      <p className="min-w-0 flex-1 text-d-text2">{children}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.busy}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current px-3 py-1 font-semibold transition-colors',
            s.accent,
            ' disabled:opacity-50',
          )}
        >
          <i className={cn('bx', action.icon ?? 'bx-sync', action.busy && 'animate-spin')} />
          {action.label}
        </button>
      )}
    </div>
  )
}
