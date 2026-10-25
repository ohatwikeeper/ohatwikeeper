import type { CSSProperties, ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

// /admin-new 共通の小さな部品。色は --d-* トークンのみ、数字は tabular-nums、太字は 500 まで。

export const rise = (i: number): CSSProperties => ({ '--i': i } as CSSProperties)

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
export const TONE_TEXT: Record<Tone, string> = { neutral: 'text-d-text', accent: 'text-d-accent', success: 'text-d-success', warning: 'text-d-warning', danger: 'text-d-danger' }
const TONE_DOT: Record<Tone, string> = { neutral: 'bg-d-text3', accent: 'bg-d-accent', success: 'bg-d-success', warning: 'bg-d-warning', danger: 'bg-d-danger' }

export function Dot({ tone = 'neutral', pulse }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse && <span className={`absolute inset-0 animate-ping rounded-full opacity-50 motion-reduce:hidden ${TONE_DOT[tone]}`} />}
      <span className={`relative size-2 rounded-full ${TONE_DOT[tone]}`} />
    </span>
  )
}

/** ページ見出し(h1 はシェルのヘッダーではなくここに 1 つだけ置く) */
export function PageHead({ title, desc, children }: { title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <div className="an-rise mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-medium tracking-tight text-d-text sm:text-[1.7rem]">{title}</h1>
        {desc && <p className="mt-1 text-pretty text-sm text-d-text2">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/** 枠線の代わりに多層シャドウで浮かせたパネル。角丸は内側(rounded-lg)+余白で同心になる */
export function Panel({ title, desc, action, children, className = '', i = 0, flush }: {
  title?: ReactNode; desc?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; i?: number; flush?: boolean
}) {
  return (
    <section style={rise(i)} className={`an-rise rounded-2xl bg-d-card shadow-[0_0_0_1px_rgb(255_255_255/.06),0_1px_2px_rgb(0_0_0/.3),0_8px_24px_-12px_rgb(0_0_0/.5)] ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-1">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-medium text-d-text">{title}</h2>}
            {desc && <p className="truncate text-xs text-d-text3">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? 'pb-1' : 'p-4 pt-3'}>{children}</div>
    </section>
  )
}

export function Empty({ icon: Icon = Inbox, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-d-text3">
      <Icon className="size-7" strokeWidth={1.5} />
      <p className="text-sm">{children}</p>
    </div>
  )
}

/** 数値の増減。上昇が良いか悪いかは good で決める(エラー数は上昇が悪い) */
export function Delta({ now, prev, good = 'up' }: { now: number; prev: number; good?: 'up' | 'down' }) {
  if (!prev) return <span className="text-xs text-d-text3">{now ? '新規' : '変化なし'}</span>
  const d = Math.round(((now - prev) / prev) * 100)
  if (d === 0) return <span className="text-xs text-d-text3">±0%</span>
  const ok = (d > 0) === (good === 'up')
  return <span className={`text-xs tabular-nums ${ok ? 'text-d-success' : 'text-d-danger'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}%</span>
}

/** 絞り込み用のピル(複数選択・切替) */
export function Pill({ on, onClick, children, role }: { on: boolean; onClick: () => void; children: ReactNode; role?: string }) {
  return (
    <button type="button" role={role} aria-pressed={role ? undefined : on} aria-selected={role ? on : undefined} onClick={onClick}
      className={`an-press relative inline-flex min-h-8 items-center rounded-full px-3 text-xs before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] ${on ? 'bg-d-accent/15 text-d-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--d-accent)_55%,transparent)]' : 'bg-d-light/60 text-d-text2 hover:bg-d-light hover:text-d-text'}`}>
      {children}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md bg-d-light px-1.5 py-0.5 font-mono text-[10px] text-d-text2 shadow-[inset_0_-1px_0_rgb(255_255_255/.08)]">{children}</kbd>
}
