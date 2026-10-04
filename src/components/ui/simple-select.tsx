import { useRef, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import WheelPicker from '@/components/dashboard-ui/WheelPicker'
import { cn } from '@/lib/utils'

type Opt = { value: string; label: string }

/** <select> 感覚で使えるホイール式の選択UI(WheelPicker のラッパー)。アプリ内の選択系はこれに統一する */
export function SimpleSelect({ value, onChange, options, className, id }: { value: string; onChange: (v: string) => void; options: Opt[]; className?: string; id?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <>
      <button
        ref={ref}
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className={cn('flex h-8 w-fit cursor-pointer items-center justify-between gap-2 rounded-lg border border-d-border bg-transparent px-2.5 text-sm whitespace-nowrap outline-none transition-colors focus-visible:border-ring', open && 'opacity-0', className)}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <WheelPicker options={options} value={value} onChange={onChange} anchorRef={ref} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
