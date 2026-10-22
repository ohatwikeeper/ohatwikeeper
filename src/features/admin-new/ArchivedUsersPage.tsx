import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { toast } from '@/lib/toast'
import Shell from './Shell'
import { adminFetch, adminTry, fmtDate, useDebounced } from '../admin/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ui/alert-dialog'

interface Archived { id: number; user_id: number; x_username: string | null; display_name: string | null; email: string | null; reason: string | null; archived_at: string; counts: Record<string, number> | string | null }

export default function ArchivedUsersPage() {
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
      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-d-text3" />
          <Input className="pl-8" placeholder="ユーザー名・メール・ID で検索" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-d-border">
          <Table>
            <TableHeader className="bg-d-med/50"><TableRow>
              <TableHead>ID</TableHead><TableHead>ユーザー</TableHead><TableHead>メール</TableHead><TableHead>理由</TableHead><TableHead>削除日時</TableHead><TableHead>退避行数</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows === null ? <TableRow><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-d-text3">削除済みユーザーはいません</TableCell></TableRow>
                : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums">{r.user_id}</TableCell>
                    <TableCell>{r.display_name}<div className="text-xs text-d-text3">@{r.x_username}</div></TableCell>
                    <TableCell className="text-xs">{r.email ?? '-'}</TableCell>
                    <TableCell className="max-w-64 truncate text-xs" title={r.reason ?? ''}>{r.reason}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.archived_at)}</TableCell>
                    <TableCell className="tabular-nums">{total(r.counts).toLocaleString()}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setTarget(r)}><RotateCcw className="size-3.5" />復元</Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ConfirmDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)} title="このユーザーを復元しますか？"
        description={target ? `@${target.x_username}(ID ${target.user_id})の全データを元に戻します。` : ''} confirmLabel="復元する"
        onConfirm={async () => {
          const d = await adminTry(`archive/restore/${target!.id}`, { method: 'POST', json: {} })
          if (d) { toast.success('復元しました'); load() }
          setTarget(null)
        }} />
    </Shell>
  )
}
