import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToastStack } from '@/components/arc/toast-stack/toast-stack'

declare const __BUILD_VERSION__: string

const INTERVAL = 5 * 60_000
const MIN_GAP = 60_000

/** 配信中のビルドと自分のビルドを見比べ、新しいデプロイがあれば再読み込みを促すトーストを出し続ける。 */
export default function UpdateWatcher() {
  const { toast } = useToastStack()
  const { t } = useTranslation()

  useEffect(() => {
    if (!import.meta.env.PROD) return
    let found = false
    let last = 0
    const raise = () => toast({
      id: 'app-update', type: 'info', title: t('update.title'), description: t('update.desc'), duration: Infinity,
      action: { label: t('update.reload'), onClick: () => location.reload() },
    })
    const check = async () => {
      // 見つけた後は確認をやめ、タブに戻るたびに出し直す(閉じられた・押し出された場合の再表示)
      if (found) return raise()
      if (document.hidden || Date.now() - last < MIN_GAP) return
      last = Date.now()
      try {
        const r = await fetch('/app-api/build', { cache: 'no-store' })
        if (!r.ok) return
        // ベータの認証ゲート・メンテナンス・デプロイ途中など、読めない応答は「情報なし」として扱う
        const v = (await r.json())?.version
        if (typeof v !== 'string' || !v || v === __BUILD_VERSION__) return
        found = true
        raise()
      } catch { /* 通信失敗は次回に回す */ }
    }
    const onVisible = () => { if (!document.hidden) check() }
    const timer = window.setInterval(() => { if (!found) check() }, INTERVAL)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [toast, t])

  return null
}
