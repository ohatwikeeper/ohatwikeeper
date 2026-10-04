import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, ApiError, setCsrfToken } from '@/lib/dashboard/api'
import type { DashboardData, RecordItem } from '@/lib/dashboard/types'

// レイアウト間の移動で再マウントされても直前の結果を即座に使い、サイドバーのプロフィールが
// 一瞬消えて再出現する(ガクッとなる)のを防ぐ。再取得は従来どおり裏で行う
let lastData: DashboardData | null = null
let lastError: ApiError | null = null

export function useDashboard() {
  const [data, setDataRaw] = useState<DashboardData | null>(lastData)
  const [error, setErrorRaw] = useState<ApiError | null>(lastError)
  const setData = (d: DashboardData | null) => { lastData = d; setDataRaw(d) }
  const setError = (e: ApiError | null) => { lastError = e; setErrorRaw(e) }

  const reload = useCallback(async () => {
    try {
      const d = await apiGet<DashboardData>('dashboard')
      setCsrfToken(d.csrf_token)
      setData(d)
      setError(null)
    } catch (e) {
      console.error('Dashboard API error:', e)
      setError(e as ApiError)
      setData(null)
    }
  }, [])

  useEffect(() => { reload() }, [reload])
  // メール登録完了など、外部からの状態変化で再取得したいとき用
  useEffect(() => {
    const h = () => { setError(null); void reload() } // 古いエラーで即リダイレクトされないよう先に消す
    window.addEventListener('dashboard:reload', h)
    return () => window.removeEventListener('dashboard:reload', h)
  }, [reload])
  return { data, error, reload }
}

export function useRecords() {
  const [records, setRecords] = useState<RecordItem[] | null>(null)
  const reload = useCallback(async () => {
    const d = await apiGet<{ records: RecordItem[] }>('records?all=1&sort=date&order=desc')
    setRecords(d.records)
  }, [])
  useEffect(() => { reload().catch(() => setRecords([])) }, [reload])
  return { records, reload }
}

/** 一定時間だけ true になる(コピー完了表示など) */
export function useFlash(ms = 1500) {
  const [on, setOn] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trigger = useCallback(() => {
    setOn(true)
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => setOn(false), ms)
  }, [ms])
  useEffect(() => () => { if (t.current) clearTimeout(t.current) }, [])
  return [on, trigger] as const
}
