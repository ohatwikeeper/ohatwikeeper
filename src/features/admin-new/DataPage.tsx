import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Check, Columns3, Copy, Download, GripVertical, Inbox, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import Shell from './Shell'
import { adminFetch, adminTry, fmtDate, useDebounced } from '../admin/kit'
import { Cell, COL_LABEL, FILTER_LABEL, STATUS_LABEL, StatusBadge } from '../admin/data/cells'
import { Pagination } from '@/components/arc/pagination/pagination'
import { JsonViewer } from '@/components/arc/json-viewer/json-viewer'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSelect } from '@/components/ui/simple-select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { loadSession } from '@/lib/session'
import { IdentityOtp } from '../admin/IdentityOtp'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ALL_ITEMS } from './nav'
import { Dot, Empty, PageHead, Pill, rise } from './ui'

type Row = Record<string, unknown> & { __list: Record<string, unknown> }
interface Filter { key: string; label: string; options: { value: string; label: string }[] }
interface Res {
  title: string; columns: string[]; allColumns?: string[]; defaultColumns?: string[]; rows: Row[]; total: number; approx: boolean; page: number; per: number
  texts?: { key: string; label: string }[]; filters: Filter[]; dated: boolean; editable: { fields: EF[]; create: boolean } | null
}
const LIVE = ['access', 'api-logs', 'api-errors', 'mails']
const lbl = (c: string) => COL_LABEL[c] ?? c
const looksJson = (s: string) => /^\s*[[{][\s\S]*[\]}]\s*$/.test(s)
const asJson = (v: unknown): unknown => {
  if (v && typeof v === 'object') return v
  if (typeof v === 'string' && looksJson(v)) { try { return JSON.parse(v) } catch { /* 文字列のまま */ } }
  return undefined
}
const REL: Record<string, (v: string) => { to: string; label: string } | null> = {
  request_id: (v) => ({ to: `/admin-new/data/api-logs?q=${encodeURIComponent(v)}`, label: 'APIログで開く' }),
  user_id: (v) => ({ to: `/admin-new/data/users?q=${encodeURIComponent(v)}`, label: 'ユーザーを開く' }),
  logged_in_user_id: (v) => ({ to: `/admin-new/data/users?q=${encodeURIComponent(v)}`, label: 'ユーザーを開く' }),
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <Button variant="ghost" size="icon-xs" aria-label="コピー" onClick={() => { navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1200) }) }}>
      {ok ? <Check /> : <Copy />}
    </Button>
  )
}

interface EF { k: string; label: string; t?: 'area' | 'num' | 'date' | 'bool' | 'select'; req?: boolean; opts?: string[] }
const FB_STATUS = ['new', 'improved', 'resolved', 'wont_fix']
const toLocal = (v: unknown) => (v ? String(v).replace(' ', 'T').slice(0, 16) : '')

function Detail({ row, idx, total, view, res, onNav, onClose, onChanged, onEdit, onDelete }: {
  row: Row | null; idx: number | null; total: number; view: string; res: Res | null
  onNav: (d: number) => void; onClose: () => void; onChanged: () => void; onEdit: (r: Row) => void; onDelete: (r: Row) => void
}) {
  const [sum, setSum] = useState<Record<string, number> | null>(null)
  const [note, setNote] = useState('')
  const [arc, setArc] = useState(false)
  const [arcReason, setArcReason] = useState('')
  const [arcConfirm, setArcConfirm] = useState('')
  const entries = row ? Object.entries(row).filter(([k]) => k !== '__list') : []
  useEffect(() => { setNote(String(row?.admin_note ?? '')) }, [row])
  useEffect(() => {
    setSum(null)
    if ((view === 'users' || view === 'emails') && row?.id) adminFetch<Record<string, number>>(`data/users/${row.id}/summary`).then(setSum).catch(() => {})
  }, [row, view])
  const post = async (path: string, json?: unknown) => { const d = await adminTry(`data/${path}`, { method: 'POST', json: json ?? {} }); if (d) { toast.success('更新しました'); onChanged() } return !!d }
  return (
    <>
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl" onKeyDown={(e) => {
        if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
        if (e.key === 'ArrowLeft') onNav(-1)
        if (e.key === 'ArrowRight') onNav(1)
      }}>
        <SheetHeader>
          <SheetTitle>{String(row?.title ?? row?.display_name ?? row?.x_username ?? row?.slug ?? row?.setting_key ?? row?.subject ?? row?.full_path ?? row?.request_uri ?? '詳細')}</SheetTitle>
          <SheetDescription>{res?.title} ・ ID {String(row?.id ?? '-')} ・ {idx !== null ? idx + 1 : 0}/{total}(←→で移動)</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {row && sum && (
            <div className="grid grid-cols-2 gap-2 text-center text-xs text-d-text3 sm:grid-cols-4">
              {([['records', 'おはツイ'], ['short_links', '短縮URL'], ['feedbacks', 'FB'], ['access_30d', '30日アクセス']] as const).map(([k, l]) => (
                <div key={k} className="rounded-xl bg-d-light/40 p-2.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/.05)]"><p className="text-xl font-medium tabular-nums text-d-text">{sum[k]?.toLocaleString()}</p>{l}</div>
              ))}
            </div>
          )}
          {row && view === 'users' && <IdentityOtp userId={Number(row.id)} />}
          {row && view === 'users' && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                const { csrf_token } = await loadSession()
                const r = await fetch('/app-api/admin/impersonate', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: row.id, csrf: csrf_token }) })
                const d = await r.json().catch(() => ({}))
                if (!r.ok) return void toast.error(d.error || 'なりすましに失敗しました')
                window.location.href = '/dashboard'
              }}>このユーザーとしてログイン</Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/admin-new/data/api-logs?q=${encodeURIComponent(String(row.x_username ?? row.id))}`} />}>APIログ</Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/admin-new/data/user-actions?q=${encodeURIComponent(String(row.id))}`} />}>操作ログ</Button>
              <Button size="sm" variant="destructive" onClick={() => { setArcReason(''); setArcConfirm(''); setArc(true) }}><Trash2 className="size-3.5" />アカウント削除</Button>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/admin-new/data/api-errors?q=${encodeURIComponent(String(row.id))}`} />}>エラー</Button>
            </div>
          )}
          {entries.map(([k, v]) => {
            const j = asJson(v)
            const text = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
            const rel = text && REL[k]?.(text)
            return (
              <div key={k} className="rounded-xl bg-d-light/40 p-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/.05)]">
                <div className="mb-1 flex items-center gap-1 text-xs text-d-text3">
                  <span>{lbl(k)}</span><code className="text-[10px] opacity-60">{k}</code>
                  <span className="ml-auto flex items-center">{rel && <Link to={rel.to} className="mr-1 text-xs !text-d-accent">{rel.label}</Link>}{text && <CopyBtn text={text} />}</span>
                </div>
                {k === 'x_icon' && v ? <img src={String(v)} alt="" className="size-12 rounded-full" />
                  : k === 'status' && v ? <StatusBadge value={String(v)} />
                  : j !== undefined ? <JsonViewer data={j} defaultExpandDepth={1} />
                  : text === '' ? <span className="text-d-text3">-</span>
                  : <div className="text-sm break-all whitespace-pre-wrap text-d-text">{/_at$|^timestamp$|^date$/.test(k) ? `${fmtDate(text)} (${text})` : text}</div>}
              </div>
            )
          })}
          {row && view === 'feedbacks' && (
            <div className="flex flex-col gap-3 border-t border-d-border pt-4">
              <Label>ステータス</Label>
              <div className="flex flex-wrap gap-2">
                {FB_STATUS.map((s) => <Button key={s} size="sm" variant={row.status === s ? 'default' : 'outline'} onClick={() => post(`feedbacks/${row.id}`, { status: s })}>{STATUS_LABEL[s] ?? s}</Button>)}
              </div>
              <Label htmlFor="admin-note">管理メモ</Label>
              <Textarea id="admin-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="対応内容などを記録" />
              <Button size="sm" className="self-start" onClick={() => post(`feedbacks/${row.id}`, { admin_note: note })}>メモを保存</Button>
            </div>
          )}
          {row && view === 'notifications' && (
            <Label className="cursor-pointer gap-3 border-t border-d-border pt-4"><Switch checked={!!row.is_active} onCheckedChange={() => post(`notifications/${row.id}/toggle`).then(onClose)} />{row.is_active ? '公開中(切り替えで非公開)' : '非公開(切り替えで公開)'}</Label>
          )}
          {row && res?.editable && (
            <div className="flex flex-wrap gap-2 border-t border-d-border pt-4">
              <Button size="sm" onClick={() => onEdit(row)}>編集</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(row)}><Trash2 className="size-3.5" />削除</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
      <Dialog open={arc} onOpenChange={setArc}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-base">アカウントを削除</DialogTitle>
            <DialogDescription>データは「削除済みユーザー」へ移動し、あとから復元できます。本人には削除のメールが届きます。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arc-reason" className="text-xs text-d-text2">理由(お問い合わせ内容など)</Label>
              <Textarea id="arc-reason" rows={3} placeholder="例: ユーザーからの削除依頼(Discord チケット #123)" value={arcReason} onChange={(e) => setArcReason(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arc-confirm" className="text-xs text-d-text2">確認のため <code className="rounded bg-d-med px-1 py-0.5 text-d-text">{String(row?.x_username ?? row?.id)}</code> と入力</Label>
              <Input id="arc-confirm" autoComplete="off" value={arcConfirm} onChange={(e) => setArcConfirm(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="m-0 border-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => setArc(false)}>キャンセル</Button>
            <Button variant="destructive" disabled={!arcReason.trim() || arcConfirm !== String(row?.x_username ?? row?.id)} onClick={async () => {
              const d = await adminTry<{ mailed: boolean }>(`archive/users/${row!.id}/archive`, { method: 'POST', json: { reason: arcReason, confirm: arcConfirm } })
              if (d) { toast.success(d.mailed ? '削除しました(通知メール送信済み)' : '削除しました(通知メールなし)'); setArc(false); onClose(); onChanged() }
            }}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** /admin-new/data/:view — 一覧・絞り込み・詳細の汎用ビュー(状態は URL に保持) */
export default function DataPage() {
  const { view = '' } = useParams()
  const [sp, setSp] = useSearchParams()
  const [res, setRes] = useState<Res | null>(null)
  const [loading, setLoading] = useState(true)
  const [qInput, setQInput] = useState(sp.get('q') ?? '')
  const q = useDebounced(qInput)
  const [selIdx, setSelIdx] = useState<number | null>(null)
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [formInit, setFormInit] = useState('')
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState<Row | null>(null)
  const [live, setLive] = useState(false)
  const reqSeq = useRef(0)
  const colKey = `admin-new:cols:${view}`
  const [myCols, setMyCols] = useState<string[]>([])
  const [dragCol, setDragCol] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  useEffect(() => { try { setMyCols(JSON.parse(localStorage.getItem(colKey) ?? '[]')) } catch { setMyCols([]) }; setQInput(sp.get('q') ?? ''); setSelIdx(null) }, [view]) // eslint-disable-line react-hooks/exhaustive-deps
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const asc = sp.get('dir') === 'asc'
  const sortCol = sp.get('sort') ?? ''
  // 列ヘッダのクリック: 降順 → 昇順 → 解除
  const sortBy = (c: string) => patch(sortCol !== c ? { sort: c, dir: null } : !asc ? { sort: c, dir: 'asc' } : { sort: null, dir: null })
  const qs = useMemo(() => { const n = new URLSearchParams(sp); n.delete('page'); return n.toString() }, [sp])
  const patch = useCallback((o: Record<string, string | null>) => {
    setSp((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(o)) v ? n.set(k, v) : n.delete(k); if (!('page' in o)) n.delete('page'); return n }, { replace: true })
  }, [setSp])
  useEffect(() => { if ((sp.get('q') ?? '') !== q) patch({ q: q || null }) }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (silent = false) => {
    const my = ++reqSeq.current
    if (!silent) setLoading(true)
    try {
      const r = await adminFetch<Res>(`data/${view}?${qs}&page=${page}${myCols.length ? `&cols=${encodeURIComponent(myCols.join(','))}` : ''}`)
      if (my === reqSeq.current) setRes(r)
    } catch (e) { if (my === reqSeq.current) toast.error((e as Error).message) }
    finally { if (my === reqSeq.current) setLoading(false) }
  }, [view, qs, page, myCols])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!live || !LIVE.includes(view)) return
    const h = setInterval(() => load(true), 5000)
    return () => clearInterval(h)
  }, [live, view, load])

  const sel = selIdx !== null ? res?.rows[selIdx] ?? null : null
  const openForm = (r?: Row) => {
    const f0 = Object.fromEntries([['id', r ? String(r.id) : ''], ...(res?.editable?.fields ?? []).map((f) => [f.k, r ? (f.t === 'date' ? toLocal(r[f.k]) : f.t === 'bool' ? (r[f.k] ? '1' : '') : String(r[f.k] ?? '')) : f.t === 'select' ? f.opts![0] : f.t === 'bool' ? '1' : ''])])
    setForm(f0); setFormInit(JSON.stringify(f0))
  }
  const saveForm = async () => {
    if (!form) return
    setSaving(true)
    const ok = await adminTry(`data/edit/${view}`, { method: 'POST', json: form })
    setSaving(false)
    if (ok) { toast.success('保存しました'); setForm(null); void load(true) }
  }
  const doDelete = async () => {
    if (delTarget && await adminTry(`data/edit/${view}/${delTarget.id}`, { method: 'DELETE' })) { toast.success('削除しました'); setSelIdx(null); void load(true) }
  }
  const saveCols = (c: string[]) => { setMyCols(c); localStorage.setItem(colKey, JSON.stringify(c)) }
  const cur = res?.columns ?? []
  const hidden = (res?.allColumns ?? []).filter((c) => !cur.includes(c))
  const drop = (to: string) => {
    if (!dragCol || dragCol === to) return
    const n = cur.filter((c) => c !== dragCol); n.splice(n.indexOf(to) + (cur.indexOf(dragCol) < cur.indexOf(to) ? 1 : 0), 0, dragCol); saveCols(n)
  }
  const toggleFilter = (key: string, value: string) => {
    const set = new Set((sp.get(key) ?? '').split(',').filter(Boolean)); set.has(value) ? set.delete(value) : set.add(value)
    patch({ [key]: [...set].join(',') || null })
  }
  const pages = res ? Math.max(1, Math.ceil(res.total / res.per)) : 1
  const dr = sp.get('from') ? { from: new Date(sp.get('from') + 'T00:00:00'), to: sp.get('to') ? new Date(sp.get('to') + 'T00:00:00') : undefined } : undefined
  const active = [...sp.keys()].filter((k) => /^(f_|s_|t_)/.test(k) || k === 'from' || k === 'to' || k === 'q').length
  const title = ALL_ITEMS.find((i) => i.to === `/admin-new/data/${view}`)?.label ?? res?.title ?? view

  return (
    <Shell title={title} actions={LIVE.includes(view) ? <label className="hidden min-h-9 items-center gap-2 text-xs text-d-text2 sm:flex"><Switch checked={live} onCheckedChange={setLive} />{live && <Dot tone="success" pulse />}ライブ</label> : null}>
      <PageHead title={title} desc={res ? <span className="tabular-nums">{res.approx ? '約 ' : ''}{res.total.toLocaleString()} 件{res.title && res.title !== title ? ` ・ ${res.title}` : ''}</span> : '読み込み中'} />
      <div className="flex flex-col gap-3">
        <div style={rise(0)} className="an-rise flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-d-text3" />
            <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="検索(ID・ユーザー名・リクエストID等)" className="h-9 rounded-lg bg-d-light/50 pl-8" />
          </div>
          {res?.dated && <DateRangePicker value={dr} onChange={(v) => patch({ from: v?.from ? format(v.from, 'yyyy-MM-dd') : null, to: v?.to ? format(v.to, 'yyyy-MM-dd') : null })} />}
          <Button variant="outline" size="sm" className="h-9 !text-d-text" onClick={() => patch({ dir: asc ? null : 'asc' })}>{asc ? <ArrowUpWideNarrow className="size-3.5" /> : <ArrowDownWideNarrow className="size-3.5" />}{sortCol ? (asc ? '昇順' : '降順') : asc ? '古い順' : '新しい順'}</Button>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="h-9 !text-d-text" />}><Columns3 className="size-3.5" />カラム</PopoverTrigger>
            <PopoverContent align="end" className="max-h-[70vh] w-72 overflow-y-auto p-2">
              <p className="px-1 pb-1 text-xs text-d-text3">ドラッグで並び替え</p>
              {cur.map((c) => (
                <div key={c} draggable onDragStart={() => setDragCol(c)} onDragOver={(e) => { e.preventDefault(); setOverCol(c) }} onDrop={() => { drop(c); setDragCol(null); setOverCol(null) }} onDragEnd={() => { setDragCol(null); setOverCol(null) }}
                  className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-sm ${overCol === c && dragCol !== c ? 'bg-d-accent/15' : 'hover:bg-d-med/60'}`}>
                  <GripVertical className="size-3.5 cursor-grab text-d-text3" /><span className="flex-1 truncate">{lbl(c)}</span>
                  <button type="button" aria-label="非表示" className="text-d-text3 hover:text-d-text" onClick={() => saveCols(cur.filter((x) => x !== c))}><X className="size-3.5" /></button>
                </div>
              ))}
              {hidden.length > 0 && <p className="px-1 pt-2 pb-1 text-xs text-d-text3">非表示(クリックで追加)</p>}
              {hidden.map((c) => <button key={c} type="button" className="block w-full rounded-md px-1.5 py-1 text-left text-sm text-d-text2 hover:bg-d-med/60" onClick={() => saveCols([...cur, c])}>{lbl(c)}</button>)}
              {myCols.length > 0 && <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => { setMyCols([]); localStorage.removeItem(colKey) }}>初期設定に戻す</Button>}
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon-sm" className="size-9" aria-label="再読み込み" onClick={() => load()}><RefreshCw className={loading ? 'animate-spin' : ''} /></Button>
          <Button variant="outline" size="sm" className="h-9 !text-d-text" nativeButton={false} render={<a href={`/app-api/admin/data/${view}?csv=1&${qs}`} />}><Download className="size-3.5" />CSV</Button>
          {res?.editable?.create && <Button size="sm" className="h-9" onClick={() => openForm()}><Plus className="size-3.5" />新規作成</Button>}
        </div>

        {(res?.filters.length || res?.texts?.length) ? (
          <div style={rise(1)} className="an-rise flex flex-col gap-2">
            {res.filters.filter((f) => f.options.length <= 6).map((f) => {
              const on = new Set((sp.get(f.key) ?? '').split(',').filter(Boolean))
              return (
                <div key={f.key} className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-d-text3">{FILTER_LABEL[f.key] ?? f.label}</span>
                  {f.options.map((o) => <Pill key={o.value} on={on.has(o.value)} onClick={() => toggleFilter(f.key, o.value)}>{o.label}</Pill>)}
                </div>
              )
            })}
            {res.texts && res.texts.length > 0 && <div className="flex flex-wrap gap-2">{res.texts.map((t) => <Input key={t.key} defaultValue={sp.get(t.key) ?? ''} placeholder={t.label} className="h-8 w-40 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') patch({ [t.key]: (e.target as HTMLInputElement).value.trim() || null }) }} />)}</div>}
          </div>
        ) : null}

        {active > 0 && (
          <div className="flex items-center gap-2 text-xs text-d-text2">
            <Badge variant="secondary">絞り込み {active}</Badge>
            <button type="button" className="min-h-8 underline underline-offset-2 hover:text-d-text" onClick={() => { setQInput(''); setSp({}, { replace: true }) }}>すべて解除</button>
          </div>
        )}

        <div style={rise(2)} className="an-rise overflow-x-auto rounded-2xl bg-d-card shadow-[0_0_0_1px_rgb(255_255_255/.06),0_8px_24px_-12px_rgb(0_0_0/.5)]">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-d-med/70 text-left text-xs text-d-text2 shadow-[0_1px_0_rgb(255_255_255/.06)]"><tr>{cur.map((c) => <th key={c} className="p-0 font-medium whitespace-nowrap" aria-sort={sortCol === c ? (asc ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortBy(c)} className={`flex min-h-10 w-full items-center gap-1 px-3 text-left transition-colors hover:bg-d-light/60 hover:text-d-text ${sortCol === c ? 'text-d-text' : ''}`}>{lbl(c)}{sortCol === c && (asc ? <ArrowUpWideNarrow className="size-3" /> : <ArrowDownWideNarrow className="size-3" />)}</button></th>)}</tr></thead>
            <tbody className="divide-y divide-white/[.05]">
              {loading && !res ? Array.from({ length: 8 }, (_, i) => <tr key={i}><td colSpan={Math.max(1, cur.length)} className="p-2"><Skeleton className="h-8" /></td></tr>)
                : res?.rows.map((r, i) => (
                  <tr key={i} onClick={() => setSelIdx(i)} className={`cursor-pointer transition-colors hover:bg-d-light/50 ${selIdx === i ? 'bg-d-accent/10' : ''}`}>
                    {cur.map((c) => <td key={c} className="max-w-[320px] truncate px-3 py-2.5"><Cell col={c} value={r.__list[c]} /></td>)}
                  </tr>
                ))}
            </tbody>
          </table>
          {res && res.rows.length === 0 && <Empty icon={Inbox}>該当するデータがありません</Empty>}
        </div>
        {pages > 1 && <div className="flex justify-center pt-1"><Pagination page={page} pageCount={pages} onPageChange={(p) => patch({ page: p > 1 ? String(p) : null })} label="ページ" /></div>}
      </div>
      <Detail row={sel} idx={selIdx} total={res?.rows.length ?? 0} view={view} res={res}
        onNav={(d) => setSelIdx((i) => (i === null || !res ? i : Math.min(res.rows.length - 1, Math.max(0, i + d))))}
        onClose={() => setSelIdx(null)} onChanged={() => void load(true)} onEdit={(r) => { openForm(r); setSelIdx(null) }} onDelete={setDelTarget} />
      <Sheet open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>{form?.id ? '編集' : '新規作成'}</SheetTitle><SheetDescription>{res?.title} ・ * は必須</SheetDescription></SheetHeader>
          {form && (
            <form className="flex flex-col gap-4 px-4 pb-6" onSubmit={(e) => { e.preventDefault(); void saveForm() }}>
              {(res?.editable?.fields ?? []).map((f) => (
                <div key={f.k} className="flex flex-col gap-1.5">
                  {f.t === 'bool' ? (
                    <Label className="cursor-pointer gap-3"><Switch checked={!!form[f.k]} onCheckedChange={(c) => setForm({ ...form, [f.k]: c ? '1' : '' })} />{f.label}</Label>
                  ) : (<>
                    <Label htmlFor={`f-${f.k}`}>{f.label}{f.req && <span className="text-d-danger"> *</span>}</Label>
                    {f.t === 'area' ? <Textarea id={`f-${f.k}`} rows={6} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
                      : f.t === 'select' ? <SimpleSelect id={`f-${f.k}`} value={form[f.k]} onChange={(v) => setForm({ ...form, [f.k]: v })} options={f.opts!.map((o) => ({ value: o, label: STATUS_LABEL[o] ?? o }))} className="w-full" />
                      : <Input id={`f-${f.k}`} type={f.t === 'date' ? 'datetime-local' : f.t === 'num' ? 'number' : 'text'} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />}
                  </>)}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving || JSON.stringify(form) === formInit}>{saving ? '保存中…' : '保存'}</Button>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>キャンセル</Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)} title="削除しますか？"
        description={`「${String(delTarget?.title ?? delTarget?.slug ?? delTarget?.id ?? '')}」を削除します。この操作は元に戻せません。`} onConfirm={doDelete} />
    </Shell>
  )
}
