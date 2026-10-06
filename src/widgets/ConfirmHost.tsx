import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmPill } from '@/components/ui/confirm-pill'
import { setConfirmHandler, type ConfirmOptions } from '@/lib/confirm'

// 確認は大きなモーダルではなく、ぼかし背景の上に出る小さなピル(質問+ボタンのみ)
export default function ConfirmHost({ children }: { children: ReactNode }) {
  const [opt, setOpt] = useState<ConfirmOptions | null>(null)
  const done = useRef<((ok: boolean) => void) | null>(null)

  useEffect(() => {
    setConfirmHandler((o, d) => { done.current?.(false); done.current = d; setOpt(o) })
    return () => setConfirmHandler(null)
  }, [])

  const close = (ok: boolean) => { done.current?.(ok); done.current = null; setOpt(null) }

  return (
    <>
      {children}
      <ConfirmPill open={!!opt} title={opt?.title ?? ''} confirmLabel={opt?.confirmLabel} destructive={opt?.destructive} onCancel={() => close(false)} onConfirm={() => close(true)} />
    </>
  )
}
