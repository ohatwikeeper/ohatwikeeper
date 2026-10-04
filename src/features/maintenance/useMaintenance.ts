import { useEffect, useState } from 'react'

export interface MaintenanceInfo { scope: string; message: string | null; ends_at: string | null }
export interface MaintenanceState { global: MaintenanceInfo | null; pages: MaintenanceInfo[]; is_admin: boolean }

/** 現在有効なメンテナンス状態を取得し、1分ごとに更新する。初回取得前は undefined、取得失敗時は null(=メンテなし扱い)。 */
export function useMaintenance(): MaintenanceState | null | undefined {
  const [state, setState] = useState<MaintenanceState | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/app-api/maintenance', { credentials: 'include', cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive) setState((prev) => d ?? (prev === undefined ? null : prev)) })
        .catch(() => { if (alive) setState((prev) => (prev === undefined ? null : prev)) })
    load()
    const t = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return state
}

/** path に適用されるメンテナンス(サイト全体 > 個別ページ前方一致)を返す */
export function matchMaintenance(s: MaintenanceState | null | undefined, path: string): MaintenanceInfo | null {
  if (!s) return null
  if (s.global) return s.global
  return s.pages.find((p) => path === p.scope || path.startsWith(p.scope.replace(/\/$/, '') + '/')) ?? null
}
