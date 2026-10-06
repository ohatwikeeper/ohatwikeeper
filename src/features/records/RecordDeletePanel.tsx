import { useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { useTranslation } from 'react-i18next'
import { fmt, shortDate } from '@/lib/dashboard/format'
import type { RecordItem } from '@/lib/dashboard/types'
import { dbtn } from '@/components/dashboard-ui/DButton'

/** おはツイ削除の確認。記録パネルと同じ右サイドパネルに内容を出して「これを消しますか？」と聞く */
export default function RecordDeletePanel({ record, onCancel, onConfirm }: { record: RecordItem | null; onCancel: () => void; onConfirm: (uniqid: string) => void }) {
  const { t } = useTranslation()
  const last = useRef<RecordItem | null>(null)
  if (record) last.current = record
  const r = record ?? last.current
  const metrics: [string, number][] = r ? [['rc.likes', r.likes], ['rc.reposts', r.reposts], ['rc.replies', r.replies], ['rc.metrImp', r.views]] : []
  return (
    <Dialog.Root open={!!record} onOpenChange={(o) => { if (!o) onCancel() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dash-vars fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm transition-all duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup initialFocus={false} className="dash-vars fixed right-0 top-0 z-[901] flex h-full w-[460px] max-w-full flex-col border-l border-d-border bg-d-bg text-d-text outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          {r && (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <Dialog.Title className="text-base font-semibold">このおはツイを削除しますか？</Dialog.Title>
                <div className="mt-4 rounded-xl border border-d-border p-4">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-d-text3">{shortDate(r.date)}</div>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{r.text}</p>
                  {r.image_url && <img src={r.image_url} alt="" className="mt-3 max-h-[260px] w-full rounded-lg border border-d-border object-contain" />}
                  <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-d-border bg-d-border">
                    {metrics.map(([l, v]) => (
                      <div key={l} className="bg-d-bg p-2.5">
                        <dt className="text-[11px] text-d-text3">{t(l)}</dt>
                        <dd className="mt-0.5 text-base font-semibold tabular-nums">{fmt(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-d-border px-5 py-3">
                <button type="button" autoFocus className={dbtn('default', '!text-d-text')} onClick={onCancel}>{t('lg.cancel')}</button>
                <button type="button" className={dbtn('danger')} onClick={() => onConfirm(r.uniqid)}>削除する</button>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
