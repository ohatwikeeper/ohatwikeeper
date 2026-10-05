import i18n from '@/i18n'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OtpField } from '@/components/ui/otp-field'

type Res = { ok: boolean; message?: string; email?: string; pending?: string | null }

const call = async (body: object): Promise<Res & { status: number }> => {
  const r = await fetch('/app-api/email_change', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify(body),
  })
  const d = await r.json().catch(() => ({ ok: false, message: i18n.t('em.serverErr') }))
  return { ...d, status: r.status }
}

/** メールアドレスの登録・変更(OTP 認証)。/settings とオンボードに埋め込む */
export function EmailChange({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    call({ action: 'status' }).then((d) => { setCurrent(d.email ?? ''); setPending(d.pending ?? null) })
  }, [])

  const run = async (body: object, onOk: (d: Res) => void) => {
    setBusy(true); setError('')
    const d = await call(body).catch(() => ({ ok: false, message: i18n.t('em.netFail'), status: 0 }))
    setBusy(false)
    if (d.ok) onOk(d); else setError(d.message ?? t('st.err'))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-d-text3">{t('em.current')}<span className="font-mono">{current || t('st.emailNone')}</span></p>
        {error && <div className="mb-4 rounded-lg border border-d-danger/40 bg-d-danger/10 px-3 py-2 text-sm text-d-danger">{error}</div>}

        {!pending ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run({ action: 'request_change', new_email: email }, (d) => { setPending(d.email ?? email); toast.success(d.message) }) }}>
            <label className="block text-xs font-semibold text-d-text2">{t('em.newLabel')}</label>
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" disabled={busy || !email} className="w-full">{busy ? t('st.sending') : t('em.sendOtp')}</Button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run({ action: 'verify_otp', otp }, (d) => { setCurrent(d.email ?? ''); setPending(null); setOtp(''); setEmail(''); toast.success(d.message); window.dispatchEvent(new Event('dashboard:reload')); onDone?.() }) }}>
            <p className="text-sm text-d-text2"><span className="font-mono">{pending}</span>{t('em.otpHint')}</p>
            <OtpField value={otp} onChange={setOtp} />
            <Button type="submit" disabled={busy || otp.length !== 8} className="w-full"><ShieldCheck className="mr-1 size-4" />{busy ? t('em.checking') : t('em.verify')}</Button>
            <Button type="button" variant="ghost" size="xs" className="w-full text-d-text3" onClick={() => run({ action: 'cancel' }, () => { setPending(null); setOtp('') })}>{t('em.cancel')}</Button>
          </form>
        )}
    </div>
  )
}
