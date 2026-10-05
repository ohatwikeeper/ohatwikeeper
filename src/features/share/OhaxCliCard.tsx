import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { CONFIG } from '@/lib/config'
import { Accordion } from '@/components/arc/accordion/accordion'

const INSTALL = "npm i -g @ohatwikeeper/cli"

export function CmdLine({ cmd, id, prompt = "$" }: { cmd: string; id?: string; prompt?: React.ReactNode }) {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd) } catch { toast.error(t('sh.copyFail')); return }
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <InputGroup className={cn('cursor-pointer transition-colors', done && 'border-emerald-500/50 bg-emerald-500/10')} onClick={copy}>
      <InputGroupAddon><span className="flex items-center font-mono text-d-text3">{prompt}</span></InputGroupAddon>
      <InputGroupInput id={id} readOnly aria-label={t('sh.copyAria', { c: cmd })} value={cmd} className="pointer-events-none cursor-pointer select-none font-mono selection:bg-transparent [-webkit-user-select:none]" tabIndex={-1} onFocus={(e) => e.currentTarget.setSelectionRange(0, 0)} />
      <InputGroupAddon align="inline-end">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={done ? 'done' : 'idle'} className={cn('grid size-8 place-items-center', done ? 'text-emerald-400' : 'text-d-text2')}
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }} transition={{ duration: 0.18 }}>
            {done ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </InputGroupAddon>
    </InputGroup>
  )
}

/** 常に表示する(メニューの「ターミナルで見る(CLI)」とは別に、ここから手順が分かるようにする) */
export default function OhaxCliCard({ command, isPublic }: { command: string; isPublic: boolean }) {
  const { t } = useTranslation()
  return (
    <section id="ohax-cli-card" className="rounded-2xl border border-d-border bg-d-med p-4">
      <h2 className="text-sm font-bold">{t('sh.cliHead')}</h2>
      <div className="mt-3"><CmdLine cmd={command} id="ohax-cli-copy" /></div>
      <div className="mt-3 [&>*]:border-t-0">
        <Accordion
          defaultOpen={-1}
          items={[{
            title: t('sh.cliFirst'),
            content: (
              <div className="text-xs text-d-text3">
                <CmdLine cmd={INSTALL} />
                <p className="mt-1.5">{t('sh.cliAfter', { c: 'ohax profile' })}</p>
              </div>
            ),
          }]}
        />
      </div>
      <Link to={CONFIG.PAGES.CLI_TOOLS} className="mt-3 inline-block text-xs text-d-text2 hover:text-d-text">{t('sh.cliMore')}</Link>
      {!isPublic && <p className="mt-2 text-xs text-d-text">{t('sh.cliPublic')}</p>}
    </section>
  )
}
