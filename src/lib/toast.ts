import type { ToastStackApi } from '@/components/arc/toast-stack/toast-stack'

// ToastStackProvider 配下の ToastBridge が登録する。どこからでも toast.error(...) で呼べる。
let api: ToastStackApi | null = null
export const setToastApi = (a: ToastStackApi | null) => { api = a }

const show = (type: 'success' | 'error' | 'info' | 'warning') => (title?: string, opt?: string | { description?: string }) =>
  api?.toast({ type, title: title ?? '', description: typeof opt === 'string' ? opt : opt?.description })

export const toast = { success: show('success'), error: show('error'), info: show('info'), warning: show('warning') }
