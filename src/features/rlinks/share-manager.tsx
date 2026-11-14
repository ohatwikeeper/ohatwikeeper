import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/simple-select'
import { CopyChip } from '@/components/ui/copy-chip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { confirmDialog } from '@/lib/confirm'
import { csrfHeaders, friendlyError } from '@/lib/dashboard/api'
import { toast } from '@/lib/toast'
import FieldPicker from './field-picker'
import { loadCatalog } from './catalog'

interface Share { id: number; name: string; path: string; fields: string[]; expires_at: string | null; view_count: number; expired: boolean; created_at: string }

const call = async (url: string, init?: RequestInit) => {
  const r = await fetch(url, { credentials: 'include', ...init })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.success === false) throw new Error(j.error || String(r.status))
  return j
}

// 持ち主が解析の共有URLを発行・削除する。見せる項目は URL ごとに選ぶ
export default function ShareManager({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const [shares, setShares] = useState<Share[] | null>(null)
  const [fieldIds, setFieldIds] = useState<string[]>([])
  const [editing, setEditing] = useState<Share | 'new' | null>(null)
  const base = `/app-api/r-links/${encodeURIComponent(slug)}/shares`
  const reload = () => call(base).then((j) => setShares(j.shares)).catch((e) => toast.error(friendlyError(e)))
  useEffect(() => { reload(); loadCatalog().then((c) => setFieldIds(c.share_fields)).catch(() => {}) }, [slug])

  const remove = async (s: Share) => {
    if (!await confirmDialog(t('rs.delAsk'))) return
    try { await call(`${base}/${s.id}`, { method: 'DELETE', headers: csrfHeaders() }); reload() } catch (e) { toast.error(friendlyError(e)) }
  }
  const fmt = (d: string) => new Date(d.replace(' ', 'T') + '+09:00').toLocaleDateString()

  return (
    <section className="mt-8 rounded-xl border border-d-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">{t('rs.shareTitle')}</h2>
          <p className="mt-1 text-sm text-pretty text-d-text3">{t('rs.shareDesc')}</p>
        </div>
        <Button size="sm" onClick={() => setEditing('new')} disabled={!fieldIds.length}><Plus data-icon="inline-start" />{t('rs.newShare')}</Button>
      </div>
      {shares && shares.length === 0 && <p className="mt-4 text-sm text-d-text3">{t('rs.empty')}</p>}
      {shares && shares.length > 0 && (
        <ul className="mt-4 divide-y divide-d-border/60 border-t border-d-border/60">
          {shares.map((s) => {
            const url = location.origin + s.path
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{s.name || `#${s.id}`}</span>
                    {s.expired && <span className="inline-flex h-5 items-center rounded-full bg-red-500/15 px-2 text-[11px] leading-4 text-red-400">{t('rs.expired')}</span>}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-d-text3">{url}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-d-text3">
                    {t('rs.on', { n: s.fields.length })} · {t('rs.views', { n: s.view_count })} · {s.expires_at ? t('rs.until', { d: fmt(s.expires_at) }) : `${t('rs.expires')}: ${t('rs.never')}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyChip text={url} label={t('rs.copy')} doneLabel={t('rs.copied')} />
                  <Button variant="outline" size="icon-sm" title={t('rs.editFields')} aria-label={t('rs.editFields')} onClick={() => setEditing(s)}><SlidersHorizontal /></Button>
                  <Button variant="outline" size="icon-sm" title={t('rs.delete')} aria-label={t('rs.delete')} onClick={() => remove(s)}><Trash2 /></Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ShareDialog key={editing === 'new' ? 'new' : editing?.id ?? 'none'} open={!!editing} share={editing === 'new' ? null : editing} fieldIds={fieldIds} base={base}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </section>
  )
}

function ShareDialog({ open, share, fieldIds, base, onClose, onSaved }: { open: boolean; share: Share | null; fieldIds: string[]; base: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState(share?.name ?? '')
  const [days, setDays] = useState('')
  const [fields, setFields] = useState<string[]>(share?.fields ?? fieldIds.filter((f) => !['destination', 'isp', 'recent'].includes(f)))
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!fields.length) { toast.error(t('rs.pickOne')); return }
    setBusy(true)
    try {
      if (share) await call(`${base}/${share.id}`, { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify({ name, fields }) })
      else await call(base, { method: 'POST', headers: csrfHeaders(), body: JSON.stringify({ name, fields, expires_days: days || null }) })
      toast.success(t('rs.saved')); onSaved()
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="dash-vars max-h-[90dvh] overflow-y-auto bg-d-bg text-d-text ring-d-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{share ? t('rs.editFields') : t('rs.newShare')}</DialogTitle>
          <DialogDescription className="text-d-text3">{t('rs.shareDesc')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="flex flex-col gap-1.5 text-xs text-d-text3">{t('rs.memo')}
            <Input value={name} maxLength={100} placeholder={t('rs.memoPh')} onChange={(e) => setName(e.target.value)} />
          </label>
          {!share && (
            <label className="flex flex-col gap-1.5 text-xs text-d-text3">{t('rs.expires')}
              <SimpleSelect value={days} onChange={setDays} className="h-9 w-32" options={[{ value: '', label: t('rs.never') }, ...['7', '30', '90', '365'].map((n) => ({ value: n, label: t('rs.days', { n }) }))]} />
            </label>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('rs.fields')}</span>
          <FieldPicker groups={[{ ids: fieldIds }]} value={fields} onChange={setFields} label={(id) => t(`rs.f.${id}`)} />
        </div>
        <DialogFooter className="border-d-border bg-transparent">
          <Button variant="ghost" onClick={onClose}>{t('rs.cancel')}</Button>
          <Button onClick={save} disabled={busy || !fields.length}>{t('rs.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
