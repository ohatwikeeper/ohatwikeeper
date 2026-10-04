import { useEffect, useSyncExternalStore } from 'react'

// ページ側からパンくずのラベルを上書きする(URL から名前を引けない動的ページ用)
export type Crumb = { label: string; to?: string }
let cur: Crumb[] | null = null
const subs = new Set<() => void>()
const set = (v: Crumb[] | null) => { cur = v; subs.forEach((f) => f()) }

export function useCrumbs(): Crumb[] | null {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => cur)
}
/** ページから呼ぶ。アンマウントで解除。key が変わったら更新 */
export function useSetCrumbs(crumbs: Crumb[], key: string) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { set(crumbs); return () => set(null) }, [key])
}

// URL セグメント単位の表示名上書き(例: 公開UUID → 「表示名 @handle」)
let labels: Record<string, string> = {}
const lsubs = new Set<() => void>()
export function useCrumbLabels(): Record<string, string> {
  return useSyncExternalStore((f) => { lsubs.add(f); return () => { lsubs.delete(f) } }, () => labels)
}
export function useSetCrumbLabel(seg: string | undefined, label: string | undefined) {
  useEffect(() => {
    if (!seg || !label) return
    labels = { ...labels, [seg]: label }; lsubs.forEach((f) => f())
    return () => { const { [seg]: _, ...rest } = labels; labels = rest; lsubs.forEach((f) => f()) }
  }, [seg, label])
}
