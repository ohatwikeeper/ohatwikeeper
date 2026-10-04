import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { apiGet } from '@/lib/dashboard/api'
import Tip from '@/components/dashboard-ui/Tip'

interface Notif { id: number; code: string; title: string; body: string; created_at: string; is_read: boolean }

const plain = (s: string) => s.replace(/<[^>]+>/g, '')
const fmt = (s: string) => {
  const d = new Date(s.replace(' ', 'T'))
  return isNaN(d.getTime()) ? s : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 通知ベル: 押すと直近の通知をその場でプレビュー。未読があれば点を表示 */
export default function NotificationBell() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Notif[] | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let live = true
    apiGet<{ notifications: Notif[] }>('notifications/all')
      .then((r) => { if (live) setItems(r.notifications ?? []) })
      .catch(() => { if (live) setItems([]) })
    return () => { live = false }
  }, [open])

  const unread = (items ?? []).some((n) => !n.is_read)
  const recent = (items ?? []).slice(0, 5)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tip label={t('nb.notification')}>
        <PopoverTrigger
          aria-label={t('nb.notification')}
          data-cuelume-skip
          className="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text"
        >
          <Bell className="size-[18px]" />
          {unread && <span className="absolute right-2 top-2 size-2 rounded-full bg-d-danger ring-2 ring-d-bg" />}
        </PopoverTrigger>
      </Tip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-d-border px-3 py-2 text-xs font-bold text-d-text">{t('nt.title')}</div>
        {items === null ? (
          <div className="px-3 py-6 text-center text-xs text-d-text3">…</div>
        ) : recent.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-d-text3">{t('nt.none')}</div>
        ) : (
          <ul className="max-h-72 divide-y divide-d-border overflow-y-auto">
            {recent.map((n) => (
              <li key={n.id}>
               <Link to={`/notification/${n.code}`} onClick={() => setOpen(false)} className="block px-3 py-2 !text-inherit no-underline hover:bg-d-light">
                <div className="flex items-center gap-1.5">
                  {!n.is_read && <span className="size-1.5 shrink-0 rounded-full bg-d-danger" />}
                  <span className="truncate text-[13px] font-semibold text-d-text">{n.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-d-text3">{fmt(n.created_at)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-d-text2">{plain(n.body)}</p>
               </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/notification" onClick={() => setOpen(false)} className="block border-t border-d-border px-3 py-2 text-center text-xs font-semibold !text-d-text2 no-underline hover:!text-d-text">
          {t('nt.viewAll')}
        </Link>
      </PopoverContent>
    </Popover>
  )
}
