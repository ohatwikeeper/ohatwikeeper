import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/arc/slider/slider'
import { ColorPicker } from '@/components/arc/color-picker/color-picker'
import { SimpleSelect } from '@/components/ui/simple-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'

// PHP版 settings.php のウィジェットビルダー相当。既定値と異なる項目だけを config / URL に載せる
export type WidgetCfg = {
  type: string; theme: string; layout: string; align: string; padding: string; gap: string; shadow: string; font: string; font_size: string
  accent: string; bg: string; text: string; border_color: string; radius: number; border: boolean; animation: boolean
} & Record<`show_${string}`, boolean>

export const DEFAULT_CFG: WidgetCfg = {
  type: 'card', theme: 'dark', layout: 'vertical', align: 'left', padding: 'md', gap: 'md', shadow: 'none', font: 'inter', font_size: 'md',
  accent: '', bg: '', text: '', border_color: '', radius: 12, border: true, animation: true,
  show_avatar: true, show_name: true, show_handle: true, show_streak: true, show_max_streak: true, show_total: true, show_monthly: true,
  show_likes: true, show_views: true, show_latest: true, show_calendar: true, show_since: true, show_branding: true,
}

const SHOWS: [`show_${string}`, string][] = [
  ['show_avatar', 'wb.avatar'], ['show_name', 'wb.name'], ['show_handle', 'wb.handle'], ['show_streak', 'wb.streak'], ['show_max_streak', 'wb.maxStreak'],
  ['show_total', 'wb.total'], ['show_monthly', 'wb.monthly'], ['show_likes', 'wb.likes'], ['show_views', 'wb.views'], ['show_latest', 'wb.latest'],
  ['show_calendar', 'wb.calendar'], ['show_since', 'wb.since'], ['show_branding', 'wb.branding'],
]
const TYPES: [string, string][] = [['card', 'wb.tCard'], ['compact', 'wb.tCompact'], ['banner', 'wb.tBanner'], ['minimal', 'wb.tMinimal']]
const SELECTS: { k: keyof WidgetCfg; label: string; opts: [string, string][] }[] = [
  { k: 'theme', label: 'wb.theme', opts: [['dark', 'wb.dark'], ['light', 'wb.light']] },
  { k: 'layout', label: 'wb.layout', opts: [['vertical', 'wb.vertical'], ['horizontal', 'wb.horizontal']] },
  { k: 'align', label: 'wb.align', opts: [['left', 'wb.left'], ['center', 'wb.center']] },
  { k: 'padding', label: 'wb.padding', opts: [['sm', 'wb.s'], ['md', 'wb.m'], ['lg', 'wb.l']] },
  { k: 'gap', label: 'wb.gap', opts: [['sm', 'wb.s'], ['md', 'wb.m'], ['lg', 'wb.l']] },
  { k: 'shadow', label: 'wb.shadow', opts: [['none', 'wb.none'], ['sm', 'wb.s'], ['md', 'wb.m'], ['lg', 'wb.l']] },
  { k: 'font', label: 'wb.font', opts: [['inter', 'Inter'], ['noto', 'Noto Sans JP'], ['system', 'wb.system']] },
  { k: 'font_size', label: 'wb.fontSize', opts: [['sm', 'wb.s'], ['md', 'wb.m'], ['lg', 'wb.l']] },
]
const COLORS: { k: 'accent' | 'bg' | 'text' | 'border_color'; label: string; ph: string }[] = [
  { k: 'accent', label: 'wb.accent', ph: '#38bdf8' }, { k: 'bg', label: 'wb.bg', ph: 'wb.themeDef' },
  { k: 'text', label: 'wb.text', ph: 'wb.themeDef' }, { k: 'border_color', label: 'wb.border', ph: 'wb.themeDef' },
]

const HEX = /^#[0-9a-fA-F]{6}$/

/** 既定値と違うものだけ。config(保存) と URL クエリ(プレビュー)の両方に使う */
export function diffCfg(c: WidgetCfg): Record<string, string> {
  const o: Record<string, string> = {}
  for (const [k, v] of Object.entries(c)) {
    const d = (DEFAULT_CFG as any)[k]
    if (v === d) continue
    if (['accent', 'bg', 'text', 'border_color'].includes(k)) { if (HEX.test(String(v))) o[k] = String(v).slice(1) }
    else o[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v)
  }
  return o
}

const field = 'bg-d-bg border border-d-border rounded-lg px-2.5 py-1.5 text-xs text-d-text outline-none focus:border-d-text3'

export function WidgetBuilder({ uuid, name, setName, onCreate }: { uuid: string; name: string; setName: (v: string) => void; onCreate: (config: Record<string, string>) => void }) {
  const { t } = useTranslation()
  const tr = (x: string) => (x.startsWith('wb.') ? t(x) : x)
  const [cfg, setCfg] = useState<WidgetCfg>(DEFAULT_CFG)
  const [src, setSrc] = useState('')
  const [h, setH] = useState(160)
  const frame = useRef<HTMLIFrameElement>(null)
  const set = <K extends keyof WidgetCfg>(k: K, v: WidgetCfg[K]) => setCfg((p) => ({ ...p, [k]: v }))
  const qs = useMemo(() => new URLSearchParams(diffCfg(cfg)).toString(), [cfg])

  useEffect(() => {
    const t = setTimeout(() => setSrc(`/widget/${uuid}${qs ? '?' + qs : ''}`), 150)
    return () => clearTimeout(t)
  }, [uuid, qs])
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.type === 'wh') setH(Math.max(60, Math.min(900, Number(e.data.height) || 160)))
    }
    window.addEventListener('message', f)
    return () => window.removeEventListener('message', f)
  }, [])

  const lbl = 'block text-[11px] font-bold text-d-text3 mb-1'
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
      <div className="space-y-5">
        <div>
          <span className={lbl}>{t('wb.type')}</span>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(([v, l]) => (
              <button key={v} onClick={() => set('type', v)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.type === v ? 'bg-d-text text-d-bg border-d-text' : 'border-d-border text-d-text2'}`}>{tr(l)}</button>
            ))}
          </div>
        </div>

        <div>
          <span className={lbl}>{t('wb.items')}</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SHOWS.map(([k, l]) => (
              <label key={k} className="flex items-center justify-between gap-2 border-b border-d-border px-0.5 py-1.5 text-xs text-d-text">
                {tr(l)}<Switch checked={cfg[k]} onCheckedChange={(v) => set(k, v)} />
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SELECTS.map(({ k, label, opts }) => (
            <div key={k}>
              <span className={lbl}>{tr(label)}</span>
              <SimpleSelect value={cfg[k] as string} onChange={(v) => set(k, v as never)} options={opts.map(([v, l]) => ({ value: v, label: tr(l) }))} className="w-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ k, label, ph }) => (
            <div key={k}>
              <span className={lbl}>{tr(label)}</span>
              <div className="flex items-center gap-1.5">
                <ColorPicker label={tr(label)} value={HEX.test(cfg[k]) ? cfg[k] : '#38bdf8'} onValueChange={(h) => set(k, h)} />
                <Input value={cfg[k]} onChange={(e) => set(k, e.target.value)} placeholder={tr(ph)} maxLength={7} className={field + ' w-full font-mono'} />
                {cfg[k] && <Button variant="outline" size="sm" onClick={() => set(k, '')} title={t('wb.reset')} >✕</Button>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <span className={lbl}>{t('wb.radius', { n: cfg.radius })}</span>
            <Slider label={t('wb.radiusL')} min={0} max={32} value={cfg.radius} onValueChange={(v) => set('radius', Number(v))} />
          </div>
          <label className="flex items-center justify-between gap-2 border-b border-d-border px-0.5 py-1.5 text-xs text-d-text">{t('wb.border')}<Switch checked={cfg.border} onCheckedChange={(v) => set('border', v)} /></label>
          <label className="flex items-center justify-between gap-2 border-b border-d-border px-0.5 py-1.5 text-xs text-d-text">{t('wb.anim')}<Switch checked={cfg.animation} onCheckedChange={(v) => set('animation', v)} /></label>
        </div>

        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('wb.namePh')} className={field + ' flex-1 text-sm'} />
          <Button variant="default" className="bg-d-text text-d-bg font-bold hover:bg-d-text" onClick={() => onCreate(diffCfg(cfg))} >{t('wb.create')}</Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-4 h-fit">
        <span className={lbl}>{t('wb.preview')}</span>
        <div className="rounded-lg p-2" style={{ background: cfg.theme === 'light' ? '#e2e8f0' : '#0b0f13' }}>
          {src && <iframe ref={frame} src={src} title="widget preview" style={{ width: '100%', height: h, border: 0 }} />}
        </div>
      </div>
    </div>
  )
}
