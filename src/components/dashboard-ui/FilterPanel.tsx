import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// shadcn-space dropdown-menu-09 (Filters) をベースにした、その場で展開するフィルターパネル
export default function FilterPanel({ activeCount, resultCount, onReset, children }: {
  activeCount: number; resultCount: number; onReset: () => void; children: ReactNode
}) {
  const { t: tr } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  }, [])

  return (
    <div ref={rootRef} className="relative h-9 w-36">
      <motion.div
        initial={false}
        animate={{ width: open ? Math.min(352, window.innerWidth - 32) : 144, height: open ? 'auto' : 36, borderRadius: open ? 24 : 18 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className={cn('absolute left-0 top-0 z-20 overflow-hidden border border-[var(--arc-border)] bg-[var(--surface-raised)]', open && 'shadow-xl')}
      >
        {!open ? (
          <Button variant="ghost" aria-expanded={open} onClick={() => setOpen(true)}
            className="h-9 w-full justify-between gap-3 rounded-full px-4 hover:bg-transparent dark:hover:bg-transparent cursor-pointer">
            <span className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-[var(--text-secondary)]" /><span className="text-sm font-normal">{tr('cn.filter')}</span></span>
            <span className="flex items-center gap-2"><ChevronDown className="size-4 text-[var(--text-muted)]" /></span>
          </Button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">{tr('cn.filter')}</p>
                {activeCount > 0 && <Badge>{activeCount}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setOpen(false)}>
                <ChevronUp className="size-4" /><span className="sr-only">{tr('aw.close')}</span>
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-5 p-4">{children}</div>
            <Separator />
            <div className="flex items-center gap-2 p-3">
              <Button variant="outline" className="rounded-full cursor-pointer" disabled={activeCount === 0} onClick={onReset}>{tr('cn.reset')}</Button>
              <Button className="flex-1 rounded-full cursor-pointer" disabled={resultCount === 0} onClick={() => setOpen(false)}>
                {resultCount === 0 ? tr('cn.none') : (
                  <span className="flex items-center gap-1">
                    <span className="relative inline-flex overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={resultCount} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.15 }}>{resultCount}</motion.span>
                      </AnimatePresence>
                    </span>{tr('cn.showSuffix')}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
