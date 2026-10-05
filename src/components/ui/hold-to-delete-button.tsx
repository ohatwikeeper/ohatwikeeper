import { useEffect, useRef, useState, type ReactNode } from 'react'

/** 長押しで確定する削除ボタン(モーダル不要)。途中で離すとキャンセル。Enter/Space長押しにも対応 */
export function HoldToDeleteButton({
  onDelete, duration = 1200, className = '', disabled, label, children,
}: {
  onDelete: () => void | Promise<void>
  duration?: number
  className?: string
  disabled?: boolean
  label?: string
  children: ReactNode
}) {
  const [p, setP] = useState(0)
  const raf = useRef(0)
  const t0 = useRef(0)

  const stop = () => { cancelAnimationFrame(raf.current); t0.current = 0; setP(0) }
  const tick = () => {
    const v = Math.min(1, (performance.now() - t0.current) / duration)
    setP(v)
    if (v >= 1) { t0.current = 0; setP(0); void onDelete() } else raf.current = requestAnimationFrame(tick)
  }
  const start = () => { if (disabled || t0.current) return; t0.current = performance.now(); raf.current = requestAnimationFrame(tick) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <button
      type="button" disabled={disabled} aria-label={label} title={label}
      className={`relative overflow-hidden select-none touch-none ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); start() }}
      onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') stop() }}
      onBlur={stop}
    >
      <span aria-hidden className="absolute inset-0 origin-bottom bg-red-500/60 motion-reduce:hidden" style={{ transform: `scaleY(${p})` }} />
      <span className="relative">{children}</span>
    </button>
  )
}
