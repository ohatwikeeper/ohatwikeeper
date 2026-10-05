import { useEffect, useState } from 'react'

// 全コンポーネントで 1 本の SSE 接続を共有する(同一タブは 1 人として数えられる)
let es: EventSource | null = null
let n: number | null = null
let refs = 0
const subs = new Set<(v: number) => void>()

export function usePresence(): number | null {
  const [v, setV] = useState<number | null>(n)
  useEffect(() => {
    subs.add(setV)
    if (++refs === 1) {
      es = new EventSource('/app-api/presence/stream')
      es.onmessage = (e) => { n = Number(e.data); subs.forEach((f) => f(n as number)) }
    }
    return () => {
      subs.delete(setV)
      if (--refs === 0) { es?.close(); es = null; n = null }
    }
  }, [])
  return v
}
