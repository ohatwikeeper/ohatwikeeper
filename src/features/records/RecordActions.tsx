import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'

interface Props {
  onBulk: () => void
  onUpdate: (period: 'month' | 'all') => void
  onZip: () => void
}

/** 一括登録・更新・ZIP DL のボタン群。表示時に順番にせり上がり、ホバーでアイコンが動く */
export default function RecordActions({ onBulk, onUpdate, onZip }: Props) {
  const { t } = useTranslation()
  const items = [
    { id: 'bulk-add-btn', icon: 'bx-list-plus', label: t('rc.bulk'), hover: { x: 2 }, onClick: onBulk },
    { id: 'update-month-btn', icon: 'bx-calendar-check', label: t('rc.updMonth'), hover: { y: -2 }, onClick: () => onUpdate('month') },
    { id: 'update-all-btn', icon: 'bx-sync', label: t('rc.updateAll'), hover: { rotate: 180 }, onClick: () => onUpdate('all') },
    { id: 'download-zip-btn', icon: 'bx-images', label: t('rc.zipDl'), hover: { y: 2 }, onClick: onZip },
  ]
  return (
    <motion.div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
      {items.map((it) => (
        <motion.button
          key={it.id}
          id={it.id}
          type="button"
          onClick={it.onClick}
          whileTap={{ scale: 0.97 }}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } } }}
          className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--arc-border)] bg-[var(--surface-raised)] px-3.5 py-3 text-left transition-colors hover:border-d-accent/50 hover:bg-d-accent/5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-d-accent/15 text-d-accent">
            <motion.i
              className={`bx ${it.icon} text-lg`}
              whileHover={it.hover}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          </span>
          <span className="text-sm font-semibold text-d-text">{it.label}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}
