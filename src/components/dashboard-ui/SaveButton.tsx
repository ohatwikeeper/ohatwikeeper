import { useEffect, useState, type ComponentProps } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

/** 保存ボタン。保存中はスピナー、完了すると一瞬チェックマークに変わる */
export default function SaveButton({ saving, label, ...props }: { saving: boolean; label: string } & Omit<ComponentProps<typeof Button>, 'children'>) {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)
  const [was, setWas] = useState(false)
  useEffect(() => {
    if (was && !saving) { setDone(true); const t = setTimeout(() => setDone(false), 1600); return () => clearTimeout(t) }
    setWas(saving)
  }, [saving]) // eslint-disable-line react-hooks/exhaustive-deps
  const state = saving ? 'saving' : done ? 'done' : 'idle'
  return (
    <Button disabled={saving} {...props} className={`min-w-36 overflow-hidden bg-foreground text-background hover:bg-foreground/90 ${props.className ?? ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={state} className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.9 }} transition={{ duration: 0.16 }}>
          {state === 'saving' && <><Spinner />{t('save.saving')}</>}
          {state === 'done' && <><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Check className="size-4" /></motion.span>{t('save.done')}</>}
          {state === 'idle' && label}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
