import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/dashboard/api'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'
import AddRecordForm from '@/features/records/AddRecordForm'
import RecordActions from '@/features/records/RecordActions'
import { DateRangePicker } from '@/components/ui/date-range-picker'

interface Props {
  onAdd: (url: string) => Promise<boolean>
  onBulk: () => void
  onUpdate: (period: 'month' | 'all' | 'range', range?: { from: string; to: string }) => void
  onZip: () => void
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function AddRecordBar({ onAdd, onUpdate, ...actions }: Props) {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange | undefined>()
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    setCount(null)
    if (!range?.from) return
    let dead = false
    const q = `record_ids?period=range&from=${ymd(range.from)}&to=${ymd(range.to ?? range.from)}`
    apiGet<{ ids: number[] }>(q).then((r) => { if (!dead) setCount(r.ids.length) }).catch(() => {})
    return () => { dead = true }
  }, [range])
  return (
    <div className="my-6 flex flex-col gap-2">
      <AddRecordForm onAdd={onAdd} />
      <RecordActions {...actions} onUpdate={onUpdate} />
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker value={range} onChange={setRange} />
        <button
          type="button"
          id="update-range-btn"
          disabled={!range?.from}
          onClick={() => range?.from && onUpdate('range', { from: ymd(range.from), to: ymd(range.to ?? range.from) })}
          className="cursor-pointer rounded-full border border-[var(--arc-border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-d-text transition-colors hover:border-d-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('rc.updRange')}{count !== null ? ` (${count.toLocaleString()})` : ''}
        </button>
      </div>
    </div>
  )
}
