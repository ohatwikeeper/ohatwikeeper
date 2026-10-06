import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogPanel, DialogHeader, DialogTitle, DialogDescription } from '@/components/animate-ui/components/headless/dialog'
import { motion } from 'motion/react'
import { IS_BETA } from '@/lib/beta/env'

const KEYS: [string, string, string][] = [
  ['g d', 'ダッシュボードへ', '/dashboard'],
  ['g f', 'フォルダへ', '/folder'],
  ['g n', '通知へ', '/notification'],
  ['g s', '設定へ', '/settings'],
  ['/', 'ユーザー検索へ', '/search'],
]

/** beta 限定: キーボードショートカット(g→移動 / ? で一覧) */
export default function BetaShortcuts() {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const g = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!IS_BETA) return
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.ctrlKey || e.metaKey || e.altKey || el.closest('input,textarea,select,[contenteditable="true"]')) return
      if (e.key === '?') { setOpen((v) => !v); return }
      if (e.key === '/') { e.preventDefault(); nav('/search'); return }
      if (e.key === 'g') { g.current = Date.now(); return }
      if (Date.now() - g.current < 1000) {
        const hit = KEYS.find(([k]) => k === `g ${e.key}`)
        if (hit) { g.current = 0; nav(hit[2]) }
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [nav])
  if (!IS_BETA) return null
  return (
    <Dialog open={open} onClose={() => setOpen(false)} initialFocus={panelRef}>
      <DialogPanel ref={panelRef} tabIndex={-1} showCloseButton={false} className="dash-vars max-w-sm outline-none">
        <DialogHeader>
          <DialogTitle>キーボードショートカット</DialogTitle>
          <DialogDescription>入力欄の外で使えます</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1">
          {[...KEYS, ['?', 'この一覧', ''] as [string, string, string]].map(([k, label], i) => (
            <motion.li key={k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 400, damping: 30 }} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-d-light">
              <span>{label}</span>
              <span className="flex gap-1">{k.split(' ').map((x, j) => <kbd key={j} className="min-w-6 rounded-md border border-d-border bg-d-light px-1.5 text-center font-mono text-xs shadow-[0_1px_0_var(--d-border)]">{x}</kbd>)}</span>
            </motion.li>
          ))}
        </ul>
      </DialogPanel>
    </Dialog>
  )
}
