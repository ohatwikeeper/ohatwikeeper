import i18n from '@/i18n'
import { useEffect } from 'react'
import { usePublicCtx } from '@/app/layouts/publicContext'
import AwardsView from '@/features/awards/AwardsView'

// 公開シェル配下のアワードページ。中身は AwardsView(uuid受け取り)を再利用し、
// ダッシュボード内タブでも同じビューを使う。
export default function AwardsPage() {
  const { publicUuid, profile } = usePublicCtx()
  useEffect(() => {
    document.title = i18n.t('gv.docA', { name: profile.name })
  }, [profile.name])
  return <AwardsView uuid={publicUuid} />
}
