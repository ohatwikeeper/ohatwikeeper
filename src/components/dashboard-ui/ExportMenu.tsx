import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Download, FileJson, Table, CalendarDays, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/lib/toast'

// shadcn-space dropdown-menu-10 (Export) をベースに、実データのダウンロードへ接続
type Fmt = { id: string; ext: string; label: string; description: string; icon: LucideIcon }
const FORMATS: Fmt[] = [
  { id: 'csv', ext: 'csv', label: 'CSV', description: 'xp.csv', icon: Table },
  { id: 'json', ext: 'json', label: 'JSON', description: 'xp.json', icon: FileJson },
  { id: 'ics', ext: 'ics', label: 'xp.icsL', description: 'xp.ics', icon: CalendarDays },
]

const SPRING = { type: 'spring', bounce: 0.2, duration: 0.5 } as const
const itemClass = 'cursor-pointer gap-3 rounded-lg p-2 text-sm'

type Status = 'idle' | 'exporting' | 'done'

export default function ExportMenu({ endpoint = '/app-api/export' }: { endpoint?: string }) {
  const { t: tr } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [fmt, setFmt] = useState<Fmt>(FORMATS[0])

  useEffect(() => {
    if (status !== 'exporting') return
    const t = setInterval(() => setProgress((p) => Math.min(p + 6, 90)), 140)
    return () => clearInterval(t)
  }, [status])
  useEffect(() => {
    if (status !== 'done') return
    const t = setTimeout(() => { setStatus('idle'); setProgress(0) }, 2500)
    return () => clearTimeout(t)
  }, [status])

  const start = async (f: Fmt) => {
    if (status !== 'idle') return
    setFmt(f); setProgress(0); setStatus('exporting')
    try {
      const res = await fetch(`${endpoint}?format=${f.id}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const name = res.headers.get('Content-Disposition')?.match(/filename="(.+?)"/)?.[1] ?? `ohatwikeeper_export.${f.ext}`
      const url = URL.createObjectURL(await res.blob())
      Object.assign(document.createElement('a'), { href: url, download: name }).click()
      URL.revokeObjectURL(url)
      setProgress(100); setStatus('done')
    } catch {
      toast.error(tr('xp.fail'))
      setStatus('idle'); setProgress(0)
    }
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="cursor-pointer gap-2" disabled={status === 'exporting'} />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }} className="flex items-center gap-2">
              {status === 'idle' && <><Download className="size-4" />{tr('xp.btn')}<ChevronDown className="size-4 text-muted-foreground" /></>}
              {status === 'exporting' && <><Download className="size-4" />{tr('xp.making', { f: fmt.label.startsWith('xp.') ? tr(fmt.label) : fmt.label, p: progress })}</>}
              {status === 'done' && <><Check className="size-4 text-emerald-400" />{tr('xp.done')}</>}
            </motion.span>
          </AnimatePresence>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={6} className="w-72 p-2">
          <DropdownMenuGroup>
            
            {FORMATS.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: 0.03 + i * 0.05 }}>
                  <DropdownMenuItem className={itemClass} onClick={() => start(f)}>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted"><Icon className="size-4" /></span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="font-medium">{f.label.startsWith('xp.') ? tr(f.label) : f.label}</span>
                      <span className="truncate text-xs font-normal text-muted-foreground">{tr(f.description)}</span>
                    </span>
                  </DropdownMenuItem>
                </motion.div>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  )
}
