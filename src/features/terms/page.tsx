import { useTranslation } from 'react-i18next'
import JaOnlyNotice from '@/components/dashboard-ui/JaOnlyNotice'
import { rich } from '@/i18n/rich'
import { useEffect } from 'react'
import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/dashboard-ui/PageHeader'

const SECTIONS: { title: string; body: string[] }[] = [
  { title: '適用', body: [
    'この利用規約（以下「本規約」）は、Lapius7（以下「運営」）が提供する「おはツイKeeper」（以下「本サービス」）の利用条件を定めるものです。',
    '本サービスを利用した時点で、本規約に同意したものとみなします。個人情報の扱いは、別に定める「プライバシーポリシー」に従います。',
  ] },
  { title: 'アカウント', body: [
    'ログインにはXまたはDiscordのアカウントを使います。本サービス独自のパスワードはありません。',
    'アカウントの管理は利用者自身の責任で行ってください。第三者に使わせたり、貸したり、譲ったりすることはできません。',
    'APIキーは利用者本人の責任で管理してください。漏えいや第三者による使用で生じた損害について、運営は責任を負いません。',
  ] },
  { title: '利用できる範囲', body: [
    '本サービスは無料で利用できます。個人が趣味で運営しているため、予告なく機能の追加・変更・終了を行うことがあります。',
    '本サービスは、Xの公開ポストの記録と閲覧を目的としています。登録できるのは、公開されているポストに限ります。',
  ] },
  { title: '禁止事項', body: [
    '次の行為を禁止します。',
    '・法令または公序良俗に反する行為',
    '・他人の権利（著作権、プライバシー、名誉など）を侵害する行為',
    '・他人になりすます行為、虚偽の情報を登録する行為',
    '・本サービスやサーバーに過度な負荷をかける行為（短時間の大量リクエスト、自動化による過剰なアクセスなど）',
    '・APIの利用上限や制限を回避しようとする行為',
    '・不正アクセス、脆弱性の悪用、運営やほかの利用者の妨害となる行為',
    '・本サービスを通じて取得した情報を、本人の同意なく第三者に提供する行為',
    '・その他、運営が不適切と判断する行為',
  ] },
  { title: '登録した内容と公開', body: [
    '利用者が登録したポストの情報は、本サービス上で利用者本人のために保存・表示します。公開設定をオンにしている場合は、公開ページ、ランキング、検索などで第三者にも表示されます。',
    '登録したポストの権利は、元の投稿者に帰属します。運営は、本サービスの提供に必要な範囲でのみ、その情報を保存・表示します。',
    '元のポストがXで削除されても、本サービスに保存した情報は残ることがあります。削除を希望する場合は、運営に連絡してください。',
  ] },
  { title: '外部サービス', body: [
    '本サービスは、XやDiscordなどの外部サービスと連携しています。これらの仕様変更や障害、規約の改定により、本サービスの機能が使えなくなったり、情報を取得できなくなったりすることがあります。',
    '外部サービスの利用には、それぞれの規約が適用されます。',
  ] },
  { title: '利用の停止・削除', body: [
    '運営は、禁止事項に当たる行為があった場合や、運営上必要と判断した場合に、事前の通知なく、利用の制限、アカウントやデータの削除を行うことがあります。',
    '利用者は、運営に連絡することで、いつでもアカウントとデータの削除を依頼できます。',
  ] },
  { title: '免責事項', body: [
    '本サービスは現状のまま提供するもので、正確性、完全性、継続性、特定の目的への適合性を保証しません。表示する数値は、Xから取得した時点のものであり、実際の値と異なることがあります。',
    '本サービスの利用、利用できないこと、データの消失などによって利用者に生じた損害について、運営の故意または重大な過失がある場合を除き、運営は責任を負いません。',
    '運営は、メンテナンスや障害対応のため、本サービスを予告なく停止することがあります。大切なデータは、利用者自身でも保管してください。',
  ] },
  { title: '規約の変更', body: [
    '運営は、必要に応じて本規約を変更できます。変更後の規約は、このページに掲載した時点で効力を生じます。変更後に本サービスを利用した場合は、変更に同意したものとみなします。',
  ] },
  { title: '準拠法・お問い合わせ', body: [
    '本規約は日本法に従って解釈されます。',
    '本サービスに関するお問い合わせは、公式Discordまたは運営のX（@Lapius7）までお願いします。',
  ] },
]

export default function TermsPage() {
  const { t: tr, i18n } = useTranslation()
  const fmtD = (y: number, m: number, d: number) => new Date(y, m - 1, d).toLocaleDateString(i18n.language, { dateStyle: 'long' })
  useEffect(() => { document.title = `${tr('lp.terms')} - おはツイKeeper` }, [tr])
  return (
    <div className="dash-scope min-h-screen bg-d-bg px-4 py-12 text-d-text sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader icon={FileText} title={tr('lp.terms')} desc={tr('lp.updated', { date: fmtD(2026, 10, 3) })} />
        <JaOnlyNotice className="mb-6" />
        <div className="space-y-8 text-sm leading-7 text-d-text2">
          {SECTIONS.map((s, i) => (
            <section key={s.title}>
              <h2 className="mb-2 border-b border-d-border pb-2 text-base font-bold text-d-text">第{i + 1}条（{s.title}）</h2>
              <div className="space-y-2">{s.body.map((t) => <p key={t}>{t}</p>)}</div>
            </section>
          ))}
          <p className="border-t border-d-border pt-4 text-xs text-d-text3">
            {rich(tr, 'lp.toPolicy', { l: <Link to="/policy" className="text-d-text2 hover:text-d-text">{tr('lp.policy')}</Link> })}
          </p>
        </div>
      </div>
    </div>
  )
}
