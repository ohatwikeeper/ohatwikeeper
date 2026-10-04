import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserX } from 'lucide-react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { Link, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { apiGet, friendlyError } from '@/lib/dashboard/api'

interface HUser { public_uuid: string; x_username: string | null; display_name: string | null; post_count: number; x_icon: string }

const mark = (text: string, q: string) => {
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0 || !q) return text
  return <>{text.slice(0, i)}<mark className="rounded bg-d-accent/30 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>
}

/** /u/{handle}: Xハンドル・public_uuid の部分一致でユーザー候補を一覧表示(PHP版 u_handle.php 相当) */
export default function HandleSearchPage() {
  const { t: tr } = useTranslation()
  const { handle = '' } = useParams()
  const [users, setUsers] = useState<HUser[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = tr('hd.doc', { h: handle })
    setUsers(null); setError('')
    apiGet<{ users: HUser[] }>(`/app-api/view/handle-search?handle=${encodeURIComponent(handle)}`)
      .then((d) => setUsers(d.users))
      .catch((e) => setError(friendlyError(e, tr('hd.fail'))))
  }, [handle])

  return (
    <div className="dash-scope px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <PageHeader icon={Search} title={tr('hd.title', { h: handle })} />
        {error && <p className="mt-6 text-sm text-d-danger">{error}</p>}
        {!error && !users && <p className="mt-6 text-sm text-d-text2">{tr('hd.searching')}</p>}
        {users && users.length === 0 && <AppEmpty icon={UserX} title={tr('hd.none')} description={tr('hd.noneD')} />}
        <ul className="mt-6 space-y-2">
          {users?.map((u) => (
            <li key={u.public_uuid}>
              <Link to={`/${u.public_uuid}`} className="flex items-center gap-3 rounded-xl border border-d-border bg-d-med/60 p-3 !text-d-text transition-colors">
                <img src={u.x_icon} alt="" className="size-10 shrink-0 rounded-full bg-d-light" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.display_name || u.x_username || u.public_uuid}</div>
                  <div className="truncate text-xs text-d-text3">{u.x_username ? <>@{mark(u.x_username, handle)}</> : null} ・ {mark(u.public_uuid, handle)}</div>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-d-text3">{tr('hd.count', { n: u.post_count.toLocaleString() })}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
