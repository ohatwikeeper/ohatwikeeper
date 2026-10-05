import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

// 普段は丸いアイコンを重ねた小さなチップにし、ホバー/キーボード操作/ポップアップ表示中は中身を展開する(CSS のみ・状態なし)
// Tailwind が検出できるよう、クラス名は組み立てずにそのまま書くこと
const CHIP =
  'absolute right-3 top-1/2 flex -translate-y-1/2 items-center opacity-100 transition-opacity duration-[350ms] ease-[cubic-bezier(.45,0,.25,1)] ' +
  'group-hover/ic:pointer-events-none group-hover/ic:opacity-0 group-data-[pin=true]/ic:pointer-events-none group-data-[pin=true]/ic:opacity-0 ' +
  'group-has-[:focus-visible]/ic:pointer-events-none group-has-[:focus-visible]/ic:opacity-0 ' +
  'group-has-[[data-popup-open]]/ic:pointer-events-none group-has-[[data-popup-open]]/ic:opacity-0 ' +
  '[@media(hover:none)_and_(pointer:coarse)]:pointer-events-none [@media(hover:none)_and_(pointer:coarse)]:opacity-0'
const FULL =
  'pointer-events-none absolute right-0 top-0 flex items-center opacity-0 [filter:blur(8px)] [&>*]:translate-x-16 [&>*]:scale-50 [&>*]:transition-transform [&>*]:duration-[350ms] [&>*]:ease-[cubic-bezier(.45,0,.25,1)] [clip-path:inset(-6px_-6px_-6px_100%)] transition-[clip-path,opacity,filter] duration-[350ms] ease-[cubic-bezier(.45,0,.25,1)] ' +
  'group-hover/ic:pointer-events-auto group-hover/ic:opacity-100 group-data-[pin=true]/ic:pointer-events-auto group-data-[pin=true]/ic:opacity-100 group-data-[pin=true]/ic:[filter:blur(0)] group-data-[pin=true]/ic:[clip-path:inset(-6px)] group-data-[pin=true]/ic:[&>*]:translate-x-0 group-data-[pin=true]/ic:[&>*]:scale-100 group-hover/ic:[&>*]:translate-x-0 group-hover/ic:[&>*]:scale-100 group-hover/ic:[filter:blur(0)] group-hover/ic:[clip-path:inset(-6px)] ' +
  'group-has-[:focus-visible]/ic:pointer-events-auto group-has-[:focus-visible]/ic:opacity-100 group-has-[:focus-visible]/ic:[&>*]:translate-x-0 group-has-[:focus-visible]/ic:[&>*]:scale-100 group-has-[:focus-visible]/ic:[filter:blur(0)] group-has-[:focus-visible]/ic:[clip-path:inset(-6px)] ' +
  'group-has-[[data-popup-open]]/ic:pointer-events-auto group-has-[[data-popup-open]]/ic:opacity-100 group-has-[[data-popup-open]]/ic:[&>*]:translate-x-0 group-has-[[data-popup-open]]/ic:[&>*]:scale-100 group-has-[[data-popup-open]]/ic:[filter:blur(0)] group-has-[[data-popup-open]]/ic:[clip-path:inset(-6px)] ' +
  '[@media(hover:none)_and_(pointer:coarse)]:pointer-events-auto [@media(hover:none)_and_(pointer:coarse)]:opacity-100 [@media(hover:none)_and_(pointer:coarse)]:[&>*]:translate-x-0 [@media(hover:none)_and_(pointer:coarse)]:[&>*]:scale-100 [@media(hover:none)_and_(pointer:coarse)]:[filter:blur(0)] [@media(hover:none)_and_(pointer:coarse)]:[clip-path:inset(-6px)]'

export default function IconStack({ chips, total, children }: { chips: LucideIcon[]; total?: number; children: React.ReactNode }) {
  // クリック直後(テーマ切替の View Transition 中など)にホバーが外れても閉じないよう、少しだけ展開を固定する
  const [pin, setPin] = useState(false)
  useEffect(() => {
    if (!pin) return
    const id = window.setTimeout(() => setPin(false), 1600)
    return () => window.clearTimeout(id)
  }, [pin])
  return (
    <div data-pin={pin || undefined} onClickCapture={() => setPin(true)} className="group/ic relative h-9 w-[224px] max-w-full">
      <div className={CHIP}>
        {chips.map((I, k) => (
          <span key={k} className={`flex size-8 items-center justify-center rounded-full border-2 border-background bg-d-light text-d-text2 ${k ? '-ml-3' : ''}`}><I className="size-4" /></span>
        ))}
        <span className="ml-1.5 text-xs font-medium text-d-text3">+{Math.max(0, (total ?? chips.length + 3) - chips.length)}</span>
      </div>
      <div className={FULL}>{children}</div>
    </div>
  )
}
