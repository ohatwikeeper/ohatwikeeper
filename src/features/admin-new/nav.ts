import { Activity, ChartLine, Bell, Bug, Clock, Code2, Cog, Image as ImageIcon, LayoutDashboard, Link2, Mail, MailCheck, MessageSquare, Newspaper, ShieldAlert, ShieldCheck, Users, Vote, Wrench, type LucideIcon } from 'lucide-react'

// /admin-new のナビ。data 系は共通の DataPage、それ以外は旧画面(/admin/...)へ橋渡し(移植が済んだら legacy を外す)
export type NavItem = { to: string; label: string; icon: LucideIcon; keywords?: string; legacy?: string }
const D = (v: string) => `/admin-new/data/${v}`
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: '概要', items: [{ to: '/admin-new', label: 'ダッシュボード', icon: LayoutDashboard, keywords: 'home overview 概要' }, { to: '/admin-new/analytics', label: '詳細分析', icon: ChartLine, keywords: 'analytics グラフ 推移 chart 統計' }] },
  {
    group: 'ユーザー', items: [
      { to: D('users'), label: 'ユーザー一覧', icon: Users, keywords: 'users ユーザー' },
      { to: '/admin-new/archived-users', label: '削除済みユーザー', icon: Users, keywords: 'archive 削除 復元' },
      { to: D('emails'), label: '登録メールアドレス', icon: Mail, keywords: 'email メール' },
      { to: '/admin-new/beta', label: 'ベータ招待', icon: ShieldCheck, keywords: 'beta' },
    ],
  },
  {
    group: 'ログ', items: [
      { to: D('access'), label: 'アクセスログ', icon: Activity, keywords: 'access analytics' },
      { to: D('user-actions'), label: 'ユーザー操作ログ', icon: Activity, keywords: 'actions' },
      { to: D('api-logs'), label: 'APIログ', icon: Code2, keywords: 'api request' },
      { to: D('api-errors'), label: 'APIエラーログ', icon: Bug, keywords: 'error request_id' },
      { to: D('page-errors'), label: 'エラーログ', icon: ShieldAlert, keywords: 'page error 画面' },
      { to: D('mails'), label: 'メール送信履歴', icon: MailCheck, keywords: 'mail' },
    ],
  },
  {
    group: 'コンテンツ', items: [
      { to: D('surveys'), label: 'アンケート', icon: Vote },
      { to: D('feedbacks'), label: 'フィードバック', icon: MessageSquare, keywords: 'feedback' },
      { to: D('short-links'), label: '短縮URL', icon: Link2, keywords: 'short link' },
      { to: D('notifications'), label: 'お知らせ', icon: Bell, keywords: 'notification' },
      { to: '/admin-new/patchnotes', label: 'パッチノート', icon: Newspaper, keywords: 'patchnote' },
    ],
  },
  {
    group: 'システム', items: [
      { to: '/admin-new/timing', label: 'データ更新タイミング', icon: Clock },
      { to: '/admin-new/image-cache', label: '画像キャッシュ', icon: ImageIcon },
      { to: D('system-settings'), label: 'システム設定', icon: Cog, keywords: 'settings' },
      { to: '/admin-new/maintenance', label: 'メンテナンス', icon: Wrench, keywords: 'maintenance' },
    ],
  },
]
export const ALL_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
