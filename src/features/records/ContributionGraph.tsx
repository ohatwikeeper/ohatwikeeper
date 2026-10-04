import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RecordItem } from '@/lib/dashboard/types'
import { ActivityHeatmap } from '@/components/arc/activity-heatmap/activity-heatmap'
import WheelPicker from '@/components/dashboard-ui/WheelPicker'
import Tip from '@/components/dashboard-ui/Tip'

const pad = (n: number) => String(n).padStart(2, '0')
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** GitHub 風のContributions(shadcn-heatmap / heatmap.chingru.com)。
 *  1年分を1行で表示し、過去の年は前後ボタンで切り替える。 */
export default function ContributionGraph({ records }: { records: RecordItem[] }) {
  const { t } = useTranslation()
  const thisYear = new Date().getFullYear()

  // 日別投稿数と、投稿がある最古の年
  const { daily, minYear } = useMemo(() => {
    const daily = new Map<string, number>()
    let minYear = thisYear
    for (const r of records) {
      const k = r.date.substring(0, 10)
      if (!k) continue
      daily.set(k, (daily.get(k) ?? 0) + 1)
      const y = Number(k.slice(0, 4))
      if (y && y < minYear) minYear = y
    }
    return { daily, minYear }
  }, [records, thisYear])

  const [year, setYear] = useState(thisYear)
  const [yearOpen, setYearOpen] = useState(false)
  const yearOptions = useMemo(() => Array.from({ length: thisYear - minYear + 1 }, (_, i) => ({ value: thisYear - i, label: thisYear - i })), [thisYear, minYear])
  const pillRef = useRef<HTMLDivElement>(null)

  // 選択年の 1/1〜(今年は今日まで/過去年は12/31) を全日埋める
  const data = useMemo<{ date: string; value: number }[]>(() => {
    const out: { date: string; value: number }[] = []
    const end = year === thisYear ? new Date() : new Date(year, 11, 31)
    end.setHours(0, 0, 0, 0)
    for (let d = new Date(year, 0, 1); d <= end; d.setDate(d.getDate() + 1)) {
      const k = key(d)
      out.push({ date: k, value: daily.get(k) ?? 0 })
    }
    return out
  }, [daily, year, thisYear])

  const days = useMemo(() => data.map((d) => ({ date: d.date, count: d.value })), [data])


  // スクローラーは rtl(右端=最新)だと幅に余裕がある時に右寄せになるため、ltr にして左寄せ+最新側へスクロールする
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>('[class*="scroller"]')
    if (!el) return
    el.style.direction = 'ltr'
    el.scrollLeft = el.scrollWidth
  }, [year, days.length])
  if (daily.size === 0) return null

  return (
    <div ref={wrap} id="contribution-graph" className="mb-12 [--heatmap-surface:transparent] overflow-x-clip">
      <ActivityHeatmap
        days={days}
        label="Contributions"
        period={String(year)}
        unit={{ one: 'post', other: 'posts' }}
        weekStartsOn={0}
        actions={
          <>
            <div ref={pillRef} className={`flex items-center gap-1 rounded-full border border-d-border p-0.5 ${yearOpen ? "opacity-0" : ""}`}>
              <Tip label={t('rc.prevYear')}>
                <button
                  aria-label={t('rc.prevYear')}
                  disabled={year <= minYear}
                  onClick={() => setYear((y) => y - 1)}
                  className="flex size-7 items-center justify-center rounded-full text-d-text2 hover:text-d-text disabled:cursor-not-allowed disabled:opacity-40 disabled:"
                >
                  <i className="bx bx-chevron-left text-xl leading-none" />
                </button>
              </Tip>
              <button type="button" aria-label={t('rc.pickYear')} onClick={() => setYearOpen(true)} className="min-w-[56px] cursor-pointer rounded-full text-center text-[0.9rem] font-semibold tabular-nums text-d-text outline-none">{year}</button>
              <Tip label={t('rc.nextYear')}>
                <button
                  aria-label={t('rc.nextYear')}
                  disabled={year >= thisYear}
                  onClick={() => setYear((y) => y + 1)}
                  className="flex size-7 items-center justify-center rounded-full text-d-text2 hover:text-d-text disabled:cursor-not-allowed disabled:opacity-40 disabled:"
                >
                  <i className="bx bx-chevron-right text-xl leading-none" />
                </button>
              </Tip>
            </div>
            <WheelPicker options={yearOptions} value={year} onChange={setYear} anchorRef={pillRef} isOpen={yearOpen} onClose={() => setYearOpen(false)} />
          </>
        }
      />
    </div>
  )
}
