/** コマンドパレットからダッシュボードの操作を呼び出すための簡易イベントバス */
export type DashCommand = 'focus-add' | 'bulk' | 'zip' | 'update-month' | 'update-all' | 'tour' | 'toggle-theme' | 'copy-share'
const EVT = 'ohatwi:command'

export const sendCommand = (cmd: DashCommand) => window.dispatchEvent(new CustomEvent(EVT, { detail: cmd }))
export const onCommand = (fn: (cmd: DashCommand) => void) => {
  const h = (e: Event) => fn((e as CustomEvent<DashCommand>).detail)
  window.addEventListener(EVT, h)
  return () => window.removeEventListener(EVT, h)
}
