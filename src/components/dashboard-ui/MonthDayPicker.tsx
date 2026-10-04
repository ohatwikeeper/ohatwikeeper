import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** 年なしで月日だけを選ぶ(誕生日用)。月を選ぶと日のグリッドに切り替わる */
export default function MonthDayPicker({ month, day, onChange }: {
  month: number | null; day: number | null; onChange: (m: number | null, d: number | null) => void
}) {
  const { t: tr, i18n } = useTranslation()
  const mname = (n: number, day?: number) => new Date(2000, n - 1, day ?? 1).toLocaleDateString(i18n.language, day ? { month: 'short', day: 'numeric' } : { month: 'short' })
  const [open, setOpen] = useState(false)
  const [m, setM] = useState<number | null>(month)
  const label = month && day ? mname(month, day) : tr('cn.pickMd')

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setM(month) }}>
      <PopoverTrigger render={<Button variant="outline" className="w-44 cursor-pointer justify-start gap-2 font-normal" />}>
        <CalendarDays className="size-4 text-muted-foreground" />{label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        {m === null ? (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => (
              <Button key={i} variant="ghost" size="sm" className="cursor-pointer" onClick={() => setM(i + 1)}>{mname(i + 1)}</Button>
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <button type="button" className="cursor-pointer text-sm font-semibold hover:underline" onClick={() => setM(null)}>{mname(m)} ▾</button>
              <button type="button" className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { onChange(null, null); setOpen(false) }}>{tr('cn.clear')}</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: DAYS[m - 1] }, (_, i) => (
                <button key={i} type="button"
                  className={cn('size-8 cursor-pointer rounded-md text-sm hover:bg-muted', month === m && day === i + 1 && 'bg-foreground text-background hover:bg-foreground')}
                  onClick={() => { onChange(m, i + 1); setOpen(false) }}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
