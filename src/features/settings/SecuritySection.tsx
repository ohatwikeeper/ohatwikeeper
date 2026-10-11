import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { confirmDialog } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { apiGet, apiSend, friendlyError } from '@/lib/dashboard/api'

type Sess = { id: string; current: boolean; ip: string | null; ua: string | null; login_at: number | null }
type Hist = { id: number; ip: string; user_agent: string; is_new_device: number; created_at: number | string }

// UA 文字列から「ブラウザ / OS」の簡易表記を作る
const label = (ua: string | null, unknown: string) => {
  if (!ua) return unknown
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const o = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : unknown
  return `${b} / ${o}`
}
const fmt = (ms: number | string) => new Date(Number(ms)).toLocaleString()

export default function SecuritySection() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<Sess[]>([])
  const [history, setHistory] = useState<Hist[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        apiGet<{ sessions: Sess[] }>('security/sessions'),
        apiGet<{ history: Hist[] }>('security/login-history'),
      ])
      setSessions(s.sessions)
      setHistory(h.history)
    } catch (e) { toast.error(friendlyError(e)) }
  }, [])
  useEffect(() => { void load() }, [load])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try { await fn(); toast.success(t('sec.revoked')); await load() } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }
  const others = sessions.filter((s) => !s.current).length

  return (
    <div className="pt-4">
      <h2 className="text-lg font-bold text-d-text flex items-center gap-2"><ShieldCheck className="w-5 h-5" />{t('sec.title')}</h2>
      <p className="text-xs text-d-text3 mt-1">{t('sec.desc')}</p>

      <h3 className="text-sm font-bold text-d-text mt-4">{t('sec.devices')}</h3>
      <ul className="mt-2 divide-y divide-d-border rounded-lg border border-d-border">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 p-3">
            <Monitor className="w-4 h-4 shrink-0 text-d-text3" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-d-text truncate">
                {label(s.ua, t('sec.unknown'))}
                {s.current && <span className="ml-2 rounded bg-d-border px-1.5 py-0.5 text-[10px]">{t('sec.current')}</span>}
              </p>
              <p className="text-xs text-d-text3 truncate">{s.login_at ? `${fmt(s.login_at)} · ${s.ip ?? ''}` : t('sec.noInfo')}</p>
            </div>
            {!s.current && (
              <Button variant="outline" size="sm" disabled={busy} className="border-d-border" onClick={() => run(() => apiSend(`security/sessions/${s.id}`, 'DELETE'))}>{t('sec.logout')}</Button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <Button variant="outline" size="sm" disabled={busy} className="mt-3 border-d-border"
          onClick={async () => { if (await confirmDialog({ title: t('sec.logoutOthersQ'), confirmLabel: t('sec.logout'), destructive: true })) await run(() => apiSend('security/sessions/revoke-others', 'POST')) }}>
          {t('sec.logoutOthers')}
        </Button>
      )}

      <h3 className="text-sm font-bold text-d-text mt-6">{t('sec.history')}</h3>
      {history.length === 0 ? <p className="text-xs text-d-text3 mt-2">{t('sec.historyEmpty')}</p> : (
        <ul className="mt-2 divide-y divide-d-border rounded-lg border border-d-border">
          {history.map((h) => (
            <li key={h.id} className="p-3">
              <p className="text-sm text-d-text truncate">
                {label(h.user_agent, t('sec.unknown'))}
                {!!h.is_new_device && <span className="ml-2 rounded bg-d-border px-1.5 py-0.5 text-[10px]">{t('sec.newDevice')}</span>}
              </p>
              <p className="text-xs text-d-text3">{fmt(h.created_at)} · {h.ip}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
