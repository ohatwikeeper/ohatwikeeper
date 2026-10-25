import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, Search, UserX } from 'lucide-react'
import { toast } from '@/lib/toast'
import Shell from './Shell'
import { Empty, PageHead, rise } from './ui'
import { adminFetch, adminTry, fmtDate, useDebounced } from '../admin/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { JsonViewer } from '@/components/arc/json-viewer/json-viewer'
import { ConfirmDialog } from '@/components/ui/alert-dialog'

interface Archived { id: number; user_id: number; x_username: string | null; display_name: string | null; email: string | null; reason: string | null; archived_at: string; counts: Record<string, number> | string | null }

interface TableData { table: string; total: number; rows: Record<string, unknown>[] }

function DetailSheet({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [d, setD] = useState<{ archive: Archived; tables: TableData[] } | null>(null)
  useEffect(() => {
    setD(null)
    if (id) adminFetch<{ archive: Archived; tables: TableData[] }>(`archive/${id}/detail`).then(setD).catch((e) => toast.error((e as Error).message))
  }, [id])
  const user = d?.tables.find((t) => t.table === 'users')?.rows[0]
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{d ? String(user?.display_name ?? d.archive.display_name ?? d.archive.x_username ?? '詳細') : '読み込み中'}</SheetTitle>
          <SheetDescription>{d ? `@${d.archive.x_username} ・ ID ${d.archive.user_id} ・ ${fmtDate(d.archive.archived_at)} に削除` : ''}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {!d ? <Skeleton className="h-24 w-full" /> : (<>
            <div className="rounded-xl bg-d-light/40 p-3 text-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/.05)]"><p className="mb-1 text-xs text-d-text3">削除理由</p>{d.archive.reason || '-'}</div>
            {d.tables.map((t) => (
              <details key={t.table} open={t.table === 'users'} className="rounded-xl bg-d-light/40 shadow-[inset_0_0_0_1px_rgb(255_255_255/.05)]">
                <summary className="flex min-h-10 cursor-pointer items-center justify-between px-3 text-sm">
                  <code>{t.table}</code><span className="text-xs tabular-nums text-d-text3">{t.total.toLocaleString()}件{t.total > t.rows.length ? `(先頭${t.rows.length}件を表示)` : ''}</span>
                </summary>
                <div className="border-t border-white/[.06] p-3"><JsonViewer data={t.table === 'users' ? t.rows[0] : t.rows} defaultExpandDepth={1} /></div>
              </details>
            ))}
          </>)}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ArchivedUsersPage() {
  const [detail, setDetail] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const [rows, setRows] = useState<Archived[] | null>(null)
  const [target, setTarget] = useState<Archived | null>(null)
  const load = useCallback(() => {
    adminFetch<{ rows: Archived[] }>(`archive/list?q=${encodeURIComponent(dq)}`).then((d) => setRows(d.rows)).catch((e) => { toast.error((e as Error).message); setRows([]) })
  }, [dq])
  useEffect(load, [load])
  const total = (c: Archived['counts']) => {
    const o = typeof c === 'string' ? JSON.parse(c) : c
    return Object.values(o ?? {}).reduce((a: number, b) => a + Number(b), 0)
  }
  return (
    <Shell title="削除済みユーザー">
      <PageHead title="削除済みユーザー" desc={rows ? <span className="tabular-nums">{rows.length.toLocaleString()} 件。行を開くと退避したデータを確認でき、復元もできます。</span> : '読み込み中'} />
      <div className="flex flex-col gap-4">
        <div style={rise(0)} className="an-rise relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-d-text3" />
          <Input className="h-9 rounded-lg bg-d-light/50 pl-8" placeholder="ユーザー名・メール・ID で検索" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={rise(1)} className="an-rise overflow-x-auto rounded-2xl bg-d-card shadow-[0_0_0_1px_rgb(255_255_255/.06),0_8px_24px_-12px_rgb(0_0_0/.5)]">
          <Table>
            <TableHeader className="bg-d-med/70"><TableRow>
              <TableHead>ID</TableHead><TableHead>ユーザー</TableHead><TableHead>メール</TableHead><TableHead>理由</TableHead><TableHead>削除日時</TableHead><TableHead>退避行数</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows === null ? <TableRow><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                : rows.length === 0 ? <TableRow><TableCell colSpan={7}><Empty icon={UserX}>削除済みユーザーはいません</Empty></TableCell></TableRow>
                : rows.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-d-light/50" onClick={() => setDetail(r.id)}>
                    <TableCell className="tabular-nums">{r.user_id}</TableCell>
                    <TableCell><span className="text-d-text">{r.display_name}</span><div className="text-xs text-d-text3">@{r.x_username}</div></TableCell>
                    <TableCell className="text-xs">{r.email ?? '-'}</TableCell>
                    <TableCell className="max-w-64 truncate text-xs" title={r.reason ?? ''}>{r.reason}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.archived_at)}</TableCell>
                    <TableCell className="tabular-nums">{total(r.counts).toLocaleString()}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setTarget(r) }}><RotateCcw className="size-3.5" />復元</Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <DetailSheet id={detail} onClose={() => setDetail(null)} />
      <ConfirmDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)} title="このユーザーを復元しますか？"
        description={target ? `@${target.x_username}(ID ${target.user_id})の全データを元に戻します。` : ''} confirmLabel="復元する"
        onConfirm={async () => {
          const d = await adminTry<{ mailed: boolean }>(`archive/restore/${target!.id}`, { method: 'POST', json: {} })
          if (d) { toast.success(d.mailed ? '復元しました(通知メール送信済み)' : '復元しました(通知メールなし)'); load() }
          setTarget(null)
        }} />
    </Shell>
  )
}
