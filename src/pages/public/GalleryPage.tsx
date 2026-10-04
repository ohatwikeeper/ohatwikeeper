import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { usePublicCtx } from '@/app/layouts/publicContext'
import GalleryView from '@/features/gallery/GalleryView'

// 公開シェル配下のギャラリーページ。
export default function GalleryPage() {
  const { t: tr } = useTranslation()
  const { publicUuid, profile } = usePublicCtx()
  useEffect(() => {
    document.title = `${tr('cn.pubGallery', { name: profile.name })} - おはツイKeeper`
  }, [profile.name])
  return <GalleryView uuid={publicUuid} />
}
