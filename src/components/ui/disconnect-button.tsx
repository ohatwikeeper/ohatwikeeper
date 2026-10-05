import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

/** Disconnect → (アニメーションで)Confirm → 実行。4秒操作がなければ元に戻る */
export function DisconnectButton({ onConfirm }: { onConfirm: () => void }) {
  const [ask, setAsk] = useState(false)
  useEffect(() => {
    if (!ask) return
    const id = window.setTimeout(() => setAsk(false), 4000)
    return () => window.clearTimeout(id)
  }, [ask])
  return (
    <Button
      variant="destructive" size="sm"
      onClick={() => { if (ask) { setAsk(false); onConfirm() } else setAsk(true) }}
      className={`relative min-w-[5.5rem] overflow-hidden border-red-500/30 transition-[background-color,color,box-shadow] duration-300 ${ask ? 'bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,.5)] hover:bg-red-500' : ''}`}
    >
      <span className={`inline-block transition-all duration-300 ease-out ${ask ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}>Disconnect</span>
      <span aria-hidden={!ask} className={`absolute inset-0 grid place-items-center transition-all duration-300 ease-out ${ask ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>Confirm</span>
    </Button>
  )
}
