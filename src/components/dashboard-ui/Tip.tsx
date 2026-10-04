import { useState, type ReactElement, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Side = 'top' | 'right' | 'bottom' | 'left'

/** 単一の要素をトリガにした reui(shadcn/Radix) ツールチップの薄いラッパ。
 *  title 属性の置き換え用。子要素は ref を透過する DOM 要素(button/a など)であること。
 *  クリック/キー操作・フォーカス喪失で必ず閉じる(ボタン押下後に残らないように) */
export default function Tip({ label, children, side = 'top' }: { label: ReactNode; children: ReactElement; side?: Side }) {
  const [open, setOpen] = useState(false)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild onPointerDownCapture={() => setOpen(false)} onClickCapture={() => setOpen(false)} onKeyDownCapture={() => setOpen(false)} onBlur={() => setOpen(false)}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
