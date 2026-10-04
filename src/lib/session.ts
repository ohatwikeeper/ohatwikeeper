import { useEffect, useState } from 'react'
import { setCsrfToken } from '@/lib/dashboard/api'

export interface SessionInfo {
  logged_in: boolean
  public_uuid: string | null
  x_username: string | null
  csrf_token: string
  impersonating?: { admin_id: number; name: string } | null
}

const EMPTY: SessionInfo = { logged_in: false, public_uuid: null, x_username: null, csrf_token: '' }
let cache: Promise<SessionInfo> | null = null
// 解決済みの値。再マウント時に未ログイン(EMPTY)から始めず、未ログイン表示がチラつくのを防ぐ
let resolvedSession: SessionInfo | null = null

/** Rybbit にログインユーザーを紐づける(なりすまし中は計測者を汚さないため識別しない) */
export function reidentifyAnalytics() { if (resolvedSession) identifyAnalytics(resolvedSession) }

/** 未ログインの訪問者に付ける安定した匿名ID(端末ごとに固定。例: visitor_a3f9c2d1) */
function anonVisitorId(): string {
  try {
    let id = localStorage.getItem('ohax-visitor')
    if (!id) {
      id = 'visitor_' + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem('ohax-visitor', id)
    }
    return id
  } catch { return 'visitor_unknown' }
}

function identifyAnalytics(v: SessionInfo) {
  const rb = (window as unknown as { rybbit?: { identify: (id: string, t?: Record<string, unknown>) => void; clearUserId: () => void } }).rybbit
  if (!rb) return
  try {
    if (v.logged_in && v.public_uuid && !v.impersonating) {
      rb.identify(v.public_uuid, {
        username: v.x_username ?? undefined,
        lang: document.documentElement.lang || navigator.language,
      })
    } else {
      rb.identify(anonVisitorId(), { anonymous: true })
    }
  } catch { /* 計測失敗は無視 */ }
}

/** /session_api.php を 1 回だけ取得して共有する */
export function loadSession(force = false): Promise<SessionInfo> {
  if (!cache || force) {
    cache = fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => ({
        logged_in: !!d.logged_in,
        public_uuid: d.public_uuid ?? null,
        x_username: d.x_username ?? null,
        csrf_token: d.csrf_token ?? '',
        impersonating: d.impersonating ?? null,
      }))
      .then(v => { setCsrfToken(v.csrf_token); resolvedSession = v; identifyAnalytics(v); return v })
      .catch(() => EMPTY)
  }
  return cache
}

export function useSession(): SessionInfo & { ready: boolean } {
  const [s, setS] = useState<SessionInfo>(resolvedSession ?? EMPTY)
  const [ready, setReady] = useState(!!resolvedSession)
  useEffect(() => {
    loadSession().then(v => { setS(v); setReady(true) })
  }, [])
  return { ...s, ready }
}

/** moreget.php への POST/GET 呼び出し (CSRF 付き) */
export async function moreget<T = any>(_uuid: string, csrf: string, action: string, data: Record<string, string | number | (string | number)[]> = {}): Promise<T> {
  const fd = new FormData()
  fd.append('action', action)
  fd.append('csrf_token', csrf)
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) v.forEach(x => fd.append(`${k}[]`, String(x)))
    else fd.append(k, String(v))
  }
  const r = await fetch(`/app-api/moreget`, { method: 'POST', body: fd, credentials: 'include', headers: { 'X-CSRF-Token': csrf } })
  return r.json()
}
