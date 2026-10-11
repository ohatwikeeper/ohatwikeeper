import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { confirmDialog } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { apiGet, apiSend, friendlyError } from '@/lib/dashboard/api'

type Pk = { id: number; name: string; created_at: number; last_used_at: number | null }

export default function PasskeySection() {
  const { t } = useTranslation()
  const [list, setList] = useState<Pk[]>([])
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null)
  const supported = browserSupportsWebAuthn()

  const load = useCallback(async () => {
    try { setList((await apiGet<{ passkeys: Pk[] }>('passkeys')).passkeys) } catch (e) { toast.error(friendlyError(e)) }
  }, [])
  useEffect(() => { void load() }, [load])

  const add = async () => {
    setBusy(true)
    try {
      const { options } = await apiSend<{ options: any }>('passkeys/register/options', 'POST')
      const response = await startRegistration({ optionsJSON: options })
      await apiSend('passkeys/register/verify', 'POST', { response, name })
      setName('')
      toast.success(t('pk.added'))
      await load()
    } catch (e) {
      toast.error((e as Error)?.name === 'NotAllowedError' ? t('pk.cancelled') : friendlyError(e))
    } finally { setBusy(false) }
  }
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true)
    try { await fn(); if (msg) toast.success(msg); await load() } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <div className="pt-4">
      <h2 className="text-lg font-bold text-d-text flex items-center gap-2"><KeyRound className="w-5 h-5" />{t('pk.title')}</h2>
      <p className="text-xs text-d-text3 mt-1">{t('pk.desc')}</p>

      {list.length === 0 ? <p className="text-xs text-d-text3 mt-3">{t('pk.none')}</p> : (
        <ul className="mt-3 divide-y divide-d-border rounded-lg border border-d-border">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                {editing?.id === p.id ? (
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void act(() => apiSend(`passkeys/${p.id}`, 'PATCH', { name: editing.name }), t('pk.saved')).then(() => setEditing(null)) }}>
                    <Input value={editing.name} maxLength={64} onChange={(e) => setEditing({ id: p.id, name: e.target.value })} className="h-8" autoFocus />
                    <Button type="submit" size="sm" variant="outline" disabled={busy || !editing.name.trim()} className="border-d-border">{t('st.save')}</Button>
                  </form>
                ) : (
                  <>
                    <p className="text-sm text-d-text truncate">{p.name}</p>
                    <p className="text-xs text-d-text3">{t('pk.lastUsed')}: {p.last_used_at ? new Date(p.last_used_at).toLocaleString() : t('pk.never')}</p>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon" aria-label={t('pk.rename')} disabled={busy} onClick={() => setEditing({ id: p.id, name: p.name })}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" aria-label={t('pk.delete')} disabled={busy}
                onClick={async () => { if (await confirmDialog({ title: t('pk.deleteQ'), confirmLabel: t('pk.delete'), destructive: true })) await act(() => apiSend(`passkeys/${p.id}`, 'DELETE')) }}><Trash2 className="w-4 h-4" /></Button>
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <div className="mt-3 flex max-w-md gap-2">
          <Input value={name} maxLength={64} placeholder={t('pk.name')} onChange={(e) => setName(e.target.value)} />
          <Button variant="outline" disabled={busy} onClick={add} className="border-d-border shrink-0">{t('pk.add')}</Button>
        </div>
      ) : <p className="text-xs text-d-text3 mt-3">{t('pk.unsupported')}</p>}
    </div>
  )
}
