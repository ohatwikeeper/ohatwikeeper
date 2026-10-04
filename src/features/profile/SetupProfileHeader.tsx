import { useEffect, useState } from 'react'
import { useDashTheme } from '@/lib/dashboard/theme'
import { useOnboard } from '@/lib/onboard'
import { useSession } from '@/lib/session'
import type { Profile } from '@/lib/dashboard/types'
import ProfileHeader from '@/features/profile/ProfileHeader'

// 再マウントで枠が空→再表示とならないよう直前の取得結果を保持する
let cached: { uuid: string; profile: Profile } | null = null

/** セットアップ未完了(dashboard APIが412)のとき、公開プロフィールの情報(取れなければオンボード状態)から組み立てる簡易プロフィール */
export default function SetupProfileHeader() {
  const { theme, toggleTheme, accent, setAccent } = useDashTheme()
  const ob = useOnboard(false)
  const uuid = useSession().public_uuid
  const [pub, setPub] = useState<Profile | null>(cached && cached.uuid === uuid ? cached.profile : null)
  useEffect(() => {
    if (!uuid) return
    let alive = true
    fetch(`/app-api/view/profile-data?uuid=${encodeURIComponent(uuid)}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d?.profile) { cached = { uuid, profile: d.profile }; setPub(d.profile) } })
      .catch(() => { /* 取れなければオンボード状態の簡易表示のまま */ })
    return () => { alive = false }
  }, [uuid])
  const fallback: Profile = {
    name: ob.name || ob.xUser || '', screen_name: ob.xUser ?? '', has_x_linked: !!ob.xUser, is_developer: false,
    avatar_url: ob.xIcon ?? '', banner_url: null, bio_html: '', location: null, website: null,
    joined: new Date().toISOString(), following: 0, followers: 0, tweets: 0, page_views: 0,
  }
  return <ProfileHeader theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} profile={pub ?? fallback} />
}
