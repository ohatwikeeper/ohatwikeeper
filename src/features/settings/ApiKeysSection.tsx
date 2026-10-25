import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Eye, EyeOff, Key, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Reveal, Swap, useListItem } from './motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/page-loader'
import { confirmDialog } from '@/lib/confirm'
import { csrfHeaders, friendlyError } from '@/lib/dashboard/api'
import { toast } from '@/lib/toast'

interface ApiKey { id: number; name: string; note: string | null; api_key: string; created_at: string; last_used_at: string | null }

async function call<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const r = await fetch(`/app-api/settings${path}`, {
    method, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(method === 'GET' ? {} : csrfHeaders()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || d.ok === false) throw new Error(d.error || `HTTP ${r.status}`)
  return d
}
const maskOf = (key: string) => { const p = key.match(/^[a-z]+_/)?.[0] ?? ''; return p + '•'.repeat(Math.max(key.length - p.length, 8)) }
const fmt = (s: string | null) => s?.slice(0, 16).replace('T', ' ')

function KeyRow({ k, reload }: { k: ApiKey; reload: () => Promise<void> }) {
  const { t } = useTranslation()
  const item = useListItem()
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(k.name)
  const [note, setNote] = useState(k.note ?? '')

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); await reload() } catch (e: any) { toast.error(friendlyError(e, t('ak.fail'))) }
  }
  const copy = () => navigator.clipboard.writeText(k.api_key).then(() => { setCopied(true); toast.success(t('st.keyCopied')); setTimeout(() => setCopied(false), 2000) })

  return (
    <motion.li {...item} className="flex flex-col gap-3 rounded-xl border border-d-border bg-d-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-d-text">{k.name || t('ak.unnamed')}</p>
          {k.note && <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-d-text2">{k.note}</p>}
        </div>
        <Button variant="outline" size="sm" className="-m-0.5 size-10 shrink-0 border-d-border p-0 active:scale-[0.96]" onClick={() => setEditing((v) => !v)} aria-label={t('ak.edit')} aria-expanded={editing}>
          <Pencil className="size-4" />
        </Button>
      </div>

      <Reveal show={editing}>
        <div className="flex flex-col gap-2 pb-1">
          <Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t('ak.namePh')} aria-label={t('ak.name')} />
          <Textarea value={note} maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} placeholder={t('ak.notePh')} aria-label={t('ak.note')} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => run(async () => { await call(`/api_keys/${k.id}`, 'PATCH', { name, note }); setEditing(false) }, t('ak.savedMsg'))}>{t('ak.save')}</Button>
            <Button size="sm" variant="outline" className="border-d-border" onClick={() => { setName(k.name); setNote(k.note ?? ''); setEditing(false) }}>{t('ak.cancel')}</Button>
          </div>
        </div>
      </Reveal>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Swap k={show ? k.api_key : 'mask'} className="max-w-full">
            <code className={`min-w-0 break-all font-mono text-xs ${show ? 'text-d-text' : 'text-d-text3'}`}>{show ? k.api_key : maskOf(k.api_key)}</code>
          </Swap>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="size-10 border-d-border p-0 active:scale-[0.96]" onClick={() => setShow(!show)} title={show ? t('st.hide') : t('st.show')} aria-label={show ? t('st.hide') : t('st.show')} aria-pressed={show}>
            <Swap k={show ? 'off' : 'on'}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Swap>
          </Button>
          <Button variant="outline" size="sm" className="h-10 gap-1.5 border-d-border active:scale-[0.96]" onClick={copy}>
            <Swap k={copied ? 'ok' : 'cp'}>{copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}</Swap>{t('st.copy')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs tabular-nums text-d-text3">
          {t('ak.made')} {fmt(k.created_at)} / {t('ak.lastUsed')} {fmt(k.last_used_at) ?? t('ak.never')}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 gap-1.5 border-d-border active:scale-[0.96]"
            onClick={async () => { if (await confirmDialog(t('st.regenQ'))) run(() => call(`/api_keys/${k.id}/regenerate`, 'POST'), t('st.regenDone')) }}>
            <RefreshCw className="size-4" />{t('st.regen')}
          </Button>
          <Button variant="destructive" size="sm" className="size-10 border-red-500/30 p-0 active:scale-[0.96]"
            onClick={async () => { if (await confirmDialog(t('st.delKeyQ'))) run(() => call(`/api_keys/${k.id}`, 'DELETE'), t('st.delKeyDone')) }}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </motion.li>
  )
}

export default function ApiKeysSection() {
  const { t } = useTranslation()
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [max, setMax] = useState(10)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    try { const d = await call<{ keys: ApiKey[]; max: number }>('/api_keys'); setKeys(d.keys); setMax(d.max) }
    catch (e: any) { toast.error(friendlyError(e, t('ak.fail'))) }
  }, [])
  useEffect(() => { void reload() }, [reload])

  const create = async () => {
    setBusy(true)
    try { await call('/api_keys', 'POST', { name, note }); setName(''); setNote(''); toast.success(t('ak.createdMsg')); await reload() }
    catch (e: any) { toast.error(friendlyError(e, t('ak.fail'))) }
    finally { setBusy(false) }
  }

  if (!keys) return <PageLoader />
  const full = keys.length >= max
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {keys.map((k) => <KeyRow key={k.id} k={k} reload={reload} />)}
        </AnimatePresence>
      </ul>
      <Reveal show={keys.length === 0}>
        <div className="rounded-xl border border-d-border bg-d-bg py-8 text-center">
          <Key className="mx-auto mb-2 size-8 text-d-text3" />
          <p className="text-xs text-d-text3">{t('st.noKey')}</p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-d-border p-4">
        <Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t('ak.namePh')} aria-label={t('ak.name')} disabled={full} />
        <Textarea value={note} maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} placeholder={t('ak.notePh')} aria-label={t('ak.note')} disabled={full} />
        <div className="flex items-center gap-3">
          <Button size="sm" className="h-10 active:scale-[0.96]" onClick={create} disabled={busy || full}>{t('ak.create')}</Button>
          <span className="text-xs text-d-text3 tabular-nums">{keys.length}/{max}{full ? ` ${t('ak.limit', { n: max })}` : ''}</span>
        </div>
      </div>
    </div>
  )
}
