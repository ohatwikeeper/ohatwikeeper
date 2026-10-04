import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import Tip from '@/components/dashboard-ui/Tip'

type View = 'list' | 'grid'
const OPTIONS: { value: View; icon: string; label: string }[] = [
  { value: 'list', icon: 'bx-list-ul', label: 'rc.vList' },
  { value: 'grid', icon: 'bxs-grid-alt', label: 'rc.vGrid' },
]

/** リスト/タイル表示のセグメントトグル。選択中の背景がスライドして移動する */
export default function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const { t } = useTranslation()
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-d-border bg-d-med p-1">
      {OPTIONS.map((o) => {
        const active = value === o.value
        return (
          <Tip key={o.value} label={t(o.label)}>
          <button
            type="button"
            id={`view-${o.value}-btn`}
            aria-label={t(o.label)}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="view-toggle-btn relative grid size-8 place-items-center rounded-full transition-colors"
          >
            {active && (
              <motion.span
                layoutId="view-toggle-active"
                className="pointer-events-none absolute inset-0 rounded-full bg-d-text"
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              />
            )}
            <i
              className={cn(
                'bx text-lg leading-none relative z-10 pointer-events-none transition-colors',
                active ? 'text-[var(--primary-foreground)]' : 'text-d-text2',
                o.icon,
              )}
            />
          </button>
          </Tip>
        )
      })}
    </div>
  )
}
