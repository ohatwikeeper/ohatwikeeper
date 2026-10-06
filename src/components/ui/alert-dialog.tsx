import { ConfirmPill } from './confirm-pill'

/** 確認ダイアログ。confirm() の代わりに使う(Arc Dialog) */
function ConfirmDialog({
  open, onOpenChange, title, confirmLabel, destructive = true, onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}) {
  return <ConfirmPill open={open} title={title} confirmLabel={confirmLabel} destructive={destructive}
    onCancel={() => onOpenChange(false)} onConfirm={async () => { await onConfirm(); onOpenChange(false) }} />
}

export { ConfirmDialog }
