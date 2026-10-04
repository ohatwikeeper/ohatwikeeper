import { User, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

/** サイドバーのプロフィールが「自分」か「他のユーザー」かを示す */
export default function OwnerBadge({ own, guest = false }: { own: boolean; guest?: boolean }) {
  const { t } = useTranslation()
  const Icon = guest || own ? User : Users
  return (
    <Badge variant={own && !guest ? 'secondary' : 'outline'} className="mb-3 gap-1.5">
      <Icon className="size-3.5" />{t(guest ? 'pf.guest' : own ? 'pf.own' : 'pf.other')}
    </Badge>
  )
}
