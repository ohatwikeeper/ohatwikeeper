import { useEffect, useSyncExternalStore } from 'react'
import { csrfHeaders } from '@/lib/dashboard/api'

/** 初回セットアップ+必須設定(X連携・メール)の状態。サーバー保持なので別ページ・再訪でも続きへ戻せる */
export const STEPS = ['lang', 'terms', 'x', 'email', 'public', 'profile', 'theme', 'notify', 'done'] as const
export type Step = (typeof STEPS)[number]
interface State { ready: boolean; active: boolean; step: Step; needX: boolean; needEmail: boolean; needTerms: boolean; xUser: string | null; xIcon: string | null; name: string; isPublic: boolean; email: string | null }

let state: State = { ready: false, active: false, step: 'lang', needX: false, needEmail: false, needTerms: false, xUser: null, xIcon: null, name: '', isPublic: false, email: null }
const subs = new Set<() => void>()
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()) }

/** 最新状態を取得(必須設定が未完了の間は遷移ごとに呼ぶ) */
export function refreshOnboard() {
  return fetch('/app-api/onboard/state', { credentials: 'include' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => set({
      ready: true, active: !!d?.active, step: STEPS.includes(d?.step) ? d.step : 'lang',
      needX: !!d?.needs?.x, needEmail: !!d?.needs?.email, needTerms: !!d?.needs?.terms, xUser: d?.x_username ?? null,
      xIcon: d?.x_icon ?? null, name: d?.display_name ?? '', isPublic: !!d?.is_public, email: d?.email ?? null,
    }))
    .catch(() => set({ ready: true }))
}

export const requiredStep = (s: State): Step | null => (s.needTerms ? 'terms' : s.needX ? 'x' : s.needEmail ? 'email' : null)

export function useOnboard(enabled: boolean) {
  useEffect(() => { if (enabled) void refreshOnboard() }, [enabled])
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)
}

export function saveStep(step: Step) {
  set({ step })
  void fetch('/app-api/onboard/step', { method: 'PUT', credentials: 'include', headers: csrfHeaders(), body: JSON.stringify({ step }) })
}

export async function finishOnboard() {
  await fetch('/app-api/onboard/finish', { method: 'POST', credentials: 'include', headers: csrfHeaders() })
  set({ active: false, step: 'done' })
}

const post = (path: string, body?: unknown) => fetch(`/app-api/onboard/${path}`, { method: 'POST', credentials: 'include', headers: csrfHeaders(), body: body ? JSON.stringify(body) : undefined })
export async function agreeTerms() { await post('terms'); set({ needTerms: false }) }
export async function setPublic(v: boolean) { set({ isPublic: v }); await post('public', { is_public: v }) }
