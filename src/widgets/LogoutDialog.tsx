import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog'
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title={tr('cn.loTitle')} description={tr('cn.loDesc')} className="dash-vars">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>{tr('lg.cancel')}</Button>
          <Button onClick={() => { window.location.href = CONFIG.EXTERNAL.LOGOUT }}>{tr('nb.logout')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
