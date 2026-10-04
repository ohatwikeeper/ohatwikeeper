import i18n from '@/i18n'
import { useEffect } from 'react'
import { usePublicCtx } from '@/app/layouts/publicContext'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box } from 'lucide-react'
import GraphView from '@/features/graph/GraphView'

// 公開シェル配下のグラフページ。中身は GraphView(uuid受け取り)を再利用し、
// ダッシュボード内タブでも同じビューを使う。
export default function GraphPage() {
  const { publicUuid, profile } = usePublicCtx()
  useEffect(() => {
    document.title = i18n.t('gv.docG', { name: profile.name })
  }, [profile.name])
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <Link to={`/${publicUuid}/graph/3d`} className="inline-flex items-center gap-1.5 rounded-lg border border-d-border px-3 py-1.5 text-xs font-semibold !text-d-text2 no-underline hover:!text-d-text">
        <Box className="size-4" />{t('g3.open')}
      </Link>
      <GraphView uuid={publicUuid} />
    </div>
  )
}
