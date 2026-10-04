import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SimpleSelect } from '@/components/ui/simple-select'
import { Popover } from '@base-ui/react/popover'
import { HexAlphaColorPicker, HexColorInput } from 'react-colorful'
import { Pipette, Check, Moon, Palette, Sun } from 'lucide-react'
import { ACCENTS, useDashTheme } from '@/lib/dashboard/theme'

/** サイドバー用: ライト/ダーク切替 + アクセントカラーのパレット(プリセット + 任意色) */
export default function ThemePicker() {
  const { t: tr } = useTranslation()
  const { theme, toggleTheme, accent, setAccent } = useDashTheme()
  const isCustom = accent.startsWith('custom:')
  const customHex = isCustom ? accent.slice(7) : '#ff6b6b'
  return (
    <section className="rounded-2xl border border-d-border bg-d-med/50 p-4" aria-label={tr('tp.section')}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-d-text3"><Palette className="size-3.5" />{tr('tp.accent')}</h2>
        <button type="button" onClick={(e) => toggleTheme(e.clientX, e.clientY)} aria-label={tr('tp.toggle')}
          className="grid size-7 place-items-center rounded-lg border border-d-border text-d-text2 transition hover:border-d-accent hover:text-d-accent">
          {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => (
          <button key={a.name} type="button" title={tr(a.label)} aria-label={tr(a.label)} aria-pressed={accent === a.name} onClick={() => setAccent(a.name)}
            className={`grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-transparent transition hover:scale-110 ${accent === a.name ? 'ring-2 ring-d-text' : 'ring-1 ring-d-border'}`}
            style={{ background: a.c }}>
            {accent === a.name && <Check className="size-3.5 text-black/70" />}
          </button>
        ))}
        <CustomColor active={isCustom} hex={customHex} onCommit={(v) => setAccent(`custom:${v}`)} />
      </div>
    </section>
  )
}

/** 任意色ピッカー(shadcn 風 Popover)。選択中は見た目だけ変え、閉じたときに1回だけテーマへ反映する */
export function CustomColor({ active, hex, onCommit, size = 'size-7' }: { active: boolean; hex: string; onCommit: (hex: string) => void; size?: string }) {
  const { t: tr } = useTranslation()
  const [color, setColorState] = useState(hex)
  const raf = useRef(0)
  const [fmt, setFmt] = useState<'hex' | 'rgb'>('hex')
  // リアルタイム反映。ドラッグ中は1フレームに1回へ間引く
  const setColor = (c: string) => {
    setColorState(c)
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => onCommit(c))
  }
  return (
    <Popover.Root onOpenChange={(o) => { if (o) setColorState(hex) }}>
      <Popover.Trigger title={tr('tp.fav')} aria-label={tr('tp.fav')}
        className={`relative grid ${size} cursor-pointer place-items-center overflow-hidden rounded-full transition hover:scale-110 ${active ? 'ring-2 ring-d-text' : 'ring-1 ring-d-border'}`}
        style={{ background: active ? hex : 'conic-gradient(#f43f5e,#f59e0b,#84cc16,#06b6d4,#8b5cf6,#f43f5e)' }}>
        {active && <Check className="size-3.5 text-black/70" />}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="pointer-events-auto z-[3000]">
          <Popover.Popup data-keep-dialog className="pointer-events-auto dash-vars w-72 rounded-xl border border-d-border bg-d-med p-3 shadow-2xl outline-none transition-all data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <HexAlphaColorPicker color={color} onChange={setColor} className="cp-shadcn" />
            <div className="mt-3 flex items-center gap-2">
              {'EyeDropper' in window && (
                <button type="button" aria-label={tr('tp.eye')} title={tr('tp.eyeT')}
                  onClick={async () => { try { const r = await new (window as any).EyeDropper().open(); setColor(r.sRGBHex) } catch { /* cancel */ } }}
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-d-border bg-d-bg text-d-text2">
                  <Pipette className="size-4" />
                </button>
              )}
              <SimpleSelect value={fmt} onChange={(v) => setFmt(v as 'hex' | 'rgb')} options={[{ value: 'hex', label: 'Hex' }, { value: 'rgb', label: 'RGB' }]} className="h-9 w-20 shrink-0" />
              {fmt === 'hex'
                ? <HexColorInput color={color} onChange={setColor} prefixed alpha
                    className="h-9 w-full min-w-0 rounded-lg border border-d-border bg-d-bg px-3 font-mono text-sm uppercase text-d-text outline-none focus:border-d-accent" />
                : <input readOnly value={rgbText(color)} className="h-9 w-full min-w-0 rounded-lg border border-d-border bg-d-bg px-3 font-mono text-sm text-d-text outline-none" />}
            </div>
            <div className="mt-3 flex gap-2">
              {['#000000', '#6b7280', '#d1d5db', '#93c5fd', '#818cf8', '#ec4899'].map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setColor(c)}
                  className={`size-6 cursor-pointer rounded-md border ${color.toLowerCase() === c ? 'border-d-text' : 'border-d-border'}`} style={{ background: c }} />
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function rgbText(h: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const a = h.length > 7 ? +(parseInt(h.slice(7, 9), 16) / 255).toFixed(2) : 1
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`
}
