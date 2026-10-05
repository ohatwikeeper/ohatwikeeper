import MiniFooter from '@/components/dashboard-ui/MiniFooter'
import i18n from '@/i18n'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { OtpCountdown } from '@/components/ui/otp-countdown'
import { OtpField } from '@/components/ui/otp-field'

interface Reg { provider: string; username: string; email: string | null; csrf: string; invitation_required: boolean; error: string | null; resend_after?: number; expires_in?: number }

const post = async (path: string, body: unknown) => {
  const r = await fetch('/app-api/auth/register/' + path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || i18n.t('lg.errStatus', { s: r.status }))
  return d
}

export default function ConfirmLoginPage() {
  const { t } = useTranslation()
  const [reg, setReg] = useState<Reg | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const [exp, setExp] = useState(0)
  useEffect(() => {
    if (step !== 'otp' || wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [step, wait])
  const r = new URLSearchParams(window.location.search).get('r') ?? undefined

  useEffect(() => {
    document.title = `${t('lg.regTitle')} - おはツイKeeper`
    fetch('/app-api/auth/register-state', { credentials: 'include' }).then(async (x) => {
      if (!x.ok) { window.location.href = '/login'; return }
      const d: Reg = await x.json()
      setReg(d); setErr(d.error); setWait(d.resend_after ?? 0); setExp(d.expires_in ? Date.now() + d.expires_in * 1000 : 0)
      if (d.email) { setEmail(d.email); setStep('otp') }
    })
  }, [])

  const otpForm = useRef<HTMLFormElement>(null)
  const [otpErr, setOtpErr] = useState<string | null>(null)
  useEffect(() => { if (otp) setOtpErr(null) }, [otp])
  const run = async (fn: () => Promise<void>, isOtp = false) => { setBusy(true); setErr(null); setOtpErr(null); try { await fn() } catch (e) { if (isOtp) setOtpErr((e as Error).message); else setErr((e as Error).message); setOtp('') } finally { setBusy(false) } }
  if (!reg) return null
  const name = reg.provider === 'discord' ? reg.username : '@' + reg.username

  return (
    <div className="dash-scope relative min-h-screen bg-d-bg text-d-text">
      <div className="mx-auto flex max-w-md flex-col items-start px-5 py-24">
        <Badge variant="outline" className="mb-5 text-d-text2">Sign up</Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">{t('lg.regTitle')}</h1>
        <p className="mt-3 text-sm text-d-text2">{t('lg.regDesc', { p: reg.provider === 'discord' ? 'Discord' : 'X', n: name })}</p>
        {err && <p className="mt-5 w-full rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</p>}
        {step === 'email' ? (
          <form className="mt-8 flex w-full flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void run(async () => { const d = await post('request_otp', { csrf: reg.csrf, email, invitation_code: code }); setWait(d.resend_after ?? 60); setExp(Date.now() + 600000); setStep('otp') }) }}>
            <Input type="email" required placeholder={t('lg.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            {reg.invitation_required && <Input required placeholder={t('lg.invite')} value={code} onChange={(e) => setCode(e.target.value)} />}
            <Button type="submit" disabled={busy}>{t('lg.sendCode')}</Button>
          </form>
        ) : (
          <form ref={otpForm} className="mt-8 flex w-full flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (busy || otp.length < 8) return; void run(async () => { const d = await post('verify', { csrf: reg.csrf, otp, r }); window.location.href = /^\/(?![\/\\])/.test(String(d.redirect)) ? d.redirect : '/dashboard' }, true) }}>
            <p className="text-sm text-d-text2">{t('lg.otpHint', { e: email })}</p>
            {exp > Date.now() && <OtpCountdown expiresAt={exp} />}
            <OtpField value={otp} onChange={setOtp} disabled={busy} error={otpErr} onComplete={() => otpForm.current?.requestSubmit()} />
            <Button type="button" variant="outline" disabled={busy || wait > 0} onClick={() => void run(async () => { const d = await post('request_otp', { csrf: reg.csrf, email, invitation_code: code }); setWait(d.resend_after ?? 60); setExp(Date.now() + 600000); setOtp('') })}>{wait > 0 ? t('em.resendIn', { s: wait }) : t('em.resend')}</Button>
            <Button type="button" variant="ghost" onClick={() => setStep('email')}>{t('lg.changeEmail')}</Button>
          </form>
        )}
        <Button variant="link" className="mt-4 px-0 text-d-text2" onClick={() => void post('cancel', {}).then(() => { window.location.href = '/login' })}>{t('lg.cancel')}</Button>
      </div>
      <MiniFooter />
    </div>
  )
}
