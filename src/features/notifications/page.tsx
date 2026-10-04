import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/page-loader'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from '@/lib/toast'
import {
  Megaphone,
  Ellipsis,
  CheckCircle2,
  ExternalLink,
  CheckCheck,
  Inbox,
} from 'lucide-react'
import { apiGet, apiSend } from '@/lib/dashboard/api'
import { Spinner } from '@/components/ui/spinner'

interface Cta {
  label: string
  url: string
  icon?: string
}

export interface Notif {
  id: number
  code: string
  title: string
  body: string
  image_url?: string | null
  created_at: string
  is_read: boolean
  read_at?: string | null
  cta_buttons: Cta[]
  category?: string | null
}

export const fmt = (s: string) => {
  const d = new Date(s.replace(' ', 'T'))
  if (isNaN(d.getTime())) return s
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function renderFormattedBody(text: string) {
  // <strong>...</strong> と改行を安全にレンダリング
  const parts = text.split(/(<strong>.*?<\/strong>|\n)/g)
  return parts.map((part, i) => {
    if (part === '\n') return <br key={i} />
    if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
      return (
        <strong key={i} className="font-bold text-d-text">
          {part.slice(8, -9)}
        </strong>
      )
    }
    return part
  })
}

export default function NotificationsPage() {
  const { t: tr } = useTranslation()
  const [items, setItems] = useState<Notif[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all')

  const loadNotifications = () => {
    setLoading(true)
    apiGet<{ notifications: Notif[] }>('notifications/all')
      .then((r) => {
        setItems(r.notifications || [])
      })
      .catch(() => {
        setItems([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    document.title = tr('nt.doc')
    loadNotifications()
  }, [])

  const markAsRead = async (ids: number[]) => {
    if (!ids.length) return
    try {
      await apiSend('notifications/dismiss_bulk', 'POST', { notification_ids: ids })
      toast.success(ids.length === 1 ? tr('nt.readOne') : tr('nt.readAll'))
      // Optimistic update
      setItems((prev) =>
        prev
          ? prev.map((n) =>
              ids.includes(n.id)
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n
            )
          : []
      )
    } catch {
      toast.error(tr('nt.needLogin'))
      loadNotifications()
    }
  }

  const unreadList = (items ?? []).filter((n) => !n.is_read)
  const readList = (items ?? []).filter((n) => n.is_read)

  const displayedList =
    filterTab === 'unread' ? unreadList : filterTab === 'read' ? readList : items ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-d-border bg-d-med">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Megaphone className="size-4 text-d-text2" />
            <h1 className="text-sm font-semibold text-d-text">{tr('nt.title')}</h1>
            <span className="text-xs text-d-text3">({(items ?? []).length})</span>
          </div>
          {unreadList.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => markAsRead(unreadList.map((n) => n.id))}>
              <CheckCheck className="size-4" /> {tr('nt.allRead')}
            </Button>
          )}
        </div>

        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
          <TabsList variant="line" className="w-full border-y border-d-border">
            <TabsTrigger value="all">{tr('nt.tAll')}</TabsTrigger>
            <TabsTrigger value="unread">{tr('nt.tUnread')}{unreadList.length > 0 && ` (${unreadList.length})`}</TabsTrigger>
            <TabsTrigger value="read">{tr('nt.tRead')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="py-20 text-center text-d-text3"><Spinner className="mb-3" /><PageLoader /></div>
        ) : displayedList.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto mb-3 size-10 text-d-text3" />
            <h3 className="mb-1 text-sm font-bold text-d-text">{filterTab === 'unread' ? tr('nt.noUnread') : tr('nt.none')}</h3>
            <p className="text-xs text-d-text2">{tr('nt.hint')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-d-border">
            <AnimatePresence initial={false}>
              {displayedList.map((n) => (
                <motion.li key={n.id} layout exit={{ opacity: 0 }} className="flex items-start gap-3 px-5 py-4">
                  <span className={`mt-2 size-2 shrink-0 rounded-full ${n.is_read ? 'bg-d-text3' : 'bg-blue-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm font-semibold ${n.is_read ? 'text-d-text2' : 'text-d-text'}`}><Link to={`/notification/${n.code}`} className="!text-inherit no-underline hover:underline">{n.title}</Link></h3>
                      {!n.is_read && <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">NEW</Badge>}
                    </div>
                    {n.image_url && (
                      <img src={n.image_url} alt={n.title} loading="lazy" className="mt-2 max-h-56 w-full rounded-lg border border-d-border/60 object-cover" />
                    )}
                    <div className="mt-1 whitespace-pre-line text-xs leading-relaxed text-d-text2">{renderFormattedBody(n.body)}</div>
                    {n.cta_buttons && n.cta_buttons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {n.cta_buttons.map((b, i) => (
                          <Button key={i} size="sm" variant="outline" className="h-7 text-xs" nativeButton={false} render={<a href={b.url} target={b.url.startsWith('http') ? '_blank' : undefined} rel={b.url.startsWith('http') ? 'noopener noreferrer' : undefined} />}>
                            {b.label}
                            {b.url.startsWith('http') && <ExternalLink className="size-3" />}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-d-text3">
                      <span>{fmt(n.created_at)}</span>
                      {n.is_read && n.read_at && <span>{tr('nt.confirmed', { d: fmt(n.read_at) })}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={tr('nt.menu')} />}>
                      <Ellipsis className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={n.is_read} onClick={() => markAsRead([n.id])}>
                        <CheckCircle2 className="size-4" /> {tr('nt.markRead')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
