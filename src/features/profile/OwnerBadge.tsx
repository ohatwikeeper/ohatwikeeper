import { User, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePresence } from '@/lib/presence'
import { Badge } from '@/components/ui/badge'

/** サイドバーのプロフィールが「自分」か「他のユーザー」かを示す */
export default function OwnerBadge({ own, guest = false }: { own: boolean; guest?: boolean }) {
  const { t } = useTranslation()
  const online = usePresence()
  const Icon = guest || own ? User : Users
  return (
    <div className="flex items-center">
    <Badge variant={own && !guest ? 'secondary' : 'outline'} className="mb-3 gap-1.5">
      <Icon className="size-3.5" />{t(guest ? 'pf.guest' : own ? 'pf.own' : 'pf.other')}
    </Badge>
      {online !== null && <span className="mb-3 ml-2 inline-flex items-center gap-1.5 text-xs text-d-text3" title="Online"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span><span className="tabular-nums">{online}</span></span>}
    </div>
  )
}
