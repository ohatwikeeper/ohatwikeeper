import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import fontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url'

// Windows は国旗の絵文字を持たず「US」のような2文字になる。国旗だけのフォントを自前で配り、足りない環境でだけ読み込む
polyfillCountryFlagEmojis('Twemoji Country Flags', fontUrl)

export function Flag({ emoji, className }: { emoji?: string; className?: string }) {
  if (!emoji) return null
  return <span aria-hidden className={className} style={{ fontFamily: '"Twemoji Country Flags", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>{emoji}</span>
}
