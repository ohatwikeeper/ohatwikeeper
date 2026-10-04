import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, CopyIcon, ExternalLink } from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const linkBtn = 'flex h-10 items-center justify-center gap-2 rounded-xl border border-d-border bg-d-med text-sm text-d-text'

export default function ShareUrlBlock({ shareUrl }: { shareUrl: string }) {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch { toast.error(t('sh.copyFail')); return }
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  const text = encodeURIComponent(t('sh.tweet'))

  return (
    <div id="share-url-block">
      <label className="mb-2 block text-sm text-d-text2">
        {t('sh.urlLabel')}
      </label>
      <InputGroup className={cn('cursor-pointer transition-colors', done && 'border-emerald-500/50 bg-emerald-500/10')} onClick={copy}>
        <InputGroupInput id="share-url-input" aria-label={t('sh.urlLabel')} readOnly value={shareUrl}className="cursor-pointer select-none selection:bg-transparent" onFocus={(e) => e.currentTarget.setSelectionRange(0, 0)} />
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
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a href={shareUrl} target="_blank" rel="noopener" className={linkBtn}>
          <ExternalLink className="size-4" />{t('sh.open')}
        </a>
        <a href={`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className={linkBtn}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t('sh.onX')}
        </a>
      </div>
    </div>
  )
}
