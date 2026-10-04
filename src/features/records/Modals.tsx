import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from '@/lib/toast'
import { apiSend, friendlyError } from '@/lib/dashboard/api'
import { sanitize } from '@/lib/dashboard/format'
import type { NotificationItem } from '@/lib/dashboard/types'
import DModal from '@/components/dashboard-ui/DModal'
import { DButton } from '@/components/dashboard-ui/DButton'
import { Spinner } from '@/components/ui/spinner'
import { DatePicker } from '@/components/arc/date-picker/date-picker'
import { Progress } from '@/components/arc/progress/progress'

const toDate = (v: string) => (v ? new Date(`${v}T00:00:00`) : undefined)
const fromDate = (d?: Date) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')

const Muted = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-d-text2 ${className}`}>{children}</p>
)

/* ── 画像・動画の拡大 ── */
export function ImageModal({ media, onClose }: { media: { image: string; video: string | null } | null; onClose: () => void }) {
  return (
    <DModal open={!!media} onClose={onClose} bare>
      {media?.video ? (
        <video src={media.video} controls autoPlay playsInline className="block max-h-[80vh] max-w-full rounded-xl" />
      ) : (
        media && <img src={media.image} alt="Enlarged image" className="block max-h-[90vh] max-w-[90vw] rounded-xl" />
      )}
    </DModal>
  )
}

/* ── 削除確認 ── */
export function DeleteModal({ uniqid, onClose, onConfirm }: { uniqid: string | null; onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  return (
    <DModal open={!!uniqid} onClose={onClose} title={{ icon: 'bx-trash', text: t('rc.delTitle') }}>
      <Muted className="mb-6 mt-4">{t('rc.delAsk')}<br />{t('rc.irrev')}</Muted>
      <div className="flex justify-end gap-3">
        <DButton onClick={onClose}>{t('rc.cancel')}</DButton>
        <DButton variant="danger" className="px-4 py-3" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false) }}>
          {t('rc.doDelete')}
        </DButton>
      </div>
    </DModal>
  )
}

/* ── ZIPダウンロード ── */
export function ZipModal({ open, onClose, csrf }: { open: boolean; onClose: () => void; csrf: string }) {
  const { t } = useTranslation()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/app-api/download_zip', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(start && end ? { start_date: start, end_date: end } : {}),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || t('rc.dlFail'))
      }
      const name = res.headers.get('Content-Disposition')?.match(/filename="(.+?)"/)?.[1] ?? 'ohatwi_images.zip'
      const blobUrl = URL.createObjectURL(await res.blob())
      const a = Object.assign(document.createElement('a'), { href: blobUrl, download: name })
      a.click()
      URL.revokeObjectURL(blobUrl)
      onClose()
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DModal side open={open} onClose={onClose} title={{ icon: 'bx-images', text: t('rc.zipTitle') }}>
      <Muted className="mb-6 mt-4">{t('rc.zipDesc')}</Muted>
      <form onSubmit={submit}>
        <div className="mt-6 flex items-center gap-4">
          <div className="grow">
            <DatePicker label={t('rc.start')} value={toDate(start)} onChange={(d) => setStart(fromDate(d))} />
          </div>
          <div className="self-end pb-3 text-d-text2">～</div>
          <div className="grow">
            <DatePicker label={t('rc.end')} value={toDate(end)} onChange={(d) => setEnd(fromDate(d))} />
          </div>
        </div>
        {err && <p className="mt-4 text-sm text-d-danger">{err}</p>}
        <div className="mt-8 flex justify-end gap-3">
          <DButton type="button" onClick={onClose}>{t('rc.cancel')}</DButton>
          <DButton type="submit" variant="primary" disabled={busy}>
            <i className="bx bx-download" /> {busy ? t('rc.creating') : t('rc.doDl')}
          </DButton>
        </div>
      </form>
    </DModal>
  )
}

/* ── まとめて登録 ── */
export function BulkAddModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (urls: string) => void }) {
  const { t } = useTranslation()
  // 誤って閉じても入力を失わないよう下書きを保持(リロード後も復元)
  const KEY = 'bulk_urls_draft'
  const [urls, setUrlsRaw] = useState(() => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } })
  const setUrls = (v: string) => { setUrlsRaw(v); try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY) } catch { /* ignore */ } }
  return (
    <DModal side open={open} onClose={onClose} title={{ icon: 'bx-list-plus', text: t('rc.bulkTitle') }}>
      <Muted className="mb-4 mt-4">{t('rc.bulkDesc')}</Muted>
      <textarea
        id="bulk-urls"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder={'https://x.com/username/status/123...\nhttps://x.com/username/status/456...'}
        className="min-h-[150px] w-full resize-y rounded-lg border border-d-border bg-d-bg p-3 text-base text-d-text"
      />
      <div className="mt-6 flex justify-end gap-3">
        <DButton onClick={onClose}>{t('rc.closeDraft')}</DButton>
        <DButton
          variant="primary"
          onClick={() => {
            if (!urls.trim()) { toast.error(t('rc.needUrl')); return }
            onSubmit(urls.trim())
            setUrls('')
          }}
        >
          <i className="bx bx-plus" /> {t('rc.doReg')}
        </DButton>
      </div>
    </DModal>
  )
}

/* ── 通知 ── */
export function NotificationsModal({ items, onClose }: { items: NotificationItem[]; onClose: () => void }) {
  const { t } = useTranslation()
  const dismissAll = async () => {
    try { await apiSend('notifications/dismiss_bulk', 'POST', { notification_ids: items.map((n) => n.id) }) } catch { /* 失敗しても閉じる */ }
    onClose()
  }
  return (
    <DModal open={items.length > 0} onClose={onClose} className="flex max-h-[80vh] w-[520px] flex-col !p-0">
      <div className="flex shrink-0 items-center justify-between border-b border-d-border px-6 pb-4 pt-5">
        <h2 className="flex items-center gap-[0.6rem] text-base font-bold">
          <i className="bx bx-bell text-d-text" />
          <span className="rounded-full bg-d-text px-2 py-[0.15rem] text-[0.68rem] font-bold text-d-bg">{t('rc.nItems', { n: items.length })}</span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-6">
        {items.map((n, i) => (
          <div key={n.id} className={`py-4 ${i > 0 ? 'border-t border-d-border' : ''}`}>
            <p className="mb-[0.4rem] text-[0.9rem] font-bold">{n.title}</p>
            <div className="text-[0.85rem] leading-[1.7] text-d-text2" dangerouslySetInnerHTML={{ __html: sanitize(n.body) }} />
            {n.cta_buttons?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {n.cta_buttons.filter((b) => b.label && b.url).map((b) => (
                  <a key={b.url} href={b.url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-d-border bg-d-text px-4 py-2.5 text-[0.85rem] font-semibold !text-d-bg">
                    <i className="bx bx-link-external" />{b.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-d-border px-6 py-4">
        <Link to="/notification" className="whitespace-nowrap text-[0.78rem] !text-d-text3 hover:!text-d-text">{t('rc.pastNotif')}</Link>
        <DButton variant="primary" className="px-[0.9rem] py-[0.6rem] text-[0.82rem]" onClick={dismissAll}>
          <i className="bx bx-check-double" />{t('rc.ackAll')}
        </DButton>
      </div>
    </DModal>
  )
}

/* ── アンケート ── */
export function SurveyModal({ open, onClose }: { open: boolean; onClose: (noShow: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <DModal open={open} onClose={() => onClose(false)} closeOnBackdrop={false} title={{ icon: 'bx-message-square-edit', text: t('rc.svTitle') }}>
      <Muted className="mt-4 leading-[1.7]">
        {t('rc.svBody1')}<br />
        {t('rc.svBody2')}
      </Muted>
      <div className="mt-8 flex justify-center gap-3">
        <DButton onClick={() => onClose(true)}><i className="bx bx-x-circle" />{t('rc.noMore')}</DButton>
        <DButton onClick={() => onClose(false)}>{t('rc.later')}</DButton>
        <Link to="/survey/favoriteohatwiworld" className="inline-flex items-center gap-2 rounded-full border border-d-border bg-d-text px-4 py-2.5 text-sm font-semibold !text-d-bg">
          <i className="bx bx-edit" />{t('rc.answer')}
        </Link>
      </div>
    </DModal>
  )
}

/* ── 一括更新・一括登録の進捗オーバーレイ ── */
export function ProgressOverlay({ state }: { state: { text: string; done?: number; total?: number } | null }) {
  const { t } = useTranslation()
  if (!state) return null
  const pct = state.total ? Math.min(100, Math.round(((state.done ?? 0) / state.total) * 100)) : 0
  return (
    <div className="dash-vars fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-black/80">
      <Spinner />
      <p className="text-base font-medium text-d-text">{state.text}</p>
      {state.total ? (
        <Progress value={pct} label={t('rc.progress')} showValue className="w-[min(360px,80vw)]" />
      ) : null}
    </div>
  )
}
