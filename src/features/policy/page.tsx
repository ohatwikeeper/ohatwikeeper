import { useTranslation } from 'react-i18next'
import JaOnlyNotice from '@/components/dashboard-ui/JaOnlyNotice'
import { rich } from '@/i18n/rich'
import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/dashboard-ui/PageHeader'

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-d-text">{children}</strong>

const SECTIONS: { title: string; body: React.ReactNode[] }[] = [
  { title: '収集する情報', body: [
    '本サービスでは、以下の情報を収集します。',
    <ul key="l" className="list-disc space-y-2 pl-5">
      <li><B>ソーシャルログイン情報:</B> DiscordまたはX（旧Twitter）でログインする際に、各社から提供されるユーザーID、ユーザー名、プロフィール情報を取得します。</li>
      <li><B>X・Discord連携情報:</B> 中核機能を提供するため、各APIを利用するための認証情報（OAuthトークン）を安全に保管します。</li>
      <li><B>Discordサーバー参加:</B> Discordでログインすると、利用案内・サポートのため、おはツイKeeper公式Discordサーバー（ID: 1423901289175187566）に自動的に参加します。参加後はDiscordの設定からいつでも退出できます。</li>
      <li><B>投稿データ:</B> 利用者が登録したXの投稿の詳細情報（URL、本文、日時、エンゲージメント数、画像URL等）を保存します。</li>
      <li><B>ブラウザ拡張機能データ:</B> 専用の拡張機能を通じて、利用者が明示的に保存・分析を指示したデータ。</li>
      <li><B>アクセスログ:</B> セキュリティ確保と不正利用防止のため、IPアドレス、ブラウザの種類、アクセス日時などを収集します。</li>
      <li><B>APIキー:</B> 外部連携用に利用者が生成したAPIキー。</li>
    </ul>,
  ] },
  { title: '利用目的', body: [
    '収集した情報は、以下の目的で利用します。',
    <ul key="l" className="list-disc space-y-1.5 pl-5">
      <li>本サービスの提供、維持、改善のため。</li>
      <li>ユーザーごとのダッシュボード、統計解析、公開ページの提供のため。</li>
      <li>お問い合わせへの対応および本人確認のため。</li>
      <li>不正行為（スパム、システム負荷等）の防止および対応のため。</li>
      <li>サービス向上を目的とした統計データの作成のため。</li>
    </ul>,
  ] },
  { title: '情報の第三者提供', body: [
    '運営は、以下の場合を除き、利用者の同意なく第三者に個人情報を提供しません。',
    <ul key="l" className="list-disc space-y-1.5 pl-5">
      <li>法令に基づき開示が求められた場合。</li>
      <li>利用者自身が「公開」設定にしたページを第三者が閲覧する場合。</li>
      <li>人の生命、身体または財産の保護のために緊急の必要がある場合。</li>
    </ul>,
  ] },
  { title: '利用者の権利とデータ管理', body: [
    '利用者は、自身のデータに対して以下の権利を持ちます。',
    <ul key="l" className="list-disc space-y-2 pl-5">
      <li><B>データの削除:</B> ダッシュボードから個別の投稿データや連携情報をいつでも削除できます。</li>
      <li><B>アカウントの削除:</B> アカウント全体の削除は、公式Discordまたは下記の窓口に連絡してください。</li>
    </ul>,
  ] },
  { title: '外部サービスの利用', body: [
    '機能提供のために以下の外部サービス等を利用しており、各社のポリシーが適用される場合があります。',
    <ul key="l" className="list-disc space-y-1 pl-5">
      <li>X (Twitter) API / Discord API</li>
      <li>Google Fonts / Boxicons</li>
      <li>Analytics (Rybbit / Umami)</li>
    </ul>,
  ] },
  { title: '免責事項', body: [
    '運営は、Xの仕様変更、APIの停止、または予期せぬ事故によりサービスが停止・終了した場合に生じた損害について、一切の責任を負いません。データのバックアップは適宜行ってください。',
  ] },
  { title: '本ポリシーの変更', body: [
    '運営は、必要に応じて本ポリシーを改定することがあります。重要な変更は公式サイト内でお知らせします。',
  ] },
  { title: 'お問い合わせ', body: [
    <>本ポリシーに関するお問い合わせは、<a href="https://discord.ohatwikeeper.com" target="_blank" rel="noopener noreferrer" className="text-d-text2 hover:text-d-text">公式Discordサーバー</a>、または <a href="mailto:contact@ohatwikeeper.com" className="text-d-text2 hover:text-d-text">contact@ohatwikeeper.com</a> までお願いします。</>,
  ] },
  { title: '運営情報', body: [
    <><B>名称:</B> Lapius7 開発チーム / おはツイKeeper開発部</>,
    <><B>代表者:</B> 狐ノ瀬つづり（<a href="https://x.com/Lapius7" target="_blank" rel="noopener noreferrer" className="text-d-text2 hover:text-d-text">X: @Lapius7</a>）</>,
  ] },
]

export default function PolicyPage() {
  const { t: tr, i18n } = useTranslation()
  const fmtD = (y: number, m: number, d: number) => new Date(y, m - 1, d).toLocaleDateString(i18n.language, { dateStyle: 'long' })
  useEffect(() => { document.title = `${tr('lp.policy')} - おはツイKeeper` }, [tr])
  return (
    <div className="dash-scope min-h-screen bg-d-bg px-4 py-12 text-d-text sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader icon={ShieldCheck} title={tr('lp.policy')} desc={tr('lp.updated', { date: fmtD(2026, 3, 11) })} />
        <JaOnlyNotice className="mb-6" />
        <div className="space-y-8 text-sm leading-7 text-d-text2">
          <p>
            おはツイKeeper（以下「本サービス」）は、Lapius7（以下「運営」）が提供するサービスです。運営は、利用者の個人情報の保護を重要な責務の一つと考え、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </p>
          {SECTIONS.map((s, i) => (
            <section key={s.title}>
              <h2 className="mb-2 border-b border-d-border pb-2 text-base font-bold text-d-text">第{i + 1}条（{s.title}）</h2>
              <div className="space-y-2">{s.body.map((t, j) => (typeof t === 'object' && (t as { type?: string }).type === 'ul' ? <div key={j}>{t}</div> : <p key={j}>{t}</p>))}</div>
            </section>
          ))}
          <p className="border-t border-d-border pt-4 text-xs text-d-text3">
            {rich(tr, 'lp.toTerms', { l: <Link to="/terms" className="text-d-text2 hover:text-d-text">{tr('lp.terms')}</Link> })}
          </p>
        </div>
      </div>
    </div>
  )
}
