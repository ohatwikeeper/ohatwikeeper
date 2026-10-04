import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'motion/react'
import { Code2 } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { CONFIG } from '@/lib/config'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'

interface DevStats {
  user_count: number
  record_count: number
  today_users: number
  total_records: number
  service_start: string
  featured_user?: {
    public_uuid: string
    username: string
  }
}

interface SocialLink {
  title: string
  desc: string
  url: string
  icon: string
}

export default function DevPage() {
  const { t: tr } = useTranslation()
  const [stats, setStats] = useState<DevStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = tr('dv.doc')
    
    // API から統計情報を取得
    fetch('/app-api/view/dev-stats')
      .then(r => {
        if (!r.ok) throw new Error('API request failed')
        return r.json()
      })
      .then(data => {
        if (!data || typeof data.user_count !== 'number') {
          throw new Error('Invalid stats data')
        }
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        // 取得失敗時は数値を出さない（0と誤認させない）
        setStats(null)
        setLoading(false)
      })
  }, [])

  const socialGroups: Record<string, SocialLink[]> = {
    Main: [
      { title: 'X (Twitter)', desc: '@Lapius7', url: 'https://jump.lapius7.com/x', icon: 'bxl-twitter' },
      { title: 'GitHub', desc: '@Lapius7', url: 'https://jump.lapius7.com/github', icon: 'bxl-github' },
      { title: 'YouTube', desc: '@Lapius7', url: 'https://jump.lapius7.com/youtube', icon: 'bxl-youtube' },
      { title: 'Twitch', desc: '@Lapius7se', url: 'https://jump.lapius7.com/twitch', icon: 'bxl-twitch' },
      { title: 'Kick', desc: '@lapius7', url: 'https://jump.lapius7.com/kick', icon: 'bx-play-circle' },
      { title: 'TikTok', desc: '@lapius7', url: 'https://jump.lapius7.com/tiktok', icon: 'bxl-tiktok' },
      { title: 'BlueSky', desc: '@lapius7.bsky.social', url: 'https://jump.lapius7.com/bsky', icon: 'bx-cloud' },
      { title: 'Pixiv', desc: '@lapius7', url: 'https://jump.lapius7.com/pixiv', icon: 'bx-image-alt' },
      { title: 'Booth', desc: '@lapius7', url: 'https://jump.lapius7.com/booth', icon: 'bx-store' },
      { title: 'Discord', desc: tr('dv.official'), url: 'https://jump.lapius7.com/discord', icon: 'bxl-discord-alt' },
    ],
    Blog: [
      { title: 'Note', desc: '@lapius7', url: 'https://jump.lapius7.com/note', icon: 'bx-note' },
      { title: 'HatenaBlog', desc: '@lapius7', url: 'https://jump.lapius7.com/hatenablog', icon: 'bxl-blogger' },
    ],
    Misskey: [
      { title: 'Misskey.io', desc: '@lapius', url: 'https://jump.lapius7.com/misskey', icon: 'bx-feather' },
      { title: 'Misskey Bot', desc: '@lapius_bot', url: 'https://jump.lapius7.com/misskey-bot', icon: 'bx-bot' },
      { title: tr('dv.misskeyOrig'), desc: '@lapius_design', url: 'https://jump.lapius7.com/misskey_design', icon: 'bx-palette' },
      { title: 'Submarin', desc: '@lapius', url: 'https://jump.lapius7.com/misskey_submarin', icon: 'bx-radio' },
      { title: tr('dv.nirila'), desc: '@lapius', url: 'https://jump.lapius7.com/misskey_nirila', icon: 'bx-feather' },
      { title: 'ぶいちゃ.social', desc: '@lapius', url: 'https://jump.lapius7.com/misskey_buicha', icon: 'bx-feather' },
    ],
    Game: [
      { title: 'VRChat User', desc: '@lapius7', url: 'https://jump.lapius7.com/vrc', icon: 'bx-glasses' },
      { title: 'Pulse', desc: tr('dv.gamelib'), url: 'https://jump.lapius7.com/pulse', icon: 'bx-joystick' },
    ],
    Dev: [
      { title: 'Zenn', desc: '@lapius7', url: 'https://jump.lapius7.com/zenn', icon: 'bx-book' },
      { title: 'StackOverflow', desc: '@lapius7', url: 'https://jump.lapius7.com/sof', icon: 'bxl-stack-overflow' },
    ],
    Other: [
      { title: 'Mastodon', desc: '@lapius7', url: 'https://jump.lapius7.com/mastodon', icon: 'bxl-mastodon' },
      { title: 'Patreon', desc: '@lapius7', url: 'https://jump.lapius7.com/patreon', icon: 'bxl-patreon' },
      { title: 'Mixi', desc: '@lapius7', url: 'https://jump.lapius7.com/mixi', icon: 'bx-user' },
      { title: 'Marshmallow', desc: '@lapius7', url: 'https://jump.lapius7.com/marshmallow', icon: 'bx-envelope' },
      { title: 'Giftee', desc: '@lapius7', url: 'https://jump.lapius7.com/giftee', icon: 'bx-gift' },
      { title: tr('dv.music'), desc: 'LikeMusicList', url: 'https://jump.lapius7.com/favoritemusiclist', icon: 'bx-music' },
      { title: tr('dv.gameLine'), desc: 'Game LINE', url: 'https://jump.lapius7.com/officialline_game', icon: 'bxl-line' },
    ],
  }

  const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '—')
  const statItems = [
    { label: 'Total Users', value: fmt(stats?.user_count) },
    { label: 'Total Records', value: fmt(stats?.record_count) },
    { label: 'Today Users', value: fmt(stats?.today_users) },
    { label: 'Service Start', value: stats?.service_start ?? '2025/09/29' },
  ]

  // 左に見出し・右に内容の2カラム。区切りは線で表現する
  const Section = ({ title, sub, children, delay, first }: { title: string; sub?: string; children: React.ReactNode; delay: number; first?: boolean }) => (
    <motion.section
      className={`grid gap-6 py-10 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12${first ? '' : ' border-t border-d-border'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div>
        <h2 className="text-lg font-bold text-d-text md:sticky md:top-20">{title}</h2>
        {sub && <p className="mt-1 text-xs text-d-text3">{sub}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </motion.section>
  )

  return (
    <div className="dash-scope min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <PageHeader icon={Code2} title={tr('dv.title')} desc={tr('dv.desc')} />

        <motion.dl
          className="grid grid-cols-2 gap-y-6 border-y border-d-border py-6 md:grid-cols-4 md:divide-x md:divide-d-border"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}
        >
          {loading
            ? statItems.map((x) => (
                <div key={x.label} className="px-0 md:px-6 first:md:pl-0">
                  <dt className="text-[11px] uppercase tracking-wider text-d-text3">{x.label}</dt>
                  <Skeleton className="mt-2 h-8 w-24 rounded bg-d-light" />
                </div>
              ))
            : statItems.map((x) => (
                <div key={x.label} className="px-0 md:px-6 first:md:pl-0">
                  <dt className="text-[11px] uppercase tracking-wider text-d-text3">{x.label}</dt>
                  <dd className="mt-2 text-2xl font-bold tabular-nums text-d-text">{x.value}</dd>
                </div>
              ))}
        </motion.dl>
        {!loading && !stats && <p className="mt-3 text-xs text-d-text3">{tr('dv.noStats')}</p>}

        <div className="mt-2">
          <Section title={tr('dv.profile')} sub={tr('dv.about')} delay={0.12} first>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)]">
              {[
                [tr('dv.name'), '狐ノ瀬つづり（Lapius7）'],
                [tr('dv.role'), tr('dv.roleV')],
                [tr('dv.op'), tr('dv.opV')],
                [tr('dv.contact'), null],
              ].map(([k, v]) => (
                <div key={k as string} className="contents">
                  <dt className="text-d-text3">{k}</dt>
                  <dd className="text-d-text">
                    {v ?? (<><a className="text-d-text2 hover:text-d-text" href="https://x.com/Lapius7" target="_blank" rel="noopener noreferrer">X（@Lapius7）</a>、<a className="text-d-text2 hover:text-d-text" href={CONFIG.EXTERNAL.DISCORD} target="_blank" rel="noopener noreferrer">{tr('dv.discord')}</a></>)}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={tr('dv.stack')} sub={tr('dv.stackSub')} delay={0.14}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)]">
              {[
                [tr('dv.sUi'), 'React・TypeScript・Vite・Tailwind CSS・shadcn/ui'],
                [tr('dv.sSrv'), 'Node.js・Hono（TypeScript）'],
                [tr('dv.sDb'), 'MySQL（MariaDB）'],
                [tr('dv.sAuth'), tr('dv.sAuthV')],
                [tr('dv.sApi'), tr('dv.sApiV')],
                [tr('dv.sOps'), tr('dv.sOpsV')],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-d-text3">{k}</dt>
                  <dd className="text-d-text">{v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={tr('dv.support')} sub={tr('dv.supportSub')} delay={0.18}>
            <ul className="space-y-2 text-sm text-d-text2">
              <li><Link to="/howtouse" className="text-d-text2 hover:text-d-text">{tr('dv.lGuide')}</Link>{tr('dv.lGuideD')}</li>
              <li><a href="/api-docs" className="text-d-text2 hover:text-d-text">{tr('dv.lApi')}</a>{tr('dv.lApiD')}</li>
              <li><Link to="/terms" className="text-d-text2 hover:text-d-text">{tr('dv.lTerms')}</Link>・<Link to="/policy" className="text-d-text2 hover:text-d-text">{tr('dv.lPolicy')}</Link>{tr('dv.lLegalD')}</li>
              <li>{tr('dv.bugs')}<a className="text-d-text2 hover:text-d-text" href={CONFIG.EXTERNAL.DISCORD} target="_blank" rel="noopener noreferrer">{tr('dv.discord')}</a>{tr('dv.bugsEnd')}</li>
            </ul>
          </Section>

          <Section title={tr('dv.sns')} sub="Social Links" delay={0.2}>
            <div className="space-y-8">
              {Object.entries(socialGroups).map(([groupName, links], gi) => (
                <div key={groupName}>
                  {gi > 0 && <Separator className="mb-8" />}
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-d-text3">{groupName}</h3>
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {links.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 border-b border-d-border/60 py-2.5 !text-d-text">
                        <i className={`bx ${link.icon} w-6 shrink-0 text-center text-xl text-d-text2`} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{link.title}</span>
                        <span className="truncate text-xs text-d-text3">{link.desc}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
