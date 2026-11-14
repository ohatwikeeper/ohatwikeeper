import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { csrfHeaders, friendlyError } from '@/lib/dashboard/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import FieldPicker from './field-picker'
import { loadCatalog, scopeGroups } from './catalog'

interface Key { id: number; name: string; last_used_at: string | null; scopes: string[] }

// APIキーごとに、公開API(/api/v2/user/links)で使える操作と項目を選ぶ
export default function ApiScopesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const [keys, setKeys] = useState<Key[] | null>(null)
  const [ids, setIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  useEffect(() => {
    if (!open) return
    loadCatalog().then((c) => setIds(c.api_scopes)).catch(() => {})
    fetch('/app-api/r-links/api-scopes', { credentials: 'include' }).then((r) => r.json()).then((j) => {
      setKeys(j.keys ?? []); if (j.keys?.length === 1) setOpenId(j.keys[0].id)
    }).catch((e) => toast.error(friendlyError(e)))
  }, [open])
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="dash-vars max-h-[90dvh] overflow-y-auto bg-d-bg text-d-text ring-d-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('rs.apiTitle')}</DialogTitle>
          <DialogDescription className="text-pretty text-d-text3">{t('rs.apiDesc')}</DialogDescription>
        </DialogHeader>
        {keys && keys.length === 0 && <p className="text-sm text-d-text3">{t('rs.noKeys')}</p>}
        {keys && keys.length > 0 && (
          <ul className="flex flex-col divide-y divide-d-border/60 border-y border-d-border/60">
            {keys.map((k) => (
              <KeyRow key={k.id} k={k} ids={ids} open={openId === k.id} onToggle={() => setOpenId(openId === k.id ? null : k.id)}
                onSaved={(scopes) => setKeys((ks) => ks!.map((x) => (x.id === k.id ? { ...x, scopes } : x)))} />
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to="/settings/apikey" className="text-d-text2 underline-offset-4 hover:underline" onClick={onClose}>{t('rs.manageKeys')}</Link>
          <a href="/api-docs#tag/user-links" className="text-d-text2 underline-offset-4 hover:underline">{t('rs.docs')}</a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function KeyRow({ k, ids, open, onToggle, onSaved }: { k: Key; ids: string[]; open: boolean; onToggle: () => void; onSaved: (s: string[]) => void }) {
  const { t } = useTranslation()
  const [scopes, setScopes] = useState(k.scopes)
  const [busy, setBusy] = useState(false)
  const dirty = scopes.slice().sort().join() !== k.scopes.slice().sort().join()
  const save = async () => {
    setBusy(true)
    try {
      const r = await fetch(`/app-api/r-links/api-scopes/${k.id}`, { method: 'PUT', credentials: 'include', headers: csrfHeaders(), body: JSON.stringify({ scopes }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.success) throw new Error(j.error || String(r.status))
      onSaved(j.scopes); setScopes(j.scopes); toast.success(t('rs.saved'))
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex h-12 w-full items-center gap-3 pr-1 text-left">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{k.name || `#${k.id}`}</span>
        <span className="shrink-0 text-xs tabular-nums text-d-text3">{t('rs.on', { n: k.scopes.length })}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-d-text3 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="flex flex-col gap-4 pb-4">
          <FieldPicker groups={scopeGroups(ids, t)} value={scopes} onChange={setScopes} label={(id) => t(`rs.s.${id}`)} />
          <div className="flex justify-end"><Button size="sm" onClick={save} disabled={busy || !dirty}>{t('rs.save')}</Button></div>
        </div>
      )}
    </li>
  )
}
