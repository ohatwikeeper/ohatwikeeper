import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import '@/index.css'
import '@/i18n'
import App from '@/app/App'
import { isChunkError, reloadOnce } from '@/app/RouteErrorBoundary'
import { reidentifyAnalytics } from '@/lib/session'
import ToastHost from '@/widgets/ToastHost'
import ConfirmHost from '@/widgets/ConfirmHost'

// Self-XSS 対策: 「ここに貼り付けて」と言われてコンソールに貼ると、アカウントを乗っ取られるおそれがある
// 独自デザインの警告(配色はサイトのアクセントに合わせる)
const box = 'padding:10px 14px;border-radius:8px;line-height:1.9;font-weight:bold'
console.log('%c✋ 手を止めてください', `${box};background:linear-gradient(90deg,#6dcbf7,#a78bfa);color:#0b1020;font-size:30px;padding:12px 20px`)
console.log('%c「ここに貼り付けて」と言われたら、その人は詐欺師です。\nこの画面は開発者用で、貼ったコードはあなたのアカウントを操作できてしまいます。', `${box};background:#fff3bf;color:#5c3b00;font-size:15px;border-left:6px solid #ffd400`)
console.log('%c🔒 おはツイKeeperの運営がコンソールへの貼り付けを求めることは一切ありません。', `${box};background:#2b0d0d;color:#ff8080;font-size:14px;border:1px solid #ff5c5c`)
console.log('%cIf anyone tells you to paste something here, it is a scam. Do not paste.', 'color:#ff8080;font-size:12px;font-weight:bold')

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
  })
}

// 動的 import の失敗(デプロイ直後の古いチャンク参照など)は新しい index を取り直して復帰する
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); reloadOnce() })
window.addEventListener('unhandledrejection', (e) => { if (isChunkError(e.reason)) { e.preventDefault(); reloadOnce() } })

// Rybbit アクセス解析(セルフホスト)。ローカル開発(vite dev)・他ホスト・自動操作は計測しない。管理画面・認証の途中経過も除外
const RYBBIT_SRC = import.meta.env.VITE_RYBBIT_SRC
const RYBBIT_HOSTS = (import.meta.env.VITE_RYBBIT_HOSTS ?? '').split(',').map((h: string) => h.trim()).filter(Boolean)
if (RYBBIT_SRC && import.meta.env.PROD && RYBBIT_HOSTS.includes(location.hostname) && !navigator.webdriver) {
  const el = document.createElement('script')
  el.src = RYBBIT_SRC
  el.defer = true
  el.dataset.skipPatterns = JSON.stringify(['/admin/**', '/login', '/confirm_login', '/onboard/**', '/auth/**'])
  // 個別ID・コードを含むパスは、パターン名に置き換えて集計する(個人を特定しうる値を送らない)
  el.dataset.maskPatterns = JSON.stringify(['/notification/*', '/settings/webhook/**', '/tools/get_tweeturl/search/*', '/details/*', '/diff/*/*', '/u/*'])
  el.dataset.tag = 'beta'
  el.dataset.debounce = '500'
  el.onload = reidentifyAnalytics
  document.head.appendChild(el)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <ToastHost>
        <ConfirmHost>
          <App />
        </ConfirmHost>
      </ToastHost>
    </PostHogProvider>
  </StrictMode>,
)
