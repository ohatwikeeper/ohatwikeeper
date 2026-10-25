import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** 全ページ共通のローディング表示(中央にバースピナー) */
export function PageLoader({ className }: { className?: string }) {
  const { t: tr } = useTranslation()
  // 消えたことを AppShell に伝える(ローディング終了後にページをブラーで表示するため)
  useLayoutEffect(() => () => { window.dispatchEvent(new Event('ohax:page-loader-gone')) }, [])
  return (
    <div data-page-loader role="status" aria-live="polite" className={cn("min-h-[40vh] w-full", className)}>
      {/* AppShell 内では絶対配置に切り替わる(index.css)。経路用とページ内用のローディングが重なっても同じ位置に出て、ガクつかない */}
      <div data-page-loader-visual className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 p-6">
        <Spinner className="h-8" />
        <span className="text-d-text3 text-sm">{tr('cm.loading')}…</span>
      </div>
    </div>
  )
}
