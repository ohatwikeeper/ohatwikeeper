import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { IS_BETA } from '@/lib/beta/env'

const LEGAL: [string, string][] = [['/patchnote', 'footer.updates'], ['/policy', 'footer.policy'], ['/terms', 'footer.terms'], ['/dev', 'footer.dev']]

const XIcon = () => <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
const DiscordIcon = () => <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor" aria-hidden><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.08.08 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419s.955-2.418 2.157-2.418c1.21 0 2.176 1.095 2.157 2.418 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.418 2.157-2.418c1.21 0 2.176 1.095 2.157 2.418 0 1.333-.947 2.419-2.157 2.419z" /></svg>
const GitHubIcon = () => <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor" aria-hidden><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>

const SNS: { href: string; label: string; Icon: () => React.ReactElement }[] = [
  { href: 'https://x.com/ohatwikeeper', label: '@ohatwikeeper', Icon: XIcon },
  { href: 'https://x.com/Lapius7', label: '@Lapius7', Icon: XIcon },
  { href: 'https://discord.ohatwikeeper.com', label: 'Discord', Icon: DiscordIcon },
  { href: 'https://github.com/ohatwikeeper/ohatwikeeper', label: 'GitHub', Icon: GitHubIcon },
]

const link = 'inline-flex items-center gap-1.5 whitespace-nowrap text-xs !text-d-text2 transition-colors hover:!text-d-accent'

/** beta 限定: 本番との差(コミット数・変更ファイル数) */
function BetaDiff() {
  const [d, setD] = useState<{ c: number; f: number } | null>(null)
  useEffect(() => {
    fetch('/app-api/beta-info').then((r) => r.json()).then((j) => setD({ c: j.commits?.length ?? 0, f: j.files?.length ?? 0 })).catch(() => {})
  }, [])
  if (!d) return null
  return <div className="text-[10px] text-d-text3"><Link to="/beta/diff" className="hover:text-d-text2 hover:underline">本番との差: {d.c}コミット / {d.f}ファイル</Link></div>
}

/** サイドバー下部のフッター(カードなし) */
declare const __BUILD_VERSION__: string
declare const __BUILD_COMMIT__: string
declare const __BUILD_REPO__: string

export default function SiteFooter() {
  const { t } = useTranslation()
  return (
    <footer className="mt-auto space-y-3 border-t border-d-border/70 pt-5 pb-16">
      <Link to="/" className="block !text-d-text">
        <span className="whitespace-nowrap text-sm font-extrabold tracking-tight">おはツイKeeper</span>
      </Link>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGAL.map(([to, l]) => <Link key={to} to={to} className={link}>{t(l)}</Link>)}
        <a href="https://status.ohatwikeeper.com" target="_blank" rel="noopener noreferrer" className={link}>{t('footer.status')}</a>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {SNS.map(({ href, label, Icon }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={link}><Icon />{label}</a>
        ))}
      </div>
      <div className="text-[11px] text-d-text3">© {new Date().getFullYear()} おはツイKeeper by 狐ノ瀬つづり</div>
      {IS_BETA && <BetaDiff />}
      <div className="select-text font-mono text-[10px] text-d-text3" title={t('footer.build')}><a href={`https://github.com/ohatwikeeper/${__BUILD_REPO__}/commit/${__BUILD_COMMIT__}`} target="_blank" rel="noopener noreferrer" className="hover:text-d-text2 hover:underline">{__BUILD_VERSION__}</a></div>
    </footer>
  )
}
