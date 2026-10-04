import { useEffect } from 'react'
import { ToastStack, ToastStackProvider, useToastStack } from '@/components/arc/toast-stack/toast-stack'
import { setToastApi } from '@/lib/toast'

function Bridge() {
  const { toast, update, dismiss } = useToastStack()
  useEffect(() => {
    setToastApi({ toast, update, dismiss })
    return () => setToastApi(null)
  }, [toast, update, dismiss])
  return null
}

/** Arc ToastStack を提供し、lib/toast の命令的 API と接続する。 */
export default function ToastHost({ children }: { children: React.ReactNode }) {
  return (
    <ToastStackProvider>
      {children}
      <Bridge />
      <ToastStack position="bottom-left" />
    </ToastStackProvider>
  )
}
