import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmailChange } from '@/features/settings/email'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Check, Moon, Sun } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type * as React from 'react'
import { Link } from 'react-router-dom'
import { ACCENTS, useDashTheme } from '@/lib/dashboard/theme'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { LANGS } from '@/i18n/translations'
import { useSession } from '@/lib/session'
import { csrfHeaders } from '@/lib/dashboard/api'
import { STEPS, type Step, agreeTerms, finishOnboard, refreshOnboard, requiredStep, saveStep, setPublic, useOnboard } from '@/lib/onboard'

const NOTIFY = [['reminder_enabled', 'ob2.remind'], ['award_email_enabled', 'ob2.award'], ['weekly_summary_enabled', 'ob2.weekly'], ['monthly_summary_enabled', 'ob2.monthly']] as const

export default function OnboardPage() {
  const { t: tr, i18n } = useTranslation()
  const s = useSession()
  const o = useOnboard(s.ready && s.logged_in)
  const nav = useNavigate()
  const dash = useDashTheme()
  const [agree, setAgree] = useState(false)
  const { step: p } = useParams()
  // 完了後に戻る元のページ(?r=)。同一サイト内のパスのみ許可
  const rRaw = new URLSearchParams(useLocation().search).get('r')
  const back = rRaw && rRaw.startsWith('/') && !rRaw.startsWith('//') ? rRaw : null
  const q = back ? `?r=${encodeURIComponent(back)}` : ''
  const step = STEPS.includes(p as Step) ? (p as Step) : 'lang'
  const idx = STEPS.indexOf(step)
  const [flags, setFlags] = useState<Record<string, boolean>>({ reminder_enabled: true, award_email_enabled: true, weekly_summary_enabled: false, monthly_summary_enabled: false })

  useEffect(() => { document.title = `${tr('ob2.title')} - おはツイKeeper` }, [tr, i18n.language])
  useEffect(() => { if (p && o.ready && o.active) saveStep(step) }, [p, step, o.ready, o.active])

  // 通知設定はサーバーの保存値を読み込む(リロード・戻るで既定値に戻らないように)
  useEffect(() => {
    if (step !== 'notify' || !s.logged_in) return
    fetch('/app-api/settings', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.notify) setFlags((f) => ({ ...f, ...Object.fromEntries(Object.keys(f).map((k) => [k, !!d.notify[k]])) }))
    }).catch(() => {})
  }, [step, s.logged_in])
  if (!s.ready || !o.ready) return null
  if (!s.logged_in) return <Navigate to="/login?r=/onboard/lang" replace />
  const must = requiredStep(o)
  // /onboard だけで来たら、続きのステップへ(完了済みならダッシュボードへ)
  if (!p) return <Navigate to={must || o.active ? `/onboard/${must ?? o.step}${q}` : (back ?? '/dashboard')} replace />
  // 初回セットアップ対象外(既存ユーザー)は、必須設定の画面だけを開ける。何も残っていなければダッシュボードへ
  if (!o.active) {
    if (!must) return <Navigate to={back ?? '/dashboard'} replace />
    if (step !== must) return <Navigate to={`/onboard/${must}${q}`} replace />
  }
  // セットアップ中でも、未完了の必須設定を飛び越えて先へは進ませない
  if (must && idx > STEPS.indexOf(must)) return <Navigate to={`/onboard/${must}${q}`} replace />

  // 順番を飛ばしてURLを直接開いても、今のステップの次までしか進めない
  if (o.active && idx > STEPS.indexOf(o.step) + 1) return <Navigate to={`/onboard/${o.step}${q}`} replace />
  const go = (to: Step) => nav(`/onboard/${to}${q}`)
  const next = () => go(STEPS[idx + 1])
  const saveNotify = async () => {
    await fetch('/app-api/settings/notify', { method: 'PUT', credentials: 'include', headers: csrfHeaders(), body: JSON.stringify({ ...flags, reminder_times: ['20'] }) })
    next()
  }
  const finish = async (to: string) => { await finishOnboard(); window.location.href = to }

  return (
    <div className="dash-scope grid !min-h-[calc(100dvh-var(--navbar-real-h,0px))] place-items-center bg-d-bg px-5 py-10 text-d-text">
      <div className="w-full max-w-xl space-y-8">
        <div>
          <p className="text-sm text-d-text3">{tr('ob2.title')} ・ {tr('ob2.step', { n: idx + 1, m: STEPS.length })}</p>
          <Progress value={((idx + 1) / STEPS.length) * 100} className="mt-4 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-d-border [&_[data-slot=progress-indicator]]:bg-d-text" />
        </div>

        {step === 'lang' && <>
          <Head t={tr('ob2.langT')} d={tr('ob2.langD')} />
          <RadioGroup value={LANGS.find((l) => i18n.language.startsWith(l.code))?.code ?? 'en'} onValueChange={(v: string) => { void i18n.changeLanguage(v) }} className="grid grid-cols-2 gap-x-6 gap-y-4">
            {LANGS.map((l) => (
              <div key={l.code} className="flex items-center gap-3">
                <RadioGroupItem value={l.code} id={`lang-${l.code}`} />
                <Label htmlFor={`lang-${l.code}`} className="cursor-pointer text-base">{l.native}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={next} className="w-full">{tr('ob2.next')}</Button>
        </>}

        {step === 'terms' && <>
          <Head t={tr('ob4.tmT')} d={tr('ob4.tmD')} req={tr('ob3.req')} />
          <div className="flex items-start gap-3">
            <Checkbox id="agree" checked={agree || !o.needTerms} onCheckedChange={(v: boolean) => setAgree(v)} className="mt-0.5" />
            <Label htmlFor="agree" className="cursor-pointer text-base leading-relaxed"><span><Link to="/terms" target="_blank" className="underline underline-offset-4">{tr('ob4.tmTerms')}</Link> / <Link to="/policy" target="_blank" className="underline underline-offset-4">{tr('ob4.tmPolicy')}</Link> {tr('ob4.tmCheck')}</span></Label>
          </div>
          <Nav back={() => go('lang')} next={() => { void agreeTerms().then(next) }} nextLabel={tr('ob2.next')} disabled={!agree && o.needTerms} />
        </>}

        {step === 'x' && <>
          <Head t={tr('ob2.xT')} d={tr('ob3.xReq')} req={tr('ob3.req')} />
          {!o.needX
            ? <Alert className="[&>svg]:translate-y-0 [&>svg]:self-center"><Check className="text-emerald-400" /><AlertTitle>{tr('ob2.xOk')}</AlertTitle>{o.xUser && <AlertDescription>@{o.xUser}</AlertDescription>}</Alert>
            : <Button onClick={() => { window.location.href = `/login?action=login&provider=x&csrf=${encodeURIComponent(s.csrf_token)}&r=${encodeURIComponent(`/onboard/x${q}`)}` }} className="w-full">{tr('ob2.xGo')}</Button>}
          <Nav back={o.active ? () => go('terms') : undefined} next={next} nextLabel={tr('ob2.next')} disabled={o.needX} />
        </>}

        {step === 'email' && <>
          <Head t={tr('ob3.emT')} d={tr('ob3.emD')} req={tr('ob3.req')} />
          {!o.needEmail
            ? <Alert className="[&>svg]:translate-y-0 [&>svg]:self-center"><Check className="text-emerald-400" /><AlertTitle>{tr('ob3.emOk')}</AlertTitle><AlertDescription className="font-mono">{o.email}</AlertDescription></Alert>
            : <EmailChange onDone={() => { void refreshOnboard() }} />}
          <Nav back={o.active ? () => go('x') : undefined} next={next} nextLabel={tr('ob2.next')} disabled={o.needEmail} />
        </>}

        {step === 'public' && <>
          <Head t={tr('ob4.pbT')} d={tr('ob4.pbD')} />
          <RadioGroup value={String(o.isPublic)} onValueChange={(v: string) => { void setPublic(v === 'true') }} className="gap-5">
            {([[true, 'ob4.pbOn', 'ob4.pbOnD'], [false, 'ob4.pbOff', 'ob4.pbOffD']] as const).map(([v, t1, t2]) => (
              <div key={String(v)} className="flex items-start gap-3">
                <RadioGroupItem value={String(v)} id={`pb-${v}`} className="mt-1" />
                <Label htmlFor={`pb-${v}`} className="flex cursor-pointer flex-col items-start gap-1"><span className="text-base font-medium">{tr(t1)}</span><span className="text-sm font-normal text-d-text2">{tr(t2)}</span></Label>
              </div>
            ))}
          </RadioGroup>
          <Nav back={() => go('email')} next={next} nextLabel={tr('ob2.next')} />
        </>}

        {step === 'profile' && <>
          <Head t={tr('ob4.prT')} d={tr('ob4.prD')} />
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {o.xIcon && <AvatarImage src={o.xIcon} alt="" />}
              <AvatarFallback className="text-xl">{(o.name || o.xUser || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0"><div className="truncate text-xl font-semibold">{o.name}</div>{o.xUser && <div className="text-sm text-d-text3">@{o.xUser}</div>}</div>
          </div>
          <Nav back={() => go('public')} next={next} nextLabel={tr('ob2.next')} />
        </>}

        {step === 'theme' && <>
          <Head t={tr('ob4.lkT')} d={tr('ob4.lkD')} />
          <ToggleGroup value={[dash.theme]} variant="outline" size="lg" spacing={0} className="w-full">
            {(['light', 'dark'] as const).map((m) => (
              <ToggleGroupItem key={m} value={m} className="h-12 flex-1 text-base" onClick={(e: React.MouseEvent) => { if (dash.theme !== m) dash.toggleTheme(e.clientX, e.clientY) }}>
                {m === 'light' ? <Sun className="size-4" /> : <Moon className="size-4" />}{tr(m === 'light' ? 'ob4.lkLight' : 'ob4.lkDark')}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button key={a.name} type="button" title={tr(a.label)} aria-label={tr(a.label)} onClick={() => dash.setAccent(a.name)}
                className={`grid size-9 cursor-pointer place-items-center rounded-full border-2 ${dash.accent === a.name ? 'border-d-text' : 'border-transparent'}`} style={{ background: a.c }}>
                {dash.accent === a.name && <Check className="size-4 text-black" />}
              </button>
            ))}
          </div>
          <Nav back={() => go('profile')} next={next} nextLabel={tr('ob2.next')} />
        </>}

        {step === 'notify' && <>
          <Head t={tr('ob2.nT')} d={tr('ob2.nD')} />
          <div className="space-y-2">
            {NOTIFY.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-2 text-base">
                {tr(label)}<Switch checked={flags[k]} onCheckedChange={(v: boolean) => setFlags((f) => ({ ...f, [k]: v }))} />
              </label>
            ))}
          </div>
          <Nav back={() => go('theme')} next={() => { void saveNotify() }} nextLabel={tr('ob2.next')} />
        </>}

        {step === 'done' && <>
          <Head t={tr('ob2.doneT')} d={tr('ob2.doneD')} />
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" onClick={() => { void finish('/extensions/oneclick_add') }}>{tr('ob2.ext')}</Button>
            <Button className="w-full" onClick={() => { void finish(back ?? '/dashboard') }}>{tr('ob2.finish')}</Button>
          </div>
          <button type="button" onClick={() => go('notify')} className="cursor-pointer text-xs text-d-text3 hover:text-d-text">{tr('ob2.back')}</button>
        </>}
      </div>
    </div>
  )
}

const Head = ({ t, d, req }: { t: string; d: string; req?: string }) => (
  <div><h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">{t}{req && <Badge variant="outline" className="text-xs font-medium text-d-text2">{req}</Badge>}</h1><p className="mt-2 text-base text-d-text2">{d}</p></div>
)
const Nav = ({ back, next, nextLabel, disabled }: { back?: () => void; next: () => void; nextLabel: string; disabled?: boolean }) => {
  const { t } = useTranslation()
  return <div className="flex gap-2">{back && <Button variant="outline" size="lg" className="h-12 px-5" onClick={back}>{t('ob2.back')}</Button>}<Button size="lg" className="h-12 flex-1 bg-d-text text-base text-d-bg hover:bg-d-text/90 disabled:opacity-40" disabled={disabled} onClick={next}>{nextLabel}</Button></div>
}
