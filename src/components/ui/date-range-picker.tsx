import { Popover } from '@base-ui/react/popover'
import { DayPicker, type DateRange } from 'react-day-picker'
import { ja, enUS, ko, zhCN, de, fr, es, pt, it, ru } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

const LOCALES = { ja, en: enUS, ko, zh: zhCN, de, fr, es, pt, it, ru } as const
import { CalendarIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

/** shadcn 風の期間選択(Popover + Calendar)。未選択が既定 */
export function DateRangePicker({ value, onChange, className }: { value: DateRange | undefined; onChange: (v: DateRange | undefined) => void; className?: string }) {
  const { t, i18n } = useTranslation()
  const locale = LOCALES[i18n.language.split('-')[0] as keyof typeof LOCALES] ?? ja
  const label = value?.from ? `${fmt(value.from)}${value.to ? ` – ${fmt(value.to)}` : ' –'}` : t('ranking.pick')
  return (
    <div className={cn('inline-flex h-9 items-center rounded-full border border-d-border bg-d-med text-sm', className)}>
      <Popover.Root>
        <Popover.Trigger className={cn('inline-flex h-full items-center gap-2 rounded-full pl-3 pr-3 text-d-text', !value?.from && 'text-d-text2', value?.from && 'rounded-r-none')}>
          <CalendarIcon className="size-4 text-d-text2" />
          <span className="tabular-nums">{label}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="start" className="z-[3000]">
            <Popover.Popup className="dash-vars rounded-xl border border-d-border bg-d-med p-3 text-d-text shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
              <DayPicker mode="range" locale={locale} selected={value} onSelect={onChange} defaultMonth={value?.from} showOutsideDays
                classNames={{
                  root: 'text-sm',
                  months: 'relative flex flex-col gap-4',
                  month_caption: 'flex h-8 items-center justify-center font-medium',
                  nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                  button_previous: 'grid size-8 place-items-center rounded-md text-d-text2 hover:text-d-text',
                  button_next: 'grid size-8 place-items-center rounded-md text-d-text2 hover:text-d-text',
                  month_grid: 'mt-2 w-full border-collapse',
                  weekday: 'size-9 text-xs font-normal text-d-text3',
                  day: 'size-9 p-0 text-center',
                  day_button: 'size-9 rounded-md transition-colors hover:bg-d-light',
                  today: 'font-bold text-d-accent',
                  outside: 'text-d-text3 opacity-50',
                  selected: 'bg-d-accent/15',
                  range_start: 'rounded-l-md bg-d-accent/15 [&>button]:bg-d-accent [&>button]:text-black',
                  range_end: 'rounded-r-md bg-d-accent/15 [&>button]:bg-d-accent [&>button]:text-black',
                  range_middle: 'bg-d-accent/15',
                }} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {value?.from && (
        <button type="button" aria-label={t('cm.clearPeriod')} onClick={() => onChange(undefined)}
          className="grid h-full w-9 place-items-center rounded-r-full border-l border-d-border text-d-text2 hover:text-d-text">
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
