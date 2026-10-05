import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog"
import { HoldToDeleteButton } from "@/components/ui/hold-to-delete-button"
import { Button } from "@/components/ui/button"

/** 確認ダイアログ。confirm() の代わりに使う(Arc Dialog) */
function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, destructive = true, onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const { t: tr } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} className="dash-vars">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{tr('lg.cancel')}</Button>
          {destructive
            ? <HoldToDeleteButton className="inline-flex h-8 items-center rounded-md bg-destructive px-3 text-sm font-medium text-white" label={tr('rc.delHold')} onDelete={async () => { await onConfirm(); onOpenChange(false) }}>{confirmLabel ?? tr('cm.delete')}</HoldToDeleteButton>
            : <Button size="sm" onClick={async () => { await onConfirm(); onOpenChange(false) }}>{confirmLabel ?? tr('cm.delete')}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
