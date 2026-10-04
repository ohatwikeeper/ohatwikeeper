import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sanitize } from '@/lib/dashboard/format'
import { TOUR_STEPS, completeTour } from '@/lib/dashboard/tour'

type Rect = { top: number; left: number; width: number; height: number }
const M = 16
const PAD = 8
const EASE = [0.22, 1, 0.36, 1] as const

/** shadcn/tour 方式: スポットライトとポップオーバーを1組の motion 要素として同じ座標系で動かす */
export function TourHost() {
  const { t: tt } = useTranslation()
  const [steps, setSteps] = useState<typeof TOUR_STEPS>([])
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [size, setSize] = useState({ w: 340, h: 180 })
  const pop = useRef<HTMLDivElement>(null)
  const active = steps.length > 0

  // 途中で閉じただけでは完了にしない(リロードで再表示)。最後の「完了」だけ完了フラグを送る
  const end = useCallback((done = false) => {
    setSteps([])
    document.getElementById('tour-center')?.remove()
    if (done) completeTour()
  }, [])

  useEffect(() => {
    const start = () => {
      // 画面にない要素のステップは飛ばす。ウェルカムは不可視アンカーを画面中央に置く
      if (!document.getElementById('tour-center')) {
        const a = document.createElement('div')
        a.id = 'tour-center'
        a.style.cssText = 'position:fixed;top:50%;left:50%;width:1px;height:1px;pointer-events:none'
        document.body.appendChild(a)
      }
      setIdx(0)
      setSteps(TOUR_STEPS.filter((s) => document.querySelector(s.element)))
    }
    window.addEventListener('ohatwi:tour', start)
    return () => window.removeEventListener('ohatwi:tour', start)
  }, [])

  const measure = useCallback(() => {
    const t = steps[idx] && document.querySelector<HTMLElement>(steps[idx].element)
    if (!t) return
    const r = t.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [steps, idx])

  // ステップ移動: 折りたたみを開く → 必要なら即時スクロール → 最終位置を1回だけ計測
  useLayoutEffect(() => {
    if (!active) return
    const t = document.querySelector<HTMLElement>(steps[idx].element)
    if (!t) return
    const trig = t.querySelector<HTMLElement>('[data-slot=accordion-trigger], button[aria-expanded]')
    const opened = !!(trig && trig.offsetParent && trig.getAttribute('aria-expanded') === 'false')
    if (opened) trig!.click()
    const go = () => {
      const r = t.getBoundingClientRect()
      const narrow = window.innerWidth < 640
      if (narrow && steps[idx].element !== '#tour-center' && (r.top < 60 || r.top > window.innerHeight * 0.4)) {
        t.style.scrollMarginTop = '72px'
        t.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior })
      } else if (r.top < 0 || r.bottom > window.innerHeight) {
        t.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
      }
      measure()
    }
    if (opened) { const id = setTimeout(go, 350); return () => clearTimeout(id) }
    go()
  }, [active, steps, idx, measure])

  useLayoutEffect(() => {
    if (!active || !pop.current) return
    setSize({ w: pop.current.offsetWidth, h: pop.current.offsetHeight })
  }, [active, idx])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end(false)
      else if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, steps.length - 1))
      else if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, steps.length, measure, end])

  if (!active || !rect) return null
  const step = steps[idx]
  const last = idx === steps.length - 1
  const center = step.element === '#tour-center'
  const vw = window.innerWidth
  const vh = window.innerHeight
  const pw = Math.min(size.w, vw - M * 2)
  const ph = size.h
  const hl = center
    ? { top: rect.top, left: rect.left, width: 0, height: 0 }
    : { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
  let left: number
  let top: number
  if (center) { left = vw / 2 - pw / 2; top = vh / 2 - ph / 2 }
  else if (hl.left + hl.width + M + pw <= vw - M) { left = hl.left + hl.width + M; top = hl.top + hl.height / 2 - ph / 2 }
  else if (hl.top + hl.height + M + ph <= vh - M) { left = hl.left; top = hl.top + hl.height + M }
  else { left = hl.left; top = hl.top - ph - M }
  left = Math.min(Math.max(M, left), vw - pw - M)
  top = Math.min(Math.max(M, top), vh - ph - M)
  const tr = { duration: 0.45, ease: EASE }

  return createPortal(
    <div className="dash-vars">
      <div className="fixed inset-0 z-[10000]" onClick={(e) => e.stopPropagation()} />
      <motion.div
        className="pointer-events-none fixed z-[10001] rounded-[14px] border-2 border-d-accent"
        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,.72)' }}
        initial={false}
        animate={{ ...hl, opacity: center ? 0 : 1 }}
        transition={tr}
      />
      <motion.div
        ref={pop}
        data-tour-pop=""
        aria-label={tt(step.title)}
        className="fixed z-[10002] w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-d-border bg-d-med p-4 text-d-text shadow-2xl"
        initial={false}
        animate={{ top, left }}
        transition={tr}
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-d-accent transition-[width] duration-500" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
        <button type="button" aria-label={tt('aw.close')} onClick={() => end(false)} className="absolute right-2 top-2 rounded p-1 text-d-text2 hover:text-d-text">
          <X className="size-4" />
        </button>
        <h3 className="pr-6 text-base font-semibold">{tt(step.title)}</h3>
        <p className="mt-2 text-sm text-d-text2" dangerouslySetInnerHTML={{ __html: sanitize(tt(step.description)) }} />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-d-text2">{idx + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {idx > 0 && <Button size="sm" variant="secondary" onClick={() => setIdx(idx - 1)}>{tt('cn.back')}</Button>}
            <Button size="sm" onClick={() => (last ? end(true) : setIdx(idx + 1))}>{last ? tt('cn.finish') : tt('cn.next')}</Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
