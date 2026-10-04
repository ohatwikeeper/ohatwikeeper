import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Tip from '@/components/dashboard-ui/Tip'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Pagination } from '@/components/arc/pagination/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type RankRow = { key: string; href: string; avatar?: string | null; name: string; sub?: string; values: Record<string, number> }
export type RankCol = { key: string; label: string; desc?: string; fmt?: (n: number) => string }

const PAGE_SIZE = 20
const nf = (n: number) => n.toLocaleString('ja-JP')

/** 列ヘッダーのクリックで並び替えできるランキング表。順位は現在の並び順で振り直す */
export default function RankTable({ rows, cols, defaultSort }: { rows: RankRow[]; cols: RankCol[]; defaultSort?: string }) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: defaultSort ?? cols[0].key, dir: -1 })
  const sorted = useMemo(
    () => [...rows].sort((a, b) => sort.dir * ((a.values[sort.key] ?? 0) - (b.values[sort.key] ?? 0)) || a.name.localeCompare(b.name)),
    [rows, sort],
  )
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const cur = Math.min(page, pages - 1)
  const shown = sorted.slice(cur * PAGE_SIZE, (cur + 1) * PAGE_SIZE)
  const toggle = (key: string) => { setPage(0); setSort((s) => (s.key === key ? { key, dir: (-s.dir) as 1 | -1 } : { key, dir: -1 })) }

  return (
    <div className="overflow-hidden rounded-xl border border-d-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 px-2 text-center">{t('ranking.rank')}</TableHead>
            <TableHead>{t('ranking.user')}</TableHead>
            {cols.map((c) => {
              const on = sort.key === c.key
              const Icon = !on ? ChevronsUpDown : sort.dir === -1 ? ArrowDown : ArrowUp
              return (
                <TableHead key={c.key} className="whitespace-nowrap px-2 text-right" aria-sort={on ? (sort.dir === -1 ? 'descending' : 'ascending') : 'none'}>
                  <Tip label={c.desc ?? c.label}>
                    <button type="button" onClick={() => toggle(c.key)}
                      className={`inline-flex items-center gap-1 font-semibold transition-colors hover:text-d-text ${on ? 'text-d-text' : ''}`}>
                      {c.label}<Icon className={`size-3.5 ${on ? '' : 'opacity-40'}`} />
                    </button>
                  </Tip>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((r, j) => { const i = cur * PAGE_SIZE + j; return (
            <TableRow key={r.key} className="hover:bg-d-light/60">
              <TableCell className="text-center">
                <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-d-text text-d-bg' : 'bg-d-med text-d-text2'}`}>{i + 1}</span>
              </TableCell>
              <TableCell>
                <Link to={r.href} className="flex items-center gap-3">
                  {r.avatar
                    ? <img src={r.avatar} alt="" loading="lazy" className="size-8 shrink-0 rounded-full bg-d-border object-cover" />
                    : <div className="size-8 shrink-0 rounded-full bg-d-border" />}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-d-text">{r.name}</div>
                    {r.sub && <div className="truncate text-xs text-d-text3">{r.sub}</div>}
                  </div>
                </Link>
              </TableCell>
              {cols.map((c) => (
                <TableCell key={c.key} className={`text-right tabular-nums ${sort.key === c.key ? 'font-semibold text-d-text' : 'text-d-text2'}`}>
                  {(c.fmt ?? nf)(r.values[c.key] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ) })}
        </TableBody>
      </Table>
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-d-border px-3 py-2 text-sm text-d-text2">
          <span className="tabular-nums">{cur * PAGE_SIZE + 1}–{Math.min(sorted.length, (cur + 1) * PAGE_SIZE)} / {sorted.length}</span>
          <Pagination page={cur + 1} pageCount={pages} onPageChange={(p) => setPage(p - 1)} label={t('ranking.rank')} />
        </div>
      )}
    </div>
  )
}
