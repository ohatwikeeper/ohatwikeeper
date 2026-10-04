// confirm() の代わりに await confirmDialog('…') で呼べる確認ダイアログ。ConfirmHost が登録する。
export type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; destructive?: boolean }
type Handler = (o: ConfirmOptions, done: (ok: boolean) => void) => void

let handler: Handler | null = null
export const setConfirmHandler = (h: Handler | null) => { handler = h }

export const confirmDialog = (o: string | ConfirmOptions): Promise<boolean> => {
  const opt = typeof o === 'string' ? { title: o } : o
  return new Promise((resolve) => {
    if (!handler) return resolve(window.confirm(opt.title))
    handler(opt, resolve)
  })
}
