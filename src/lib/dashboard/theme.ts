import { useEffect, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { apiGet, apiSend } from '@/lib/dashboard/api'
import { loadSession } from '@/lib/session'

export type DashTheme = 'dark' | 'light'
const TKEY = 'ohatwi-dash-theme'
const AKEY = 'ohatwi-dash-accent'

export interface Accent { name: string; /** 翻訳キー */ label: string; c: string; h: string }
/** 選べるアクセントカラー。先頭 'default' が既定(未選択=CSS のデフォルト値を使う) */
export const ACCENTS: Accent[] = [
  { name: 'default', label: 'ac.default', c: '#6dcbf7', h: '#8fdaf9' },
  { name: 'emerald', label: 'ac.emerald', c: '#34d399', h: '#6ee7b7' },
  { name: 'sky', label: 'ac.sky', c: '#4f9cff', h: '#7db4ff' },
  { name: 'violet', label: 'ac.violet', c: '#a78bfa', h: '#c4b5fd' },
  { name: 'pink', label: 'ac.pink', c: '#f472b6', h: '#f9a8d4' },
  { name: 'orange', label: 'ac.orange', c: '#fb923c', h: '#fdba74' },
]

/** 任意色(#rrggbb)から、ホバー用に少し明るくした色も作る */
export function customAccent(hex: string): Accent | null {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) return null
  const h = '#' + [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * 1.15 + 12)).toString(16).padStart(2, '0')).join('') + hex.slice(7)
  return { name: `custom:${hex}`, label: 'ac.custom', c: hex, h }
}

export type Motion = 'on' | 'off'
/** font=文字サイズ(%) / radius=角丸(px)。標準は 100% / 10px */
export interface UiSettings { theme: DashTheme; accent: string; font: number; radius: number; motion: Motion }
export const DEFAULTS: UiSettings = { theme: 'dark', accent: 'default', font: 100, radius: 10, motion: 'on' }
const SKEY = 'ohatwi-ui-settings'

const clean = (b: Partial<UiSettings> | null | undefined): Partial<UiSettings> => {
  const o: Partial<UiSettings> = {}
  if (b?.theme === 'dark' || b?.theme === 'light') o.theme = b.theme
  if (typeof b?.accent === 'string') o.accent = b.accent
  if (Number.isInteger(b?.font) && b!.font! >= 80 && b!.font! <= 130) o.font = b!.font
  if (Number.isInteger(b?.radius) && b!.radius! >= 0 && b!.radius! <= 24) o.radius = b!.radius
  if (b?.motion === 'on' || b?.motion === 'off') o.motion = b.motion
  return o
}

const readLocal = (): UiSettings => {
  const s = { ...DEFAULTS }
  try {
    const j = localStorage.getItem(SKEY)
    if (j) Object.assign(s, clean(JSON.parse(j)))
    else { // 旧キーからの移行
      if (localStorage.getItem(TKEY) === 'light') s.theme = 'light'
      s.accent = localStorage.getItem(AKEY) ?? s.accent
    }
  } catch { /* 読めなければ既定値 */ }
  return s
}

let state: UiSettings = readLocal()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

function apply(s: UiSettings) {
  const root = document.documentElement
  root.classList.toggle('dash-light', s.theme === 'light')
  root.classList.toggle('dash-reduce-motion', s.motion === 'off')
  const preset = s.accent.startsWith('custom:') ? customAccent(s.accent.slice(7)) : ACCENTS.find(a => a.name === s.accent)
  // 'default'(既定)は CSS 側のデフォルト値に任せ、ユーザー変数は消す
  if (!preset || preset.name === 'default') { root.style.removeProperty('--d-accent-user'); root.style.removeProperty('--d-accent-h-user') }
  else { root.style.setProperty('--d-accent-user', preset.c); root.style.setProperty('--d-accent-h-user', preset.h) }
  const set = (k: string, v: string) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k))
  set('font-size', s.font === 100 ? '' : `${s.font}%`)
  set('--radius', s.radius === DEFAULTS.radius ? '' : `${s.radius / 16}rem`)
}
if (typeof document !== 'undefined') apply(state)

let loggedIn = false
let saveTimer: ReturnType<typeof setTimeout> | undefined
function commit(next: UiSettings, persist: boolean) {
  state = next
  apply(next)
  try { localStorage.setItem(SKEY, JSON.stringify(next)) } catch { /* 保存できなくても表示は変わる */ }
  listeners.forEach(l => l())
  if (persist && loggedIn) {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { apiSend('ui-settings', 'POST', state).catch(() => {}) }, 600)
  }
}

let synced = false
/** ログイン中ならDBの設定を取り込み(端末のローカル値より優先)、DBが空なら現在値を保存する */
function syncFromDb() {
  if (synced) return
  synced = true
  loadSession().then(s => {
    if (!s.logged_in) return
    loggedIn = true
    return apiGet<{ settings: Partial<UiSettings> }>('ui-settings').then(r => {
      const db = clean(r.settings)
      if (Object.keys(db).length) commit({ ...state, ...db }, false)
      else apiSend('ui-settings', 'POST', state).catch(() => {})
    })
  }).catch(() => { synced = false })
}

/** 円形 View Transition 付きでテーマを切り替える */
function toggleTheme(x?: number, y?: number) {
  const next: DashTheme = state.theme === 'dark' ? 'light' : 'dark'
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce || x === undefined || y === undefined) { commit({ ...state, theme: next }, true); return }
  const root = document.documentElement
  root.style.setProperty('--vt-x', `${(x / window.innerWidth) * 100}%`)
  root.style.setProperty('--vt-y', `${(y / window.innerHeight) * 100}%`)
  doc.startViewTransition(() => { flushSync(() => commit({ ...state, theme: next }, true)) })
}

/** ダッシュボードのUI設定(DBとブラウザ間で共有)。テーマは account.lapius7.com と同じ円形 View Transition で切り替える */
export function useDashTheme() {
  const settings = useSyncExternalStore(subscribe, () => state)
  useEffect(() => { syncFromDb() }, [])
  const set = <K extends keyof UiSettings>(k: K, v: UiSettings[K]) => commit({ ...state, [k]: v }, true)
  const reset = () => commit({ ...DEFAULTS }, true)
  return { settings, theme: settings.theme, toggleTheme, accent: settings.accent, setAccent: (n: string) => set('accent', n), set, reset }
}
