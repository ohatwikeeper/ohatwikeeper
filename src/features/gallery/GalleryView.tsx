import { PageLoader } from '@/components/ui/page-loader'
import { useTranslation } from 'react-i18next'
import { ImageOff } from 'lucide-react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { Images } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Spinner } from '@/components/ui/spinner'

interface GalleryImage { src: string; video: string | null; url: string | null; detail_id?: string | null; date: string }
interface GalleryData { is_public: boolean; author?: string; images?: GalleryImage[]; error?: string }

const COLS_KEY = 'ohatwiGalleryCols'
const MIN_COLS = 1
const MAX_COLS = 10
const readCols = () => {
  try {
    const n = Number(localStorage.getItem(COLS_KEY))
    return n >= MIN_COLS && n <= MAX_COLS ? n : 4
  } catch { return 4 }
}

// 公開ギャラリー。画像一覧(列数可変のmasonry)とライトボックス。
export default function GalleryView({ uuid }: { uuid: string }) {
  const { t: tr } = useTranslation()
  const [data, setData] = useState<GalleryData | null>(null)
  const [cols, setCols] = useState(readCols)
  const [open, setOpen] = useState<GalleryImage | null>(null)
  const [loadedCount, setLoadedCount] = useState(0)

  useEffect(() => {
    setData(null)
    setLoadedCount(0)
    fetch(`/app-api/view/gallery-data/?uuid=${encodeURIComponent(uuid)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ is_public: false, error: tr('gl.fail') }))
  }, [uuid])

  useEffect(() => {
    try { localStorage.setItem(COLS_KEY, String(cols)) } catch { /* 保存できなくても動作に影響しない */ }
  }, [cols])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!data) return <PageLoader />
  if (data.error || !data.is_public) {
    return <div className="grid min-h-[40vh] place-items-center text-d-text2">{data.error ?? tr('gl.private')}</div>
  }
  const images = data.images ?? []

  return (
    <div>
      <PageHeader icon={Images} title={<>{tr('gl.title')} <span className="text-sm font-normal text-d-text3">{tr('gl.count', { n: images.length })}</span></>} right={
        <div className="flex items-center gap-1 text-d-text2">
          <button type="button" aria-label={tr('gl.less')} disabled={cols <= MIN_COLS} onClick={() => setCols((c) => Math.max(MIN_COLS, c - 1))}
            className="grid size-8 place-items-center rounded-lg border border-d-border bg-d-med font-bold transition-colors disabled:opacity-35">−</button>
          <span className="min-w-6 text-center text-xs tabular-nums">{cols}</span>
          <button type="button" aria-label={tr('gl.more')} disabled={cols >= MAX_COLS} onClick={() => setCols((c) => Math.min(MAX_COLS, c + 1))}
            className="grid size-8 place-items-center rounded-lg border border-d-border bg-d-med font-bold transition-colors disabled:opacity-35">＋</button>
        </div>
      } />

      {images.length === 0 ? (
        <AppEmpty icon={ImageOff} title={tr('gl.empty')} description={tr('gl.emptyD')} />
      ) : (
        <div className="relative">
          {loadedCount < images.length && (
            <div className="absolute inset-0 z-10 grid place-items-start justify-center bg-d-bg/70 pt-[25vh]" role="status" aria-label={tr('gl.loading')}>
              <Spinner />
            </div>
          )}
        <div style={{ columnCount: cols, columnGap: '0.5rem', minHeight: '40vh' }}>
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => setOpen(img)} data-cuelume-skip
              className="group relative mb-2 block w-full overflow-hidden rounded-lg bg-d-med">
              <img src={img.src} alt={tr('gl.alt', { d: img.date })}
                onLoad={() => setLoadedCount((n) => n + 1)} onError={() => setLoadedCount((n) => n + 1)}
                className="block w-full transition-transform duration-200 group-hover:scale-[1.03]" />
              {img.video && <i className="bx bx-play-circle absolute right-1.5 top-1.5 text-xl text-white drop-shadow" />}
            </button>
          ))}
        </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}>
            <div className="flex max-h-full max-w-full flex-col items-center gap-3">
              {open.video
                ? <video src={open.video} poster={open.src} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-lg" />
                : <img src={open.src} alt={tr('gl.alt', { d: open.date })} className="max-h-[80vh] max-w-full rounded-lg object-contain" />}
              <div className="flex items-center gap-3 text-sm text-white">
                <span>{open.date}</span>
                {open.detail_id && <Link to={`/details/${open.detail_id}`} className="text-d-text2 inline-flex items-center gap-1 !text-white hover:text-d-text"><i className="bx bx-detail" />{tr('gl.detail')}</Link>}
                {open.url && <a href={open.url} target="_blank" rel="noopener noreferrer" className="text-d-text2 inline-flex items-center gap-1 !text-white hover:text-d-text"><i className="bx bx-link-external" />{tr('gl.orig')}</a>}
              </div>
            </div>
            <button type="button" aria-label={tr('aw.close')} onClick={() => setOpen(null)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-2xl text-white"><i className="bx bx-x" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
