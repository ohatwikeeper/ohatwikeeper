import i18n from '@/i18n'
import { useTranslation } from 'react-i18next'
import { OtpCountdown } from '@/components/ui/otp-countdown'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { CheckCircle2, MailPlus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OtpField } from '@/components/ui/otp-field'

type Res = { ok: boolean; message?: string; email?: string; pending?: string | null; resend_after?: number; expires_in?: number }

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
  const [otpError, setOtpError] = useState('')
  const [done, setDone] = useState(false)
  const otpForm = useRef<HTMLFormElement>(null)
  const [adding, setAdding] = useState(false)
  // 閉じるアニメーション中に中身が切り替わらないよう、状態のリセットは閉じ終わってから行う
  const closeForm = () => { setAdding(false); setError(''); window.setTimeout(() => { setPending(null); setOtp(''); setEmail(''); setDone(false) }, 400) }
  const [wait, setWait] = useState(0)
  const [exp, setExp] = useState(0)
  const expire = () => { closeForm(); toast.error('入力時間(10分)が過ぎました。もう一度やり直してください。') }
  useEffect(() => {
    if (!pending || !exp) return
    const id = setTimeout(expire, Math.max(0, exp - Date.now()))
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, exp])
  useEffect(() => { if (otp) setOtpError('') }, [otp])

  useEffect(() => {
    call({ action: 'status' }).then((d) => { setCurrent(d.email ?? ''); setPending(d.pending ?? null); setAdding(!!d.pending); setWait(d.resend_after ?? 0); if (d.pending) setExp(Date.now() + (d.expires_in ?? 600) * 1000) })
  }, [])

  useEffect(() => {
    if (!pending || wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [pending, wait])

  const run = async (body: object, onOk: (d: Res) => void) => {
    setBusy(true); setError(''); setOtpError('')
    const d = await call(body).catch(() => ({ ok: false, message: i18n.t('em.netFail'), status: 0 }))
    setBusy(false)
    if (d.ok) onOk(d); else if (d.status === 410) expire()
    else if (body && (body as { action?: string }).action === 'verify_otp') { setOtpError(d.message ?? t('st.err')); setOtp('') } else setError(d.message ?? t('st.err'))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-d-text3">{t('em.current')}<span className="font-mono">{current || t('st.emailNone')}</span></p>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${adding ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!adding}>
        <div className="-mx-1 min-h-0 overflow-hidden px-1">
        <div className={`space-y-3 pb-1 pt-1 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${adding ? 'translate-y-0' : '-translate-y-2'}`}>
        {error && <div className="mb-4 rounded-lg border border-d-danger/40 bg-d-danger/10 px-3 py-2 text-sm text-d-danger">{error}</div>}

        {!pending ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run({ action: 'request_change', new_email: email }, (d) => { setPending(d.email ?? email); setWait(d.resend_after ?? 60); setExp(Date.now() + 600000); toast.success(d.message) }) }}>
            <label className="block text-xs font-semibold text-d-text2">{t('em.newLabel')}</label>
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" disabled={busy || !email} className="w-full">{busy ? t('st.sending') : t('em.sendOtp')}</Button>
            <Button type="button" variant="ghost" size="xs" className="w-full text-d-text3" onClick={closeForm}>{t('em.cancel')}</Button>
          </form>
        ) : (
          <form ref={otpForm} className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (busy || done || otp.length !== 8) return; run({ action: 'verify_otp', otp }, (d) => { setDone(true); toast.success(d.message); window.setTimeout(() => { setCurrent(d.email ?? ''); setAdding(false); setPending(null); setAdding(false); setOtp(''); setEmail(''); setDone(false); window.dispatchEvent(new Event('dashboard:reload')); onDone?.() }, 1500) }) }}>
            <p className="text-sm text-d-text2"><span className="font-mono">{pending}</span><br /><span className="whitespace-nowrap">{t('em.otpHint').trim()}</span></p>
            {exp > 0 && <OtpCountdown expiresAt={exp} />}
            <OtpField value={otp} onChange={setOtp} disabled={busy || done} success={done} error={otpError} onComplete={() => otpForm.current?.requestSubmit()} />
            {done && <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400 animate-in fade-in zoom-in-95 duration-300"><CheckCircle2 className="size-5" />{t('em.done')}</div>}
            <Button type="button" variant="outline" size="sm" className="w-full" disabled={busy || done || wait > 0} onClick={() => run({ action: 'request_change', new_email: pending }, (d) => { setWait(d.resend_after ?? 60); setExp(Date.now() + 600000); setOtp(''); toast.success(t('em.resent')) })}><RotateCw className="mr-1 size-3.5" />{wait > 0 ? t('em.resendIn', { s: wait }) : t('em.resend')}</Button>
            <Button type="button" variant="ghost" size="xs" className="w-full text-d-text3" disabled={done} onClick={() => run({ action: 'cancel' }, closeForm)}>{t('em.cancel')}</Button>
          </form>
        )}
        </div>
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${adding ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="min-h-0 overflow-hidden">
          <Button type="button" variant="outline" size="sm" tabIndex={adding ? -1 : 0} onClick={() => { setError(''); setAdding(true) }}><MailPlus className="mr-1 size-4" />{t('em.start')}</Button>
        </div>
      </div>
    </div>
  )
}
