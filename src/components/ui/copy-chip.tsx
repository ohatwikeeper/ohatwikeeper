import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

/** ラベル付きコピーボタン。クリックでコピー → アイコン/文言がぼかしながら切り替わり、完了時は緑にフェード + トースト。 */
export function CopyChip({ text, label, doneLabel, toastMessage, className }: {
  text: string | (() => string); label?: string; doneLabel?: string; toastMessage?: string; className?: string
}) {
  const { t: tr } = useTranslation()
  const [done, setDone] = useState(false)
  const copy = async () => {
    if (done) return
    const v = typeof text === 'function' ? text() : text
    if (!v) return
    try { await navigator.clipboard.writeText(v) } catch { toast.error(tr('cm.copyFail')); return }
    setDone(true)
    toast.success(toastMessage ?? tr('cm.copiedClip'))
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <motion.button
      type="button" onClick={copy} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'relative inline-flex items-center gap-1.5 overflow-hidden rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
        done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-d-border bg-d-bg text-d-text2 hover:text-d-text',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={done ? 'done' : 'idle'} className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)', scale: 0.8 }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)', scale: 0.8 }} transition={{ duration: 0.18 }}>
          {done ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {done ? (doneLabel ?? tr('cm.copied')) : (label ?? tr('cm.copy'))}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
