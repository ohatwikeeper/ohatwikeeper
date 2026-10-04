import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import { Dialog as ArcDialog, DialogContent } from '@/components/arc/dialog/dialog'

interface Props {
  open: boolean
  onClose: () => void
  /** 見出し(アイコンclass + 文言) */
  title?: { icon: string; text: string }
  /** 見出しの右にボタンを置かず、枠なしで中身だけ出す(画像拡大用) */
  bare?: boolean
  /** 画面右からスライドインするサイドパネルとして表示 */
  side?: boolean
  closeOnBackdrop?: boolean
  className?: string
  children: React.ReactNode
}

/** 旧 dashboard.php の .modal-overlay / .modal-content の見た目 */
export default function DModal(props: Props) {
  const { open, onClose, title, side, bare, closeOnBackdrop = true, className, children } = props
  // 標準モーダルは Arc Dialog。サイドパネルと画像拡大(bare)は専用レイアウトのため従来実装。
  if (side || bare) return <PlainModal {...props} />
  return (
    <ArcDialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        title={title?.text ?? ''}
        onPointerDownOutside={(e) => { if (!closeOnBackdrop || (e.target as Element)?.closest?.('[data-keep-dialog]')) e.preventDefault() }}
        onInteractOutside={(e) => { if ((e.target as Element)?.closest?.('[data-keep-dialog]')) e.preventDefault() }}
        className={cn('dash-vars !w-[min(calc(100vw-2rem),550px)]', className)}
      >
        {children}
      </DialogContent>
    </ArcDialog>
  )
}

function PlainModal({ open, onClose, title, bare, side, closeOnBackdrop = true, className, children }: Props) {
  const { t: tr } = useTranslation()
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o, details) => {
        if (o) return
        if (!closeOnBackdrop && details?.reason === 'outside-press') return
        onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dash-vars fixed inset-0 z-[1000] bg-black/75 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            side
              ? 'dash-vars fixed inset-y-0 right-0 z-[1001] flex w-[440px] max-w-full flex-col overflow-y-auto border-l border-d-border bg-d-med p-6 pt-8 text-d-text shadow-2xl outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full'
              : 'dash-vars fixed left-1/2 top-1/2 z-[1001] max-h-[92vh] w-[550px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto text-d-text outline-none transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            !side && (bare ? 'w-auto' : 'rounded-2xl border border-d-border bg-d-med p-8'),
            className,
          )}
        >
          <Dialog.Close
            aria-label={tr('aw.close')}
            className="absolute right-4 top-4 z-10 border-none bg-transparent text-[1.75rem] leading-none text-d-text3 hover:text-d-text"
          >
            &times;
          </Dialog.Close>
          {title && (
            <Dialog.Title className="mt-0 flex items-center gap-3 text-2xl font-bold">
              <i className={`bx ${title.icon}`} />
              {title.text}
            </Dialog.Title>
          )}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
