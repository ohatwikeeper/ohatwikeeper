import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { AlertCircle, Check, CornerDownLeft, Link as LinkIcon, Loader2 } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

type Phase = 'idle' | 'busy' | 'done'

const swap = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
  transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
} as const

/** おはツイのURLを1件追加・更新するフォーム。送信中/成功/失敗で見た目が変わる */
export default function AddRecordForm({ onAdd }: { onAdd: (url: string) => Promise<boolean> }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [err, setErr] = useState('')
  const shake = useAnimationControls()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase !== 'idle') return
    const v = url.trim()
    let msg = ''
    if (!v) msg = t('rc.postUrl')
    else if (!/^https?:\/\/(www\.)?(x|twitter)\.com\/[^/]+\/status\/\d+/.test(v)) msg = t('rc.postUrl')
    if (msg) {
      setErr(msg)
      shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } })
      document.getElementById('url')?.focus()
      return
    }
    setPhase('busy')
    const ok = await onAdd(url)
    if (ok) {
      setUrl('')
      setPhase('done')
      setTimeout(() => setPhase('idle'), 1200)
    } else {
      setPhase('idle')
      shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } })
    }
  }

  return (
    <form className="add-post-form mb-2" noValidate onSubmit={submit}>
      <label htmlFor="url" className="mb-2 block text-sm">{t('rc.addUpdate')}</label>
      <motion.div animate={shake}>
        <InputGroup className={err ? 'border-red-500/70 ring-2 ring-red-500/20' : undefined}>
          <InputGroupAddon><LinkIcon /></InputGroupAddon>
          <InputGroupInput id="url" type="url" placeholder="Post URL" autoComplete="off" className="selection:bg-white/20 selection:text-d-text" aria-invalid={!!err} aria-describedby={err ? 'url-error' : undefined} value={url} onChange={(e) => { setUrl(e.target.value); if (err) setErr('') }} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" variant="secondary" disabled={phase === 'busy'} className="relative min-w-20 overflow-hidden active:scale-[0.96] transition-transform">
              <AnimatePresence mode="popLayout" initial={false}>
                {phase === 'idle' && (
                  <motion.span key="idle" {...swap} className="flex items-center gap-1.5"><CornerDownLeft className="size-4" />{t('rc.submit')}</motion.span>
                )}
                {phase === 'busy' && (
                  <motion.span key="busy" {...swap} className="flex items-center gap-1.5"><Loader2 className="size-4 animate-spin" />{t('rc.fetching')}</motion.span>
                )}
                {phase === 'done' && (
                  <motion.span key="done" {...swap} className="flex items-center gap-1.5">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Check className="size-4" /></motion.span>{t('rc.done')}
                  </motion.span>
                )}
              </AnimatePresence>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </motion.div>
      <AnimatePresence initial={false}>
        {err && (
          <motion.p id="url-error" role="alert" initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 overflow-hidden pt-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />{err}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  )
}
