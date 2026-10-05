import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/shadcn-alert-dialog'
import { CONFIG } from '@/lib/config'

const EVT = 'ohatwi:logout'
export const askLogout = () => window.dispatchEvent(new Event(EVT))

/** ログアウト前の確認ダイアログ(ヘッダーのボタン/コマンドパレットから askLogout() で開く) */
export function LogoutDialog() {
  const { t: tr } = useTranslation()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener(EVT, h)
    return () => window.removeEventListener(EVT, h)
  }, [])
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr('cn.loTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{tr('cn.loDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tr('lg.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => { window.location.href = CONFIG.EXTERNAL.LOGOUT }}>{tr('nb.logout')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
