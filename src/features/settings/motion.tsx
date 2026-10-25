import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { motionTokens as m } from '@/components/arc/lib/motion-tokens'

/** 設定画面の動きの共通部品。動きを減らす設定のときは短いフェードだけにする */

/** タブ切り替えで出入りするパネル(離れるときは速く、入るときは少し丁寧に) */
export function usePanelMotion(): HTMLMotionProps<'div'> {
  const reduce = !!useReducedMotion()
  return {
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0, transition: { duration: reduce ? 0.12 : m.duration.standard, ease: [...m.ease.enter] } },
    exit: { opacity: 0, transition: { duration: m.duration.instant, ease: [...m.ease.exit] } },
  }
}

/** 条件つきで現れるブロック。高さと透明度でなめらかに開閉する(初回表示では動かさない) */
export function Reveal({ show, children, className }: { show: boolean; children: ReactNode; className?: string }) {
  const reduce = !!useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="reveal"
          className={`overflow-hidden ${className ?? ''}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1, transition: reduce ? { duration: 0.12 } : { height: m.spring.smooth, opacity: { duration: m.duration.standard, delay: 0.04 } } }}
          exit={{ height: 0, opacity: 0, transition: { duration: reduce ? 0.1 : m.duration.exit, ease: [...m.ease.standard] } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** アイコンや短い文言の切り替え(拡大 + ぼかし + 透明度)。k が変わると入れ替わる */
export function Swap({ k, children, className }: { k: string | number; children: ReactNode; className?: string }) {
  const reduce = !!useReducedMotion()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={k}
        className={`inline-flex ${className ?? ''}`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
        transition={reduce ? { duration: 0.1 } : { type: 'spring', duration: 0.3, bounce: 0 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

/** 一覧の行。追加・削除・並び替えで周りの行が滑って詰まる */
export function useListItem(): HTMLMotionProps<'li'> {
  const reduce = !!useReducedMotion()
  return {
    layout: reduce ? false : 'position',
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0, transition: { duration: m.duration.standard, ease: [...m.ease.enter] } },
    exit: { opacity: 0, y: reduce ? 0 : -4, transition: { duration: m.duration.exit, ease: [...m.ease.exit] } },
  }
}

/** div 用の一覧項目の動き(useListItem の div 版) */
export function useItemMotion(): HTMLMotionProps<'div'> {
  const { layout, initial, animate, exit } = useListItem() as HTMLMotionProps<'div'>
  return { layout, initial, animate, exit }
}
