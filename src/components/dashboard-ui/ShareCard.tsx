import { Link2 } from 'lucide-react'
import { CmdLine } from '@/features/share/OhaxCliCard'
import { useTranslation } from 'react-i18next'
import Tip from '@/components/dashboard-ui/Tip'

/** ベータ環境(beta.*)で作る ohax.pw のURLには ?beta を付け、ベータへ振り分ける */
function withBeta(u: string) {
  if (typeof window === "undefined" || !window.location.hostname.startsWith("beta.")) return u
  if (!/^https?:\/\/([^/]+\.)?ohax\.pw(\/|$)/.test(u) || /[?&]beta\b/.test(u)) return u
  const i = u.indexOf("#"); const [b, h] = i < 0 ? [u, ""] : [u.slice(0, i), u.slice(i)]
  return b + (b.includes("?") ? "&beta" : "?beta") + h
}

/** 「このページを共有」: URL表示+コピー、X / 端末共有 / 開く */
export default function ShareCard({ url: rawUrl, title, text, className }: { url: string; title: string; text: string; className?: string }) {
  const url = withBeta(rawUrl)
  const { t } = useTranslation()
  const xText = encodeURIComponent(text)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  return (
<div className={className}>
  <div className="mb-2 text-xs text-d-text3">{t('cn.sharePage')}</div>
  <CmdLine cmd={url} prompt={<Link2 className="size-4" />} />
  <div className="mt-2 grid grid-cols-3 gap-2">
    <Tip label={t('cn.shareX')}>
      <a
        href={`https://x.com/intent/tweet?text=${xText}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener"
        className="flex items-center justify-center gap-1.5 rounded-xl border border-d-border bg-d-med py-2.5 text-sm !text-d-text2 transition-colors hover:!text-d-text"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        X
      </a>
    </Tip>
    {canNativeShare && (
      <Tip label={t('cn.shareDevice')}>
        <button
          type="button"
          onClick={() => navigator.share({ title: `${title}`, url: url }).catch(() => {})}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-d-border bg-d-med py-2.5 text-sm text-d-text2 transition-colors hover:text-d-text"
        >
          <i className="bx bx-share-alt" />{t('cn.share')}
        </button>
      </Tip>
    )}
    <Tip label={t('cn.openTab')}>
      <a href={url} target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 rounded-xl border border-d-border bg-d-med py-2.5 text-sm !text-d-text2 transition-colors hover:!text-d-text">
        <i className="bx bx-link-external" />{t('cn.open')}
      </a>
    </Tip>
  </div>
</div>
  )
}
