import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'

const ROW = 32
const H = ROW * 5

export interface WheelOption<T> { value: T; label: ReactNode }

function Item({ index, pos, top, children }: { index: number; pos: MotionValue<number>; top: number; children: ReactNode }) {
  const y = useTransform(pos, (p) => (index - p) * ROW)
  return (
    <motion.div style={{ y, top, height: ROW }} className="absolute inset-x-0 flex items-center justify-center text-sm font-semibold tabular-nums">
      {children}
    </motion.div>
  )
}

/**
 * 選択枠が固定でリストが動くホイール式ピッカー(ポップアップ部分のみ)。
 * anchorRef の要素に重ねて表示する。開閉(isOpen/onClose)と開くきっかけの見た目は呼び出し側が持つ。
 * 操作: 掴んで上下ドラッグ / ホイール / ↑↓ / クリック、Esc・外側クリック・Enterで閉じる。
 * options は上から下の並び順。使用例は features/records/ContributionGraph.tsx。
 */
export default function WheelPicker<T>({ options, value, onChange, anchorRef, isOpen, onClose }: {
  options: WheelOption<T>[]
  value: T
  onChange: (value: T) => void
  anchorRef: RefObject<HTMLElement | null>
  isOpen: boolean
  onClose: () => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cur = Math.max(0, options.findIndex((o) => o.value === value))
  const pos = useMotionValue(cur)
  const drag = useRef({ y: 0, base: 0, moved: false })
  const last = options.length - 1
  const clamp = (v: number) => Math.min(last, Math.max(0, v))

  useEffect(() => {
    if (isOpen) { pos.set(cur); setRect(anchorRef.current?.getBoundingClientRect() ?? null) } else setRect(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const settle = (to: number) => {
    const i = clamp(Math.round(to))
    animate(pos, i, { type: 'spring', stiffness: 400, damping: 36 })
    if (options[i] && options[i].value !== value) onChange(options[i].value)
  }

  useEffect(() => {
    if (!rect) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose()
      else if (e.key === 'ArrowUp') settle(pos.get() - 1)
      else if (e.key === 'ArrowDown') settle(pos.get() + 1)
    }
    const onDown = (e: PointerEvent) => { if (!(e.target as Element).closest('[data-wheel-picker]')) onClose() }
    // 開いている間はページ側のスクロールを止める(React の onWheel は passive で preventDefault できない)
    const onWheel = (e: WheelEvent) => e.preventDefault()
    document.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('wheel', onWheel); document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  })

  if (!rect) return null
  const list = (top: number, cls: string) => options.map((o, i) => <Item key={i} index={i} pos={pos} top={top}><span className={cls}>{o.label}</span></Item>)
  const fade = 'linear-gradient(transparent, #000 30%, #000 70%, transparent)'

  return createPortal(
    <div
      data-wheel-picker
      className="fixed z-[60] cursor-grab touch-none select-none overflow-hidden rounded-[28px] bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 active:cursor-grabbing"
      style={{ left: rect.left + rect.width / 2 - Math.max(rect.width, 96) / 2, width: Math.max(rect.width, 96), top: rect.top + rect.height / 2 - H / 2, height: H }}
      onPointerDown={(e) => { drag.current = { y: e.clientY, base: pos.get(), moved: false }; e.currentTarget.setPointerCapture(e.pointerId) }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const dy = e.clientY - drag.current.y
        if (Math.abs(dy) > 4) drag.current.moved = true
        if (drag.current.moved) pos.set(clamp(drag.current.base - dy / ROW))
      }}
      onPointerUp={(e) => {
        if (drag.current.moved) { settle(pos.get()); return }
        settle(pos.get() + Math.round((e.clientY - (rect.top + rect.height / 2)) / ROW))
        onClose()
      }}
      onWheel={(e) => settle(pos.get() + Math.sign(e.deltaY))}
    >
      <div className="absolute inset-0" style={{ maskImage: fade, WebkitMaskImage: fade }}>{list(H / 2 - ROW / 2, 'text-d-text2')}</div>
      <div className="absolute inset-x-0 overflow-hidden rounded-full bg-foreground" style={{ top: H / 2 - ROW / 2, height: ROW }}>{list(0, 'text-background')}</div>
    </div>,
    document.body,
  )
}
