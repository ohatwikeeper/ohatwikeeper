import { useTranslation } from 'react-i18next'
import { useState, type RefObject } from 'react'
import { toPng } from 'html-to-image'
import { toast } from '@/lib/toast'

// 指定要素を高解像度PNG化し、可能なら端末共有・不可ならダウンロードする。
export default function ShareButton({ targetRef, filename, title }: {
  targetRef: RefObject<HTMLElement | null>
  filename: string
  title: string
}) {
  const [busy, setBusy] = useState(false)
  const { t } = useTranslation()

  const run = async () => {
    const node = targetRef.current
    if (!node || busy) return
    setBusy(true)
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--d-bg').trim() || '#0b0d02'
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: bg })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = filename; a.click()
        toast.success(t('sh.saved'))
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error(t('sh.genFail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={run} disabled={busy} data-cuelume-skip
      className="inline-flex items-center gap-1.5 rounded-full border border-d-border bg-d-med px-3.5 py-2 text-sm font-medium text-d-text2 transition-colors hover:text-d-text disabled:opacity-50">
      <i className={`bx ${busy ? 'bx-loader-alt animate-spin' : 'bx-image-alt'}`} />
      {busy ? t('sh.generating') : t('sh.asImage')}
    </button>
  )
}
