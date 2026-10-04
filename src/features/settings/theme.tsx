import { Slider } from '@/components/arc/slider/slider'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CustomColor } from '@/components/dashboard-ui/ThemePicker'
import { Button } from '@/components/ui/button'
import { ACCENTS, useDashTheme, type DashTheme, type Motion } from '@/lib/dashboard/theme'
import { useSession } from '@/lib/session'
import { cn } from '@/lib/utils'

function Choice<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T, e: React.MouseEvent) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-3">
      {options.map(o => (
        <button key={o.value} type="button" data-cuelume-skip aria-pressed={value === o.value} onClick={e => value !== o.value && onChange(o.value, e)}
          className={cn('rounded-xl border px-4 py-3 text-sm transition-colors', value === o.value ? 'border-d-accent bg-d-med text-d-text' : 'border-d-border text-d-text2 hover:text-d-text')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div><h3 className="text-sm font-semibold text-d-text2">{title}</h3>{desc && <p className="mt-0.5 text-xs text-d-text3">{desc}</p>}</div>
    {children}
  </section>
)

/** /settings/theme: 見た目の設定。ログイン中はアカウントに保存され、どのブラウザでも共通になる */
export function ThemePanel() {
  const { t } = useTranslation()
  const { settings: s, set, toggleTheme, reset } = useDashTheme()
  const session = useSession()
  return (
    <div className="mx-auto max-w-2xl space-y-8">
        <p className="text-xs text-d-text3">
          {session.ready && t(session.logged_in ? 'theme.saved' : 'theme.guest')}
        </p>
        <Section title={t('theme.appearance')}>
          <Choice<DashTheme> value={s.theme} onChange={(_, e) => toggleTheme(e.clientX, e.clientY)} options={[{ value: 'light', label: t('theme.light') }, { value: 'dark', label: t('theme.dark') }]} />
        </Section>
        <Section title={t('theme.accent')}>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map(a => (
              <button key={a.name} type="button" data-cuelume-skip title={t(a.label)} aria-label={t(a.label)} aria-pressed={s.accent === a.name} onClick={() => set('accent', a.name)}
                className="relative flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110" style={{ background: a.c }}>
                {s.accent === a.name && <motion.i layoutId="accent-check" className="bx bx-check text-xl text-black/80" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
              </button>
            ))}
            <CustomColor size="size-9" active={s.accent.startsWith('custom:')} hex={s.accent.startsWith('custom:') ? s.accent.slice(7) : '#ff6b6b'} onCommit={v => set('accent', `custom:${v}`)} />
          </div>
        </Section>
        <Section title={t('theme.font')} desc={t('theme.fontDesc')}>
          <span className="text-xs text-d-text2">{s.font}%</span>
          <Slider label={t('theme.font')} min={80} max={130} value={s.font} onValueChange={v => set('font', Number(v))} />
        </Section>
        <Section title={t('theme.radius')}>
          <span className="text-xs text-d-text2">{s.radius}px</span>
          <Slider label={t('theme.radius')} min={0} max={24} value={s.radius} onValueChange={v => set('radius', Number(v))} />
        </Section>
        <Section title={t('theme.motion')} desc={t('theme.motionDesc')}>
          <Choice<Motion> value={s.motion} onChange={v => set('motion', v)} options={[{ value: 'on', label: t('common.on') }, { value: 'off', label: t('common.off') }]} />
        </Section>
        <Button variant="outline" onClick={reset}>{t('theme.reset')}</Button>
    </div>
  )
}
