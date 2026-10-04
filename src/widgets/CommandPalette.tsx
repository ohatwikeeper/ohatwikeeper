import { LogoutDialog, askLogout } from '@/widgets/LogoutDialog'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { CONFIG } from '@/lib/config'
import { sendCommand, type DashCommand } from '@/lib/commands'
import { useDashTheme, ACCENTS } from '@/lib/dashboard/theme'

interface CpItem {
  id: string
  label: string
  icon: string
  kw: string
  group: string
  href?: string
  ext?: boolean
  run?: () => void
  hint?: string
}

const P = CONFIG.PAGES
const BASE_ITEMS: CpItem[] = [
  { id: 'home', group: 'cp.pages', label: 'nb.topPage', href: P.HOME, icon: 'bx-home', kw: 'top home トップ' },
  { id: 'dashboard', group: 'cp.pages', label: 'nb.dashboard', href: P.DASHBOARD, icon: 'bx-grid-alt', kw: 'dashboard マイページ' },
  { id: 'graph', group: 'cp.pages', label: 'nb.graph', href: P.GRAPH, icon: 'bx-line-chart', kw: 'graph chart 統計' },
  { id: 'gallery', group: 'cp.pages', label: 'nb.gallery', href: P.GALLERY, icon: 'bx-image', kw: 'gallery 画像 アルバム' },
  { id: 'awards', group: 'cp.pages', label: 'nb.awards', href: P.AWARDS, icon: 'bx-medal', kw: 'awards 実績 バッジ badge' },
  { id: 'recap', group: 'cp.pages', label: 'cp.recap', href: P.RECAP(), icon: 'bx-revision', kw: 'recap 振り返り 月間' },
  { id: 'search', group: 'cp.pages', label: 'nb.search', href: P.SEARCH, icon: 'bx-search-alt', kw: 'search 投稿検索' },
  { id: 'diff', group: 'cp.pages', label: 'cp.diff', href: P.DIFF(), icon: 'bx-git-compare', kw: 'diff 比較 対決 versus' },
  { id: 'ranking', group: 'nb.ranking', label: 'nb.ranking', href: P.RANKING, icon: 'bx-trophy', kw: 'ranking 順位' },
  { id: 'ranking-today', group: 'nb.ranking', label: 'cp.rankingToday', href: '/ranking/today', icon: 'bx-trending-up', kw: 'ranking today 今日 デイリー' },
  { id: 'survey', group: 'cp.pages', label: 'nb.survey', href: P.SURVEY(), icon: 'bx-poll', kw: 'survey アンケート 投票' },
  { id: 'tools', group: 'nb.tools', label: 'nb.handyTools', href: P.TOOLS, icon: 'bx-wrench', kw: 'tools 便利ツール' },
  { id: 'tweeturl', group: 'nb.tools', label: 'cp.tweetUrl', href: '/tools/get_tweeturl', icon: 'bx-link-alt', kw: 'tweet url tweet.js アーカイブ 抽出' },
  { id: 'search-ohatwi', group: 'nb.tools', label: 'cp.searchOhatwi', href: '/tools/search_ohatwi', icon: 'bx-search', kw: 'search ohatwi 過去 おはツイ検索' },
  { id: 'settings-notify', group: 'nb.settings', label: 'cp.settingsNotify', href: '/settings/notify', icon: 'bx-bell', kw: 'notify reminder 通知 リマインド' },
  { id: 'settings-widgets', group: 'nb.settings', label: 'cp.settingsWidgets', href: '/settings/widgets', icon: 'bx-category', kw: 'widget ウィジェット 埋め込み' },
  { id: 'settings-webhooks', group: 'nb.settings', label: 'cp.settingsWebhooks', href: '/settings/webhooks', icon: 'bx-plug', kw: 'webhook discord 連携' },
  { id: 'settings-theme', group: 'nb.settings', label: 'nb.themeSettings', href: '/settings/theme', icon: 'bx-palette', kw: 'theme accent font radius テーマ 色 文字サイズ 角丸' },
  { id: 'terminal', group: 'nb.tools', label: 'cp.terminal', href: '/terminal', icon: 'bx-terminal', kw: 'terminal ターミナル 端末 awards 実績' },
  { id: 'folder', group: 'cp.manage', label: 'nb.folder', href: P.FOLDER, icon: 'bx-folder', kw: 'folder 整理' },
  { id: 'notification', group: 'cp.manage', label: 'nb.notification', href: P.NOTIFICATIONS, icon: 'bx-bell', kw: 'notification お知らせ' },
  { id: 'rlinks', group: 'cp.manage', label: 'nb.linksManage', href: P.R_LINKS, icon: 'bx-link', kw: 'shortlink rlinks 短縮 url' },
  { id: 'settings', group: 'nb.settings', label: 'nb.settings', href: P.SETTINGS, icon: 'bx-cog', kw: 'settings 設定 アカウント' },
  { id: 'settings-email', group: 'nb.settings', label: 'nb.emailSettings', href: '/settings', icon: 'bx-envelope', kw: 'email settings mail 通知メール' },
  { id: 'settings-api', group: 'nb.settings', label: 'cp.apiSettings', href: P.SETTINGS_API, icon: 'bx-key', kw: 'api token key トークン 開発者' },
  { id: 'howtouse', group: 'cp.help', label: 'nb.usage', href: P.HOW_TO_USE, icon: 'bx-book-open', kw: 'howtouse help 使い方 ガイド' },
  { id: 'patchnote', group: 'cp.help', label: 'nb.updateHistory', href: P.PATCHNOTES, icon: 'bx-history', kw: 'patchnote changelog 更新' },
  { id: 'terms', group: 'cp.help', label: 'nb.terms', href: P.TERMS, icon: 'bx-file', kw: 'terms 規約' },
  { id: 'policy', group: 'cp.help', label: 'cp.policy', href: P.POLICY, icon: 'bx-shield-quarter', kw: 'policy terms privacy 規約' },
  { id: 'dev', group: 'cp.help', label: 'nb.aboutDev', href: P.DEV, icon: 'bx-user-circle', kw: 'dev developer about' },
  { id: 'extensions', group: 'nb.tools', label: 'nb.browserExt', href: P.EXTENSIONS, icon: 'bxl-chrome', kw: 'extension chrome 拡張機能 ワンクリック' },
  { id: 'cli', group: 'nb.tools', label: 'cp.cli', href: P.CLI_TOOLS, icon: 'bx-terminal', kw: 'cli command terminal コマンドライン' },
  { id: 'api-docs', group: 'nb.tools', label: 'nb.apiDocs', href: CONFIG.EXTERNAL.API_DOCS, icon: 'bx-code-alt', kw: 'api docs', ext: true },
  { id: 'timeline', group: 'cp.related', label: 'おはツイTimeline', href: CONFIG.EXTERNAL.TIMELINE, icon: 'bx-spreadsheet', kw: 'timeline', ext: true },
  { id: 'profilecard', group: 'cp.related', label: 'Profile Card', href: CONFIG.EXTERNAL.PROFILE_CARD, icon: 'bx-id-card', kw: 'profilecard', ext: true },
  { id: 'tempmail', group: 'cp.related', label: 'TempMail', href: CONFIG.EXTERNAL.TEMPMAIL, icon: 'bx-envelope-open', kw: 'tempmail 使い捨てメール 関連サービス', ext: true },
  { id: 'status', group: 'cp.support', label: 'nb.status', href: CONFIG.EXTERNAL.STATUS, icon: 'bx-pulse', kw: 'status 稼働状況 障害', ext: true },
  { id: 'discord', group: 'cp.support', label: 'cp.discord', href: CONFIG.EXTERNAL.DISCORD, icon: 'bxl-discord-alt', kw: 'discord contact 問い合わせ', ext: true },
  { id: 'vrchat', group: 'cp.support', label: 'VRChat', href: CONFIG.EXTERNAL.VRCHAT, icon: 'bx-world', kw: 'vrchat ぶいちゃ vr', ext: true },
]

const RECENT_KEY = 'cp_recent'
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(id: string) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...loadRecent().filter(x => x !== id)].slice(0, 5))) } catch { /* ignore */ }
}

// 連続一致 > 部分列一致の簡易ファジー。スコアが大きいほど上位
function score(text: string, q: string): number {
  const t = text.toLowerCase()
  const i = t.indexOf(q)
  if (i >= 0) return 100 - i
  let ti = 0
  for (const ch of q) {
    ti = t.indexOf(ch, ti)
    if (ti < 0) return 0
    ti++
  }
  return 10
}

interface SessionData {
  logged_in: boolean
  public_uuid: string | null
}

/** 公開ページ(/{uuid}/{sub})は ohax.pw 形式(root=ohax.pw/{uuid}, sub={uuid}.ohax.pw/{sub})、他は ohax.pw に置換 */
function shortUrl() {
  const u = new URL(window.location.href)
  if (u.hostname !== 'ohatwikeeper.com' && u.hostname !== 'www.ohatwikeeper.com') return u.toString()
  const m = u.pathname.match(/^\/([0-9a-f]{8}-[0-9a-f-]{27})(\/.*)?$/i)
  if (m && m[2] && m[2] !== '/') return `https://${m[1]}.ohax.pw${m[2]}${u.search}${u.hash}`
  u.host = 'ohax.pw'
  return u.toString()
}

export default function CommandPalette() {
  const { t, i18n } = useTranslation()
  const dash = useDashTheme()
  // 'cp.'/'nb.' で始まるものだけ訳語キーとして解決(ブランド名などはそのまま)
  const tr = (k: string) => (/^(cp|nb|ac)\./.test(k) ? t(k) : k)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [session, setSession] = useState<SessionData>({ logged_in: false, public_uuid: null })

  useEffect(() => {
    fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSession({ logged_in: !!d.logged_in, public_uuid: d.public_uuid ?? null }))
      .catch(() => {})
  }, [])

  const items: CpItem[] = useMemo(() => {
    const list = [...BASE_ITEMS]
    const LANGS: [string, string][] = [['ja', '日本語'], ['en', 'English'], ['ko', '한국어'], ['zh', '中文'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português'], ['it', 'Italiano'], ['ru', 'Русский']]
    list.push(
      { id: 'theme-switch', group: 'cp.grpTheme', label: 'cp.themeSwitch', icon: 'bx-sun', kw: 'theme dark light mode テーマ ダーク ライト 設定 settings', run: () => dash.toggleTheme() },
      ...ACCENTS.map((a): CpItem => ({ id: 'accent-' + a.name, group: 'cp.grpTheme', label: a.label, icon: 'bx-palette', kw: 'accent color theme テーマ カラー 色 設定 ' + a.name, run: () => dash.setAccent(a.name) })),
      ...LANGS.map(([code, native]): CpItem => ({ id: 'lang-' + code, group: 'cp.grpLang', label: native, icon: 'bx-globe', kw: 'language lang locale 言語 言葉 設定 ' + code, run: () => { void i18n.changeLanguage(code) } })),
    )
    const actions: CpItem[] = [
      { id: 'copy-url', group: 'cp.actions', label: 'cp.copyShort', icon: 'bx-copy', kw: 'copy url link コピー 共有', hint: 'cp.copy',
        run: () => { navigator.clipboard?.writeText(shortUrl()).catch(() => {}) } },
      { id: 'scroll-top', group: 'cp.actions', label: 'cp.toTop', icon: 'bx-up-arrow-alt', kw: 'top scroll 先頭',
        run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { id: 'reload', group: 'cp.actions', label: 'cp.reload', icon: 'bx-refresh', kw: 'reload refresh 更新', run: () => window.location.reload() },
    ]
    if (/^\/dashboard(\.php)?\/?$/.test(window.location.pathname)) {
      const op = (id: DashCommand, label: string, icon: string, kw: string): CpItem =>
        ({ id: `op-${id}`, group: 'cp.dashOps', label, icon, kw, run: () => sendCommand(id) })
      list.unshift(
        op('focus-add', 'cp.addPost', 'bx-plus', 'add 追加 登録 url'),
        op('bulk', 'cp.bulk', 'bx-list-plus', 'bulk まとめて 一括'),
        op('update-month', 'cp.updateMonth', 'bx-calendar-check', 'update 更新 月'),
        op('update-all', 'cp.updateAll', 'bx-sync', 'update all 全て 更新'),
        op('zip', 'cp.zip', 'bx-images', 'zip 画像 ダウンロード'),
        op('copy-share', 'cp.copyShare', 'bx-copy', 'share 共有 コピー'),
        op('toggle-theme', 'cp.toggleTheme', 'bx-sun', 'theme dark light テーマ'),
        op('tour', 'cp.tour', 'bx-help-circle', 'tour ガイド ツアー'),
      )
    }
    if (session.logged_in && session.public_uuid) {
      const u = session.public_uuid
      list.unshift({ id: 'mypage', group: 'nb.mypage', label: 'nb.yourPublic', href: P.PROFILE(u), icon: 'bx-user', kw: 'mypage profile 自分 公開ページ' })
      const mine = (id: string, label: string, sub: string, icon: string, kw: string) => list.unshift({ id: 'my' + id, group: 'nb.mypage', label, href: `${P.PROFILE(u)}/${sub}`, icon, kw })
      mine('folder', 'nb.myFolder', 'folder', 'bx-folder-open', 'folder フォルダ 自分')
      mine('gallery', 'nb.myGallery', 'gallery', 'bx-grid-alt', 'gallery ギャラリー 自分')
      mine('graph', 'nb.myGraph', 'graph', 'bx-line-chart', 'graph グラフ 自分')
      mine('awards', 'nb.myAwards', 'awards', 'bx-medal', 'awards アワード 自分')
      list.unshift({ id: 'myrecap', group: 'nb.mypage', label: 'cp.myRecap', href: P.RECAP(u), icon: 'bx-revision', kw: 'recap 振り返り 自分' })
      actions.push({ id: 'copy-mypage', group: 'cp.actions', label: 'cp.copyMyPage', icon: 'bx-share-alt', kw: 'share copy 共有 自分', hint: 'cp.copy',
        run: () => { navigator.clipboard?.writeText(`${window.location.origin}${P.PROFILE(u)}`).catch(() => {}) } })
      actions.push({ id: 'logout', group: 'cp.actions', label: 'nb.logout', run: askLogout, icon: 'bx-log-out', kw: 'logout ログアウト' })
    } else {
      actions.push({ id: 'login', group: 'cp.actions', label: 'cp.xLogin', href: CONFIG.EXTERNAL.X_LOGIN(), icon: 'bx-log-in', kw: 'login ログイン' })
    }
    return [...list, ...actions]
  }, [session, open, dash.toggleTheme, dash.setAccent, i18n])

  const filtered: CpItem[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      const recent = loadRecent().map(id => items.find(it => it.id === id)).filter(Boolean) as CpItem[]
      return [...recent.map(it => ({ ...it, group: 'cp.recent' })), ...items]
    }
    const hits = items
      .map(it => ({ it, sc: Math.max(score(tr(it.label), q) * 1.5, score(it.kw, q)) }))
      .filter(x => x.sc > 0)
      .sort((x, y) => y.sc - x.sc)
      .map(x => x.it)
    // 候補の末尾に「ユーザー/投稿を検索」を常に出す
    hits.push({ id: 'q-user', group: 'nb.search', label: t('cp.userSearch', { q: query.trim() }), icon: 'bx-search', kw: '', href: `${P.SEARCH}?q=${encodeURIComponent(query.trim())}` })
    return hits
  }, [items, query, open, i18n.language])

  const close = useCallback(() => { setOpen(false); setQuery('') }, [])

  const select = useCallback((it: CpItem | undefined) => {
    if (!it) return
    if (!it.id.startsWith('q-')) saveRecent(it.id)
    close()
    if (it.run) it.run()
    else if (it.ext && it.href) window.open(it.href, '_blank', 'noopener')
    else if (it.href) window.location.href = it.href
  }, [close])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        return
      }
      if (e.key === 'Escape' && open) { e.preventDefault(); close() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const groups = useMemo(() => {
    const m = new Map<string, CpItem[]>()
    filtered.forEach(it => { m.set(it.group, [...(m.get(it.group) ?? []), it]) })
    return [...m.entries()]
  }, [filtered])

  return (
    <>
      <LogoutDialog />
    <button type="button" onClick={() => setOpen(true)} aria-label={t('cp.title')} data-cuelume-skip
      className="fixed bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-lg border border-d-border bg-d-med/80 px-2.5 py-1.5 text-xs text-d-text3 backdrop-blur transition-colors hover:text-d-text max-lg:hidden">
      <span className="font-mono">⌘/Ctrl+K</span>
    </button>
      <CommandDialog open={open} onOpenChange={v => { if (v) setOpen(true); else close() }} title={t('cp.title')} description={t('cp.desc')} className="dash-scope !min-h-0 !top-[10vh] sm:max-w-xl">
        <Command shouldFilter={false} className="dash-scope !min-h-0">
          <CommandInput placeholder={t('cp.placeholder')} value={query} onValueChange={setQuery} />
          <CommandList className="max-h-[min(24rem,60vh)]">
            {filtered.length === 0 && <CommandEmpty>{t('cp.empty')}</CommandEmpty>}
            {groups.map(([g, its]) => (
              <CommandGroup key={g} heading={tr(g)}>
                {its.map(it => (
                  <CommandItem key={g + it.id} value={g + it.id} onSelect={() => select(it)}>
                    <i className={`bx ${it.icon} text-d-text3`} />
                    <span>{tr(it.label)}</span>
                    {it.ext && <i className="bx bx-link-external text-d-text3 ml-auto" />}
                    {it.hint && <CommandShortcut>{tr(it.hint)}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="text-d-text3 flex gap-3 border-t border-d-border/50 px-3 py-2 text-xs max-sm:hidden">
            <span>{t('cp.kSelect')}</span><span>{t('cp.kOpen')}</span><span>{t('cp.kClose')}</span><span className="ml-auto">⌘/Ctrl+K</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}
