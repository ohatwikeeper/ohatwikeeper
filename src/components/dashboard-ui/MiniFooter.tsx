import LanguageSwitcher from '@/components/dashboard-ui/LanguageSwitcher'
import { TooltipProvider } from '@/components/ui/tooltip'

/** サイドメニューの無いページ(ログイン・エラー等)用の簡易フッター。言語ボタンつき */
export default function MiniFooter() {
  return (
    <footer className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-3 text-[11px] text-d-text3">
      <span>© {new Date().getFullYear()} おはツイKeeper</span>
      <TooltipProvider><LanguageSwitcher compact /></TooltipProvider>
    </footer>
  )
}
