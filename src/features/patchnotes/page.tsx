import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'

interface PatchChange {
  type: 'new' | 'update' | 'fix' | 'performance' | 'security' | 'note'
  text: string
  image?: string
}

interface PatchNote {
  version: string
  title: string
  date: string
  changes: PatchChange[]
}

const DEFAULT_NOTES: PatchNote[] = [
  {
    version: '3.0.0',
    title: 'サイト全体を React で刷新 — 操作性・見た目・使い方ガイドを大幅アップデート',
    date: '2026-10-04',
    changes: [
      { type: 'new', text: 'サイト全体を React のシングルページ構成へ移行。ページ移動が高速になり、画面のちらつきがなくなりました' },
      { type: 'new', text: 'サイドメニューを開閉できるように。開閉状態は次回も保持されます' },
      { type: 'new', text: '全ページの上部にパンくずリストを表示し、今いる場所がひと目で分かるように' },
      { type: 'new', text: '使い方ガイドを「章 → ページ」の階層に再構成し、目次ツリーと新しい章（基本機能／高度な機能）を追加' },
      { type: 'new', text: 'グラフページに期間選択を追加。ダッシュボードの「Select dates」と同じ操作で期間を絞り込めます' },
      { type: 'update', text: 'ツイートURL抽出・過去のおはツイ検索の2ツールを新デザインに刷新' },
      { type: 'note', text: '移行に伴い画面の作りが大きく変わっています。以前のURL（.php など）は引き続きアクセスできます' },
    ],
  },
  {
    version: '2.0.0',
    title: 'React SPA への完全移行 & ダッシュボード全面リニューアル',
    date: '2026-10-01',
    changes: [
      { type: 'new', text: 'React 18 + Vite による高速・シームレスなSPAルーティングの導入' },
      { type: 'new', text: 'ダーク＆マットUIによるモダンで洗練されたダッシュボードデザイン' },
      { type: 'update', text: 'Node/HonoによるバックエンドAPI基盤の刷新と高速化' },
      { type: 'update', text: '短縮リンク管理 (r-links) および通知センターのUI改善' },
      { type: 'fix', text: '特定環境におけるグラフレンダリングの不具合を修正' },
    ],
  },
  {
    version: '1.4.0',
    title: '短縮リンク管理 (r-links) & 公式CLI「ohax」公開',
    date: '2026-08-15',
    changes: [
      { type: 'new', text: '自分だけの短縮リンクを作成・解析できる「r-links」機能を追加' },
      { type: 'new', text: 'ターミナルでグラフや草カレンダーを表示できる公式CLI「ohax」をリリース' },
      { type: 'update', text: '公開ページ用短縮ドメイン ohax.pw への完全対応' },
    ],
  },
  {
    version: '1.3.0',
    title: 'フォルダ機能 & ユーザー対決 (Diff) ページの追加',
    date: '2026-06-20',
    changes: [
      { type: 'new', text: 'おはツイをテーマ別に整理・共有できる「フォルダ管理」機能を実装' },
      { type: 'new', text: '2人のユーザーの継続日数やいいね数を比較できる「Diff」機能を追加' },
      { type: 'performance', text: '画像キャッシュ生成の効率化と表示速度の改善' },
    ],
  },
  {
    version: '1.2.0',
    title: 'アワードシステム & 月次レポート (Recap)',
    date: '2026-04-10',
    changes: [
      { type: 'new', text: '継続投稿日数や累計いいね数に応じた「アワード（称号）」バッジシステムを公開' },
      { type: 'new', text: '月ごとの活動を振り返る「おはツイ振り返り (Recap)」機能を実装' },
      { type: 'update', text: 'Discord Webhook 通知のペイロード仕様を拡張' },
    ],
  },
  {
    version: '1.1.0',
    title: 'Chrome / Firefox 拡張機能の提供開始',
    date: '2026-02-01',
    changes: [
      { type: 'new', text: 'Xの投稿画面から離れずにワンクリックでおはツイを保存できるブラウザ拡張機能を公開' },
      { type: 'security', text: 'APIキー認証のセキュリティ強化' },
      { type: 'fix', text: '非公開ツイート判定時のエラーハンドリングを改善' },
    ],
  },
  {
    version: '1.0.0',
    title: 'おはツイKeeper 正式リリース',
    date: '2025-11-01',
    changes: [
      { type: 'new', text: 'おはツイKeeper 正式サービス開始' },
      { type: 'new', text: 'おはツイの自動保存、ダッシュボード、推移グラフ、固有共有ページ機能' },
    ],
  },
]

const TAG_CONFIG = {
  new: { label: '新機能', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  update: { label: '改善', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  fix: { label: '修正', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  performance: { label: '高速化', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  security: { label: 'セキュリティ', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  note: { label: '備考', bg: 'bg-d-med text-d-text2 border-d-border' },
}

export default function PatchNotesPage() {
  const { t: tr } = useTranslation()
  const { version: routeVersion } = useParams<{ version?: string }>()
  const [notes, setNotes] = useState<PatchNote[]>(DEFAULT_NOTES)
  // 管理画面で登録したパッチノートを優先。取得失敗・0件なら静的データのまま
  useEffect(() => {
    fetch('/app-api/patchnotes').then((r) => r.json()).then((d) => { if (Array.isArray(d.notes) && d.notes.length) setNotes(d.notes) }).catch(() => {})
  }, [])

  // v接頭辞の有無に関わらず一致判定
  const cleanRouteVersion = routeVersion ? routeVersion.replace(/^v/, '') : null
  const singleNote = cleanRouteVersion
    ? notes.find((n) => n.version === cleanRouteVersion) || null
    : null

  const singleIndex = singleNote ? notes.findIndex((n) => n.version === singleNote.version) : -1
  const prevNote = singleIndex > 0 ? notes[singleIndex - 1] : null
  const nextNote = singleIndex >= 0 && singleIndex < notes.length - 1 ? notes[singleIndex + 1] : null

  useEffect(() => {
    if (singleNote) {
      document.title = `${tr('lp.pnDetail', { v: singleNote.version })} - おはツイKeeper`
    } else {
      document.title = `${tr('lp.pnTitle')} - おはツイKeeper`
    }
  }, [singleNote, tr])

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <PageHeader
          icon={ScrollText}
          title={singleNote ? `Update v${singleNote.version}` : tr('lp.pnTitle')}
          desc={singleNote
            ? tr('lp.pnDetailDesc', { v: singleNote.version })
            : tr('lp.pnDesc')}
        />

        {/* Single Note View */}
        {singleNote ? (
          <div className="space-y-6">
            <div className="bg-d-card border border-d-border rounded-xl p-6 sm:p-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-d-border/60">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-d-text !text-d-bg font-mono text-sm font-bold">
                    v{singleNote.version}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-d-text">
                    {singleNote.title}
                  </h2>
                </div>
                <span className="text-xs text-d-text3 font-mono">{tr('lp.pnDate', { date: singleNote.date })}</span>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold tracking-wider uppercase text-d-text3">{tr('lp.pnChanges')}</h3>
                <ul className="space-y-3">
                  {singleNote.changes.map((item, idx) => {
                    const tag = TAG_CONFIG[item.type] || TAG_CONFIG.note
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border shrink-0 mt-0.5 ${tag.bg}`}>
                          {tag.label}
                        </span>
                        <span className="text-d-text2 leading-relaxed">{item.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* Prev / Next Version Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {prevNote ? (
                <Link
                  to={`/patchnote/v${prevNote.version}`}
                  className="p-4 bg-d-card border border-d-border hover:border-d-text3 rounded-xl text-left transition-all group block"
                >
                  <div className="text-[11px] text-d-text3 mb-1 flex items-center gap-1 group-hover:text-d-text transition-colors">
                    <i className="bx bx-left-arrow-alt" /> {tr('lp.pnNewer')}
                  </div>
                  <div className="text-xs font-bold text-d-text truncate">
                    v{prevNote.version}: {prevNote.title}
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextNote ? (
                <Link
                  to={`/patchnote/v${nextNote.version}`}
                  className="p-4 bg-d-card border border-d-border hover:border-d-text3 rounded-xl text-right transition-all group block"
                >
                  <div className="text-[11px] text-d-text3 mb-1 flex items-center justify-end gap-1 group-hover:text-d-text transition-colors">
                    {tr('lp.pnOlder')} <i className="bx bx-right-arrow-alt" />
                  </div>
                  <div className="text-xs font-bold text-d-text truncate">
                    v{nextNote.version}: {nextNote.title}
                  </div>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        ) : (
          /* Full Timeline View */
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-d-border/60">
            {notes.map((note) => (
              <div key={note.version} className="relative pl-10">
                {/* Bullet */}
                <div className="absolute left-1 top-2 w-5 h-5 rounded-full bg-d-card border-2 border-d-text3 flex items-center justify-center" />

                <div className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-d-border/60">
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={`/patchnote/v${note.version}`}
                        className="px-2.5 py-0.5 rounded-full bg-d-text !text-d-bg font-mono text-xs font-bold hover:opacity-90 transition-opacity"
                        title={tr('lp.pnOpen')}
                      >
                        v{note.version}
                      </Link>
                      <h2 className="text-lg font-bold text-d-text">
                        <Link
                          to={`/patchnote/v${note.version}`}
                          className="hover:text-d-text transition-colors"
                        >
                          {note.title}
                        </Link>
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-d-text3 font-mono">{note.date}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 pt-2">
                    {note.changes.map((item, idx) => {
                      const tag = TAG_CONFIG[item.type] || TAG_CONFIG.note
                      return (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 mt-0.5 ${tag.bg}`}>
                            {tag.label}
                          </span>
                          <span className="text-d-text2 leading-relaxed">{item.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
