import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { apiGet, friendlyError } from '@/lib/dashboard/api'
import { loadTwitter } from '@/features/records/RecordPanel'

// 投稿URLからoEmbedを取得して埋め込み表示する
export default function TweetEmbed({ url }: { url: string }) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const [st, setSt] = useState<{ loading: boolean; error?: string }>({ loading: true })

  useEffect(() => {
    let cancelled = false
    setSt({ loading: true })
    if (box.current) box.current.innerHTML = ''
    apiGet<{ html?: string; error?: string }>(`tweet_embed?url=${encodeURIComponent(url)}`)
      .then((d) => {
        if (cancelled) return
        if (!d.html) throw new Error(d.error || t('rc.oembedErr'))
        setSt({ loading: false })
        requestAnimationFrame(() => {
          if (!box.current) return
          box.current.innerHTML = DOMPurify.sanitize(d.html!, { FORCE_BODY: true })
          loadTwitter().then(() => box.current && window.twttr?.widgets?.load(box.current))
        })
      })
      .catch((e: Error) => !cancelled && setSt({ loading: false, error: friendlyError(e) }))
    return () => { cancelled = true }
  }, [url])

  return (
    <div>
      {st.loading && <p className="text-sm text-d-text2">{t('rc.twLoading')}</p>}
      {st.error && <p className="text-sm text-d-danger">{t('rc.twFail')}<br /><small>{st.error}</small></p>}
      <div ref={box} className="flex justify-center [&_.twitter-tweet]:!mx-auto" />
    </div>
  )
}
