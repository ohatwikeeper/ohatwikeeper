import { useTranslation } from 'react-i18next'
import { PageLoader } from '@/components/ui/page-loader'
import { useEffect, useState } from 'react'
import { usePublicCtx } from '@/app/layouts/publicContext'
import type { RecordItem } from '@/lib/dashboard/types'
import ContributionGraph from '@/features/records/ContributionGraph'
import SummaryStats, { StreakHero } from '@/features/records/SummaryStats'
import RecordsSection from '@/features/records/RecordsSection'
import RecordPanel from '@/features/records/RecordPanel'
import { ImageModal } from '@/features/records/Modals'

// 公開シェル配下のホーム(記録)。ダッシュボードのホームと同じ部品を読み取り専用で再利用する。
export default function PublicHomePage() {
  const { t: tr } = useTranslation()
  const { publicUuid, profile, stats } = usePublicCtx()
  const [records, setRecords] = useState<RecordItem[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [image, setImage] = useState<{ image: string; video: string | null } | null>(null)

  useEffect(() => {
    document.title = `${tr('cn.pubHome', { name: profile.name })} - おはツイKeeper`
  }, [profile.name])

  useEffect(() => {
    setRecords(null)
    fetch(`/app-api/view/profile-data/?uuid=${encodeURIComponent(publicUuid)}&records=1`)
      .then((r) => r.json())
      .then((d: { records?: RecordItem[] }) => setRecords(d.records ?? []))
      .catch(() => setRecords([]))
  }, [publicUuid])

  if (!records) return <PageLoader />

  const selIndex = selected ? records.findIndex((x) => x.uniqid === selected) : -1
  return (
    <>
      <StreakHero stats={stats} records={records} />
      <ContributionGraph records={records} />
      <SummaryStats stats={stats} />
      <RecordsSection
        records={records}
        firstPostDate={stats.first_post_date}
        lastUpdateTime={null}
        onImage={(image, video) => setImage({ image, video })}
        onTweet={setSelected}
      />
      <ImageModal media={image} onClose={() => setImage(null)} />
      <RecordPanel
        record={selIndex >= 0 ? records[selIndex] : null}
        index={selIndex}
        total={records.length}
        onClose={() => setSelected(null)}
        onStep={(d) => { const n = records[selIndex + d]; if (n) setSelected(n.uniqid) }}
        onImage={(image, video) => setImage({ image, video })}
      />
    </>
  )
}
