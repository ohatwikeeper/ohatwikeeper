import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { setConfirmHandler, type ConfirmOptions } from '@/lib/confirm'

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
      <ConfirmDialog
        open={!!opt}
        onOpenChange={(o) => { if (!o) close(false) }}
        title={opt?.title ?? ''}
        description={opt?.description}
        confirmLabel={opt?.confirmLabel}
        destructive={opt?.destructive}
        onConfirm={() => close(true)}
      />
    </>
  )
}
