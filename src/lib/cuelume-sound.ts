import { play, type SoundName } from 'cuelume'

// ボタン・主要リンクの種類ごとに異なる音を自動適用する。
// data-cuelume-* 属性を個別に付与する運用は取らず、クリック可能要素を
// セレクタで一括検出してplay()を直接呼ぶ(将来追加される要素にも自動対応)。
const CLICKABLE_SELECTOR = 'button, a.menu-item, a.btn, [role="button"]'
// クリックしても音を鳴らしたくない要素(送信中に何度も鳴る、無効化中など)
const SKIP_SELECTOR = '[data-cuelume-skip], [disabled], .no-sound'

interface SoundRule {
  match: string
  hover: SoundName | null
  down: SoundName | null
  up: SoundName | null
}

// 要素の役割ごとに音のセットを出し分ける。上から順にマッチしたものを使う。
// hoverは鳴らしすぎるとうるさいため、重要な操作(トグル・主要アクション)のみに絞る。
const SOUND_RULES: SoundRule[] = [
  // 表示切替トグルはホバー音が煩わしいので鳴らさない(クリック音のみ残す)
  { match: '.view-toggle-btn', hover: null, down: 'toggle', up: null },
  { match: '.menu-section-toggle', hover: null, down: null, up: null },
  { match: '.mobile-menu-button', hover: null, down: 'toggle', up: null },
  { match: '[aria-expanded], [aria-pressed], .toggle', hover: 'droplet', down: 'toggle', up: null },
  { match: '.btn-danger, .btn-danger-soft', hover: null, down: 'press', up: 'error' },
  { match: '.btn-primary, button[type="submit"]', hover: null, down: 'pulse', up: 'success' },
  { match: '[class*="copy"]', hover: null, down: 'tick', up: 'sparkle' },
  { match: 'a', hover: null, down: null, up: 'page' },
]
const DEFAULT_SOUNDS: SoundRule = { match: '', hover: null, down: 'press', up: 'release' }

function soundsFor(el: Element): SoundRule {
  for (const rule of SOUND_RULES) {
    if (el.matches(rule.match) || el.closest(rule.match)) return rule
  }
  return DEFAULT_SOUNDS
}

const HOVER_GAP_MS = 150
let lastHoverAt = -Infinity
let bound = false

export function bindGlobalClickSounds() {
  if (bound) return
  bound = true

  document.addEventListener('pointerenter', (e) => {
    if ((e as PointerEvent).pointerType !== 'mouse') return
    const el = (e.target as Element).closest?.(CLICKABLE_SELECTOR)
    if (!el || el.closest(SKIP_SELECTOR)) return
    const now = performance.now()
    if (now - lastHoverAt < HOVER_GAP_MS) return
    lastHoverAt = now
    const sound = soundsFor(el).hover
    if (sound) play(sound, { volume: 0.5 })
  }, true)

  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest?.(CLICKABLE_SELECTOR)
    if (!el || el.closest(SKIP_SELECTOR)) return
    const sound = soundsFor(el).down
    if (sound) play(sound)
  }, true)

  document.addEventListener('pointerup', (e) => {
    const el = (e.target as Element).closest?.(CLICKABLE_SELECTOR)
    if (!el || el.closest(SKIP_SELECTOR)) return
    const sound = soundsFor(el).up
    if (sound) play(sound)
  }, true)
}
