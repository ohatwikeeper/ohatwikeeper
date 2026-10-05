import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import DOMPurify from 'dompurify'
import { apiGet, friendlyError } from '@/lib/dashboard/api'
import { copyText, fmt, shortDate } from '@/lib/dashboard/format'
import { useFlash } from '@/lib/dashboard/hooks'
import type { RecordItem } from '@/lib/dashboard/types'
import { HoldToDeleteButton } from '@/components/ui/hold-to-delete-button'
import { dbtn } from '@/components/dashboard-ui/DButton'
import Tip from '@/components/dashboard-ui/Tip'
import Callout from '@/components/dashboard-ui/Callout'

declare global {
  interface Window { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } }
}

interface Props {
  record: RecordItem | null
  index: number
  total: number
  onClose: () => void
  onStep: (delta: number) => void
  onDelete?: (uniqid: string) => void
  onImage: (imageUrl: string, videoUrl: string | null) => void
}

let twLoading: Promise<void> | null = null
export const loadTwitter = () => (twLoading ??= new Promise<void>((res) => {
  if (window.twttr?.widgets) return res()
  const sc = document.createElement('script')
  sc.src = 'https://platform.twitter.com/widgets.js'
  sc.async = true
  sc.onload = () => res()
  sc.onerror = () => { twLoading = null; res() }
  document.head.appendChild(sc)
}))

export default function RecordPanel({ record, index, total, onClose, onStep, onDelete, onImage }: Props) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const [embed, setEmbed] = useState<{ loading: boolean; error?: string }>({ loading: true })
  const [copied, flash] = useFlash()
  const last = useRef<RecordItem | null>(null)
  if (record) last.current = record
  const r = record ?? last.current

  // ↑↓ / j k で前後の記録へ
  useEffect(() => {
    if (!record) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea')) return
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); onStep(1) }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); onStep(-1) }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [record, onStep])

  const url = record?.url
  useEffect(() => {
    if (!url) return
    let cancelled = false
    setEmbed({ loading: true })
    if (box.current) box.current.innerHTML = ''
    apiGet<{ html?: string; error?: string }>(`tweet_embed?url=${encodeURIComponent(url)}`)
      .then((d) => {
        if (cancelled) return
        if (!d.html) throw new Error(d.error || t('rc.oembedErr'))
        setEmbed({ loading: false })
        requestAnimationFrame(() => {
          if (!box.current) return
          box.current.innerHTML = DOMPurify.sanitize(d.html!, { FORCE_BODY: true })
          loadTwitter().then(() => box.current && window.twttr?.widgets?.load(box.current))
        })
      })
      .catch((e: Error) => !cancelled && setEmbed({ loading: false, error: friendlyError(e) }))
    return () => { cancelled = true }
  }, [url])

  const shortId = r?.url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)?.[1]
  const metrics: [string, number][] = r ? [['rc.likes', r.likes], ['rc.reposts', r.reposts], ['rc.replies', r.replies], ['rc.metrImp', r.views]] : []

  return (
    <Dialog.Root open={!!record} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dash-vars fixed inset-0 z-[900] bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup initialFocus={false} className="dash-vars fixed right-0 top-0 z-[901] flex h-full w-[460px] max-w-full flex-col border-l border-d-border bg-d-bg text-d-text outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="absolute -left-14 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            <Tip label={t('rc.prev') + ' (↑ / k)'} side="left"><button type="button" aria-label={t('rc.prev')} disabled={index <= 0} onClick={() => onStep(-1)} className="grid size-11 place-items-center rounded-full border border-d-border bg-d-bg text-2xl text-d-text disabled:opacity-30"><i className="bx bx-chevron-up" /></button></Tip>
            <Tip label={t('rc.next') + ' (↓ / j)'} side="left"><button type="button" aria-label={t('rc.next')} disabled={index >= total - 1} onClick={() => onStep(1)} className="grid size-11 place-items-center rounded-full border border-d-border bg-d-bg text-2xl text-d-text disabled:opacity-30"><i className="bx bx-chevron-down" /></button></Tip>
          </div>
          <header className="flex items-center justify-between border-b border-d-border px-5 py-3">
            <div className="flex items-center gap-1">
              <Tip label={t('rc.prev') + ' (↑ / k)'} side="bottom"><button aria-label={t('rc.prev')} disabled={index <= 0} onClick={() => onStep(-1)} className="grid size-9 place-items-center rounded-full text-xl text-d-text2 disabled:opacity-30"><i className="bx bx-chevron-up" /></button></Tip>
              <Tip label={t('rc.next') + ' (↓ / j)'} side="bottom"><button aria-label={t('rc.next')} disabled={index >= total - 1} onClick={() => onStep(1)} className="grid size-9 place-items-center rounded-full text-xl text-d-text2 disabled:opacity-30"><i className="bx bx-chevron-down" /></button></Tip>
              <span className="ml-2 font-mono text-[11px] tabular-nums text-d-text3">{index + 1} / {total}</span>
            </div>
            <Dialog.Close aria-label={t('rc.close')} className="grid size-9 place-items-center rounded-full text-xl text-d-text2"><i className="bx bx-x" /></Dialog.Close>
          </header>

          {r && (
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <Dialog.Title className="font-mono text-[11px] uppercase tracking-wider text-d-text3">{shortDate(r.date)}</Dialog.Title>
              <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed">{r.text}</p>

              {r.image_url && (
                <button type="button" onClick={() => onImage(r.image_url!, r.video_url)} className="relative mt-4 block w-full overflow-hidden rounded-xl border border-d-border bg-d-med">
                  <img src={r.image_url} alt="" className="max-h-[320px] w-full object-contain" />
                  {r.video_url && <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-3xl text-white"><i className="bx bx-play-circle" /></span>}
                </button>
              )}

              <dl className="mt-5 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-d-border bg-d-border">
                {metrics.map(([l, v]) => (
                  <div key={l} className="bg-d-bg p-3">
                    <dt className="text-[11px] text-d-text3">{t(l)}</dt>
                    <dd className={`mt-1 text-lg font-semibold tabular-nums tracking-tight ${r.metrics_error && l !== 'rc.metrImp' ? 'text-d-danger' : ''}`}>{fmt(v)}</dd>
                  </div>
                ))}
              </dl>
              {r.metrics_error && <Callout className="mt-3">{t('rc.metricErr')}</Callout>}

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`/details/${r.detail_id}`} target="_blank" rel="noopener noreferrer" className={dbtn('default', '!text-d-text')}><i className="bx bx-detail" />{t('rc.detail')}</a>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className={dbtn('default', '!text-d-text')}><i className="bx bx-link-external" />{t('rc.orig')}</a>
                {shortId && (
                  <button type="button" className={dbtn()} onClick={() => copyText(`https://x.ohax.pw/${shortId}`).then(flash)}>
                    <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} />{t('rc.urlCopy')}
                  </button>
                )}
                {onDelete && <Tip label={t('rc.delete')}><HoldToDeleteButton label={t('rc.delHold')} className={dbtn('danger', 'ml-auto')} onDelete={() => onDelete(r.uniqid)}><i className="bx bx-trash" /></HoldToDeleteButton></Tip>}
              </div>

              <div className="mt-6 border-t border-d-border pt-4">
                <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-d-text3">Embed</div>
                {embed.loading && <p className="text-sm text-d-text2">{t('rc.twLoading')}</p>}
                {embed.error && <p className="text-sm text-d-danger">{t('rc.twFail')}<br /><small>{embed.error}</small></p>}
                <div ref={box} />
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
