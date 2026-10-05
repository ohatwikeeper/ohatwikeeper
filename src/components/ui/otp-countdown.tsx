import { useEffect, useState } from 'react'

/** 有効期限までの残り時間(mm:ss)をリアルタイム表示。expiresAt は epoch ms */
export function OtpCountdown({ expiresAt, total = 600 }: { expiresAt: number; total?: number }) {
  const calc = () => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    setLeft(calc())
    const id = window.setInterval(() => setLeft(calc()), 250)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])
  const low = left <= 60
  return (
    <div className="w-full" aria-live="off">
      <div className={`text-center text-xs tabular-nums transition-colors ${low ? 'text-red-400' : 'text-d-text3'}`}>
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </div>
      <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-foreground/10">
        <div className={`h-full rounded-full transition-[width] duration-300 ease-linear ${low ? 'bg-red-400' : 'bg-foreground/40'}`} style={{ width: `${(left / total) * 100}%` }} />
      </div>
    </div>
  )
}
