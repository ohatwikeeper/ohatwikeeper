import { useTranslation } from 'react-i18next'
import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { sanitize } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'

const RESERVED = new Set(['home', 'i', 'explore', 'search', 'settings', 'share', 'intent', 'hashtag', 'notifications', 'messages', 'login', 'tos', 'privacy'])

/** プロフィール文。既定は4行に省略＋URLは短縮表示。トグルで全文(URLも完全表示)に切り替える。
 *  URL の短縮はサーバー側(format_profile_bio)で行われ href には完全URLが入るため、
 *  展開時はリンクの表示テキストを href に差し替えて全文を見せる。 */
export default function BioText({ html }: { html: string }) {
  const { t: tr } = useTranslation()
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [needsToggle, setNeedsToggle] = useState(false)
  const clean = sanitize(html)
  const box = useRef<HTMLDivElement>(null)
  // 開閉前後の高さを実測し、Web Animations で補間する(状態遷移中の高さ計算を挟まない)
  const toggle = () => {
    const wrap = box.current
    if (!wrap) return
    const from = wrap.getBoundingClientRect().height
    flushSync(() => setExpanded((v) => !v))
    const to = wrap.getBoundingClientRect().height
    wrap.getAnimations().forEach((x) => x.cancel())
    wrap.animate({ height: [`${from}px`, `${to}px`] }, { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = clean
    el.querySelectorAll<HTMLAnchorElement>('a.bio-link').forEach((a) => {
      if (a.dataset.short === undefined) a.dataset.short = a.textContent ?? ''
      const href = a.getAttribute('href') ?? ''
      // x.com/<handle> 形式のプロフィールURLは元の @メンション表記で表示する
      const mention = href.match(/^https?:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,50})\/?(?:\?[^#]*)?$/i)
      if (mention && !RESERVED.has(mention[1].toLowerCase())) { a.textContent = '@' + mention[1]; return }
      a.textContent = expanded ? href.replace(/([?&])utm_source=ohatwikeeper\.com&?/, '$1').replace(/[?&]$/, '') : a.dataset.short
    })
    // 省略状態のときだけ、トグルを出す必要があるか判定する
    if (!expanded) {
      const linkTruncated = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.bio-link'))
        .some((a) => (a.getAttribute('href') ?? '').length > (a.dataset.short ?? '').length)
      const overflow = el.scrollHeight - el.clientHeight > 2
      setNeedsToggle(linkTruncated || overflow)
    }
  }, [clean, expanded])

  if (!clean.trim()) return null

  return (
    <div className="mt-4">
      <div ref={box} className="overflow-hidden">
        <p
          ref={ref}
          className={cn(
            'text-sm leading-relaxed [&_a]:break-all [&_a]:text-d-text2 [&_a]:hover:text-d-text',
            !expanded && 'line-clamp-4',
          )}
        />
      </div>
      {needsToggle && (
        <button
          type="button"
          onClick={toggle}
          className="mt-1 text-xs font-semibold text-d-text transition-colors hover:text-d-text-h"
        >
          {expanded ? tr('cn.bioShort') : tr('cn.bioFull')}
        </button>
      )}
    </div>
  )
}
