import { useOutletContext } from 'react-router-dom'
import type { Profile, Stats } from '@/lib/dashboard/types'

export interface PublicCtx {
  publicUuid: string
  profile: Profile
  stats: Stats
}

// 子ページ(AwardsPage / GraphPage)から共有プロフィール・統計を受け取る。
export const usePublicCtx = () => useOutletContext<PublicCtx>()
