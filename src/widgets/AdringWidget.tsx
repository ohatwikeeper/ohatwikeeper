import { useEffect, useRef } from 'react'

// compact variantは閉じるボタンを生成しない仕様(widget-v1.js未対応)のため、
// 閉じる・報告機能が標準搭載されたcorner(anchored)variantを使う。
// cornerはウィジェット自身がposition:fixed; right; bottomを内部付与するため、
// ActionWidgetの右下FABと反対側に出すにはleft側へ上書きするCSSを注入する。
export default function AdringWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const style = document.createElement('style')
    style.textContent = `
      [data-adring-widget="corner"] {
        left: 1rem !important;
        right: auto !important;
        z-index: 890 !important;
      }
    `
    const script = document.createElement('script')
    script.src = 'https://ar-cdn.net/widget/v1.js'
    script.async = true
    script.dataset.siteId = '659d937d-cb4a-4579-94ab-016849d41139'
    script.dataset.variant = 'corner'
    container.append(style, script)
    return () => container.replaceChildren()
  }, [])

  return <div ref={containerRef} />
}
