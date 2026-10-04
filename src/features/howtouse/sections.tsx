import React from 'react'
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link } from 'react-router-dom'
import { CONFIG } from '@/lib/config'

export interface DocSection {
  id: string
  title: string
  shortTitle: string
  icon: string
  category: '導入' | '基本機能' | '高度な機能' | '連携・サポート' | 'API・開発者向け'
  content: React.ReactNode
}

// 文書用の最小限の部品。装飾はせず、見出し・本文・表・コードだけで構成する
export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 mb-3 border-b border-d-border pb-2 text-lg font-bold text-d-text first:mt-0">{children}</h2>
)
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mt-6 mb-2 text-sm font-bold text-d-text">{children}</h3>
const P = ({ children }: { children: React.ReactNode }) => <p className="my-3 text-sm leading-7 text-d-text2">{children}</p>
const UL = ({ children }: { children: React.ReactNode }) => <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-7 text-d-text2 marker:text-d-text3">{children}</ul>
const OL = ({ children }: { children: React.ReactNode }) => <ol className="my-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-d-text2 marker:font-semibold marker:text-d-text3">{children}</ol>
const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-d-text">{children}</strong>
const C = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-d-med px-1 py-0.5 font-mono text-[12px] text-d-text">{children}</code>
const A = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const ext = /^https?:/.test(href)
  // /api-docs は SPA ではなく Node が返すページなので通常のリンクで開く
  return ext || href.startsWith('/api-docs')
    ? <a href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="text-d-text2 hover:text-d-text">{children}</a>
    : <Link to={href} className="text-d-text2 hover:text-d-text">{children}</Link>
}
const Note = ({ title = '補足', children }: { title?: string; children: React.ReactNode }) => (
  <div className="my-4 border-l-2 border-d-border pl-4 text-sm leading-7 text-d-text2">
    <div className="text-xs font-bold text-d-text">{title}</div>
    {children}
  </div>
)
const Code = ({ children }: { children: string }) => (
  <pre className="my-3 overflow-x-auto rounded-lg border border-d-border bg-d-bg p-3 font-mono text-xs leading-6 text-d-text"><code>{children}</code></pre>
)
const Table = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div className="my-4 overflow-x-auto rounded-lg border border-d-border">
    <UITable className="w-full text-left text-sm">
      <TableHeader className="bg-d-med text-xs text-d-text3">
        <TableRow>{head.map((h) => <TableHead key={h} className="px-3 py-2 font-semibold">{h}</TableHead>)}</TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-d-border text-d-text2">
        {rows.map((r, i) => <TableRow key={i}>{r.map((c, j) => <TableCell key={j} className={`px-3 py-2 align-top leading-6 ${j === 0 ? 'whitespace-nowrap font-medium text-d-text' : ''}`}>{c}</TableCell>)}</TableRow>)}
      </TableBody>
    </UITable>
  </div>
)

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'start',
    title: 'はじめに・アカウント登録',
    shortTitle: 'はじめに・登録',
    icon: 'bx-rocket',
    category: '導入',
    content: (
      <>
        <H2>おはツイKeeperとは</H2>
        <P>
          X（旧Twitter）に毎朝投稿する「おはようツイート」を記録し、いいね数・表示回数の推移、連続投稿日数、称号（アワード）として振り返れるサービスです。すべての機能を無料で使えます。登録件数やグラフの表示件数に上限はありません。
        </P>
        <Table
          head={['できること', '内容']}
          rows={[
            ['記録', 'ポストのURLを貼る、または拡張機能・CLIから登録します。いいね・表示・リポスト・返信は自動で更新されます。'],
            ['分析', 'グラフ、草カレンダー、曜日別・時間帯別の傾向を見られます。'],
            ['称号とランキング', '投稿数・連続日数・反応数に応じてアワードが付き、公開しているユーザー同士で順位が出ます。'],
            ['共有', '自分専用の公開ページ（ohax.pw/UUID）が作られ、Xに貼ると最新の数値入りのカードが表示されます。'],
          ]}
        />

        <H2>アカウント登録とログイン</H2>
        <P>
          独自のパスワードはありません。XまたはDiscordのアカウントでログインすると、初回ログイン時にアカウントが作られます。
        </P>
        <H3>Xでログインする</H3>
        <P>
          おはツイを投稿しているXアカウントでログインしてください。ユーザー名・アイコン・表示名が同期され、過去のポストも取り込めます。取得する情報はプロフィール（名前・アイコン・ユーザー名）とログインに必要な基本情報だけです。
        </P>
        <H3>Discordでログインする</H3>
        <P>
          Discordでログインすると、公式Discordサーバーに参加でき、障害情報や新機能のお知らせを受け取れます。取得する情報はプロフィール（名前・アバター・ユーザー名）、メールアドレス、公式サーバーへの参加（guilds.join）です。
        </P>
        <Note>
          XとDiscordは両方連携できます。ログイン後に<A href={'/settings'}>設定</A>から、もう一方を追加してください。
        </Note>

        <H2>最初にやること</H2>
        <OL>
          <li>XまたはDiscordでログインします。</li>
          <li>ダッシュボード上部の入力欄に、おはツイのURLを貼って登録します。詳しくは「ダッシュボードと記録」を見てください。</li>
          <li>過去の分は「一括登録」か、<A href="/tools">便利ツール</A>のtweet.js抽出でまとめて登録できます。</li>
          <li>毎日の登録を楽にしたい場合は、<A href={CONFIG.PAGES.EXTENSIONS}>ブラウザ拡張機能</A>を入れます。</li>
          <li>自分のページを公開したくない場合は、設定で公開をオフにします。</li>
        </OL>

        <H2>困ったとき・連絡先</H2>
        <P>
          不具合の報告や要望は、<A href="https://discord.ohatwikeeper.com">公式Discord</A>または開発者の<A href="https://x.com/Lapius7">X（@Lapius7）</A>で受け付けています。
        </P>
      </>
    ),
  },
  {
    id: 'pages',
    title: '画面一覧',
    shortTitle: '画面一覧',
    icon: 'bx-map',
    category: '導入',
    content: (
      <>
        <H2>ログイン後に使う画面</H2>
        <Table
          head={['画面', 'URL', '用途']}
          rows={[
            ['ダッシュボード', <C key="a">/dashboard</C>, '記録の登録・一覧・更新・削除。統計と草カレンダーもここです。'],
            ['通知', <C key="b">/notification</C>, 'お知らせとアワード達成の確認。'],
            ['フォルダ', <C key="c">/folder</C>, '投稿をテーマ別にまとめて公開。'],
            ['振り返り', <C key="d">/recap</C>, '月ごとの記録の振り返り。'],
            ['便利ツール', <C key="e">/tools</C>, 'tweet.jsからのURL抽出、過去のおはツイ検索。'],
            ['設定', <C key="f">/settings</C>, '公開設定、通知、Webhook、APIキー、ウィジェット。'],
            ['短縮リンク', <C key="g">/r-links</C>, 'go.ohax.pw の短縮URLの発行と解析。'],
          ]}
        />
        <H2>誰でも見られる画面</H2>
        <Table
          head={['画面', 'URL', '用途']}
          rows={[
            ['ランキング', <C key="a">/ranking</C>, 'ランキング。カレンダーで期間(今日・日付・範囲・全期間)を絞って並び替えできます。'],
            ['横断検索', <C key="b">/search</C>, '投稿とユーザーの検索。'],
            ['比較', <C key="c">/diff</C>, '2人のユーザーを並べて比較。'],
            ['アワード一覧', <C key="d">/awards</C>, 'アワードの種類と条件。'],
            ['パッチノート', <C key="e">/patchnote</C>, '更新履歴。'],
            ['拡張機能・CLI', <><C key="f">/extensions/oneclick_add</C><br /><C key="g">/cli</C></>, 'ブラウザ拡張機能とCLIの案内。'],
          ]}
        />
        <H2>ユーザーごとの公開ページ</H2>
        <P>
          <C>/あなたのUUID</C> があなた専用の公開ページです。ここから次のページに移れます。公開設定をオフにすると、本人以外には見えません。
        </P>
        <Table
          head={['URL', '内容']}
          rows={[
            [<C key="a">/UUID</C>, 'プロフィールと投稿一覧'],
            [<C key="b">/UUID/graph</C>, '推移グラフ'],
            [<C key="c">/UUID/grass</C>, '草カレンダー'],
            [<C key="d">/UUID/awards</C>, '獲得したアワード'],
            [<C key="e">/UUID/gallery</C>, '画像の一覧'],
            [<C key="f">/UUID/recap</C>, '月ごとの振り返り'],
            [<C key="g">/UUID/folder</C>, '公開しているフォルダ'],
          ]}
        />
      </>
    ),
  },
  {
    id: 'dashboard',
    title: 'ダッシュボードと記録',
    shortTitle: 'ダッシュボード',
    icon: 'bxs-dashboard',
    category: '基本機能',
    content: (
      <>
        <H2>ダッシュボードの見方</H2>
        <P>ログイン後に最初に開く画面です。上から順に次の情報が並びます。</P>
        <UL>
          <li><B>登録欄</B>：ポストのURLを貼る入力欄と、一括登録ボタン。</li>
          <li><B>統計</B>：総投稿数、累計いいね数、平均反応、現在の連続日数。</li>
          <li><B>草カレンダー</B>：投稿した日が色付きで並びます。</li>
          <li><B>投稿一覧</B>：日付順・いいね順で並び、クリックすると詳細が開きます。</li>
        </UL>

        <H2>おはツイを登録する</H2>
        <H3>1件ずつ登録する</H3>
        <P>
          ダッシュボード上部の入力欄に、XのポストURLを貼って「登録」を押します。Xのアプリやブラウザの「リンクをコピー」で取れるURLをそのまま使えます。
        </P>
        <Code>{`https://x.com/username/status/1841234567890123456`}</Code>
        <H3>まとめて登録する</H3>
        <P>
          「一括登録」を開き、1行に1つずつURLを貼ります。1回に最大100件まで登録でき、順番に処理されます。
        </P>
        <Code>{`https://x.com/user/status/1234567890123456789
https://x.com/user/status/9876543210987654321
https://x.com/user/status/1111111111111111111`}</Code>
        <H3>拡張機能・CLIから登録する</H3>
        <P>
          <A href={CONFIG.PAGES.EXTENSIONS}>ブラウザ拡張機能</A>を入れると、Xのポスト画面でアイコンを押すだけで登録できます。コマンドラインからは <A href="/howtouse/tools-ext">CLI</A> を使います。
        </P>
        <Note title="登録できないもの">
          鍵アカウントのポストは取得できないため登録できません。公開されているポストだけが対象です。
        </Note>

        <H2>数値が更新されるタイミング</H2>
        <Table
          head={['種類', '内容']}
          rows={[
            ['自動（毎日）', '毎日決まった時刻に、登録から1か月以内のポストを更新します。'],
            ['自動（当日分）', '当日のポストは10分ごとに更新します。'],
            ['手動：過去1か月分', '直近1か月のポストを今すぐ再取得します。'],
            ['手動：すべて', 'すべての記録を再取得します。件数が多いと時間がかかります。'],
          ]}
        />
        <P>1か月より古いポストの数値は、手動で「すべて更新」を押したときに更新されます。</P>

        <H2>記録を削除する</H2>
        <P>
          一覧やカードのゴミ箱ボタンを押し、確認ダイアログで実行します。削除は取り消せません。おはツイKeeperの記録が消えるだけで、X上のポストは消えません。記録の内容を編集する機能はないため、間違えて登録した場合は削除して登録し直してください。
        </P>

        <H2>画像をまとめて保存する</H2>
        <P>ダッシュボードの「画像をZIPでDL」から、登録済みの記録の画像をまとめて保存できます。</P>
      </>
    ),
  },
  {
    id: 'analytics',
    title: 'グラフ・アワード・ランキング',
    shortTitle: '分析・アワード',
    icon: 'bx-line-chart',
    category: '基本機能',
    content: (
      <>
        <H2>グラフ</H2>
        <P>
          「グラフ」ページでは、いいね・表示・リポスト・返信の4つの指標を切り替えて推移を見られます。表示は次の5つのタブで切り替えます。
        </P>
        <Table
          head={['タブ', '内容']}
          rows={[
            ['推移', '記録ごとの指標の変化。'],
            ['曜日別', '曜日ごとの傾向。'],
            ['時間帯', '投稿した時間帯のヒートマップ。'],
            ['エンゲージ', '反応の内訳の分析。'],
            ['データ', '数値の一覧表。'],
          ]}
        />
        <P>公開ページ（<C>/あなたのUUID/graph</C>）でも同じグラフを見られます。</P>

        <H2>草カレンダー</H2>
        <P>
          投稿した日を1日1マスで表します。色が濃いほど、その日の反応が多いことを示します。投稿していない日は色が付かないので、連続が途切れた日がひと目で分かります。
        </P>

        <H2>アワード（称号）</H2>
        <P>条件を満たすと自動で付与され、公開ページに表示されます。手続きは要りません。</P>
        <Table
          head={['種類', '条件の例']}
          rows={[
            ['投稿数', '通算で5回、100回、1,000回、5,000回、10,000回。'],
            ['連続投稿', '3日、1か月、100日、1年の連続。'],
            ['反応数', 'いいね50、1万、表示100万など。リポストや返信の累計もあります。'],
          ]}
        />
        <P>すべてのアワードと条件は <A href="/awards">アワード一覧</A> で確認できます。</P>

        <H2>ランキング</H2>
        <P>
          公開設定をオンにしているユーザーが対象です。総投稿数、累計いいね数、現在の連続日数、本日のいいね数などで順位が付きます。公開設定をオフにすると、自動でランキングから外れます。集計結果は一定時間キャッシュされるため、投稿直後は順位に反映されるまで少し時間がかかります。
        </P>
        <P>ランキングは <A href="/ranking">/ranking</A> で、カレンダーから期間を選んで見られます。</P>
      </>
    ),
  },
  {
    id: 'share',
    title: '共有・短縮リンク（r-links）',
    shortTitle: '共有・短縮リンク',
    icon: 'bx-share-alt',
    category: '基本機能',
    content: (
      <>
        <H2>公開ページを共有する</H2>
        <P>
          ダッシュボード上部の「固有共有URL」が、あなたの記録をまとめた公開ページです。URLは2種類あります。
        </P>
        <Table
          head={['種類', 'URL']}
          rows={[
            ['通常', <C key="a">https://ohatwikeeper.com/あなたのUUID</C>],
            ['短縮（おすすめ）', <C key="b">https://ohax.pw/あなたのUUID</C>],
          ]}
        />
        <P>
          Xに貼ると、現在の連続日数やいいね総数が入ったカード画像（OGP）が表示されます。投稿を追加すると、カードの数値も更新されます。
        </P>
        <Note title="公開したくないとき">
          設定で公開をオフにすると、第三者は公開ページを見られなくなり、ランキングにも載りません。自分だけが使うモードとして使えます。
        </Note>

        <H2>短縮リンク（r-links）</H2>
        <P>
          自分で決めた文字列の短縮URL（<C>go.ohax.pw/好きな文字列</C>）を作れます。アクセスの日時・流入元・ブラウザの情報が記録され、QRコードも保存できます。
        </P>
        <H3>作り方</H3>
        <OL>
          <li>メニューから「短縮リンク」を開きます。</li>
          <li>右上の「短縮リンクを作成」を押します。</li>
          <li>「元のURL」に、短縮したいURLを入れます。自分の公開ページのURLでも外部のURLでも構いません。</li>
          <li>「カスタムスラッグ」に好きな文字列を入れます。英数字、ハイフン、アンダースコアが使えます。空にするとランダムな文字列になります。</li>
          <li>必要に応じて、タイトル（管理用）、最大使用回数（アクセス回数の上限）、パスワード保護を設定します。</li>
          <li>「作成」を押し、できたURLをコピーして共有します。</li>
        </OL>
        <Code>{`スラッグ: my-profile
短縮URL : https://go.ohax.pw/my-profile`}</Code>
        <H3>アクセスの解析</H3>
        <P>
          リンクの詳細で、アクセス日時、リファラー（どのサービスから来たか）、ユーザーエージェントを確認できます。XやDiscordなど、どこから何人来たかを比べられます。UTMパラメータも付けられるので、Google Analyticsなどの計測にも使えます。
        </P>
      </>
    ),
  },
  {
    id: 'organize',
    title: 'フォルダ・検索・比較',
    shortTitle: 'フォルダ・検索・比較',
    icon: 'bx-folder',
    category: '高度な機能',
    content: (
      <>
        <H2>フォルダ</H2>
        <P>
          投稿をテーマ別にまとめ、そのまま公開ページにできます。旅行、イベント、衣装別など、見せたい投稿だけを集めたいときに使います。フォルダの数に上限はなく、1つの投稿を複数のフォルダに入れられます。
        </P>
        <OL>
          <li>「フォルダ」ページで「新規作成」を押し、名前と説明を入れます。</li>
          <li>「おはツイを追加」から、入れたい投稿を選びます。</li>
          <li>公開URLをコピーして共有します。</li>
        </OL>
        <Code>{`https://ohatwikeeper.com/あなたのUUID/folder/フォルダのスラッグ`}</Code>

        <H2>横断検索</H2>
        <P>
          <A href="/search">検索ページ</A>では、投稿の本文とユーザーを横断して探せます。「すべて」「ユーザー」「投稿」のタブで絞り込みます。
        </P>
        <UL>
          <li>投稿の本文：「おはよう」「出勤」などのキーワードで過去のおはツイを探せます。</li>
          <li>ユーザー：<C>@ユーザー名</C> や表示名で、他のユーザーの公開ページを探せます。</li>
        </UL>

        <H2>ユーザー比較（Diff）</H2>
        <P>
          <A href="/diff">/diff</A> で2人のユーザーを選ぶと、数値を左右に並べて比べられます。ユーザー名またはUUIDで指定します。
        </P>
        <Table
          head={['比較する項目']}
          rows={[['総投稿数'], ['総いいね数・総表示数'], ['平均いいね数'], ['現在の連続日数・最長の連続日数']]}
        />
        <P><C>/diff/ユーザー1/ユーザー2</C> のURLをそのまま送れば、同じ比較結果を相手にも見せられます。</P>
      </>
    ),
  },
  {
    id: 'settings',
    title: '設定・アカウント',
    shortTitle: '設定',
    icon: 'bx-cog',
    category: '基本機能',
    content: (
      <>
        <H2>プロフィールの公開設定</H2>
        <P>
          <A href="/settings">設定</A>の「プロフィール公開設定」で、自分の公開ページ（<C>/あなたのUUID</C>）の公開・非公開を切り替えられます。
          公開をオフにすると、他のユーザーはあなたのページを見られなくなります。
        </P>

        <H2>SNS連携</H2>
        <P>「SNS連携」で X アカウントなどを連携します。連携したアカウントは、ダッシュボードの記録や<A href="/tools/search_ohatwi">過去のおはツイ検索</A>の対象になります。</P>

        <H2>誕生日の登録</H2>
        <P>誕生日を登録すると、当日にあなたの公開ページを開いた人にお祝いエフェクトが表示されます。保存されるのは月日のみです。</P>

        <H2>データのエクスポート</H2>
        <P>これまでの投稿記録を CSV・JSON・カレンダー形式でダウンロードできます。バックアップや他ツールでの分析に使えます。</P>
      </>
    ),
  },
  {
    id: 'tips',
    title: '操作のコツ',
    shortTitle: '操作のコツ',
    icon: 'bx-bulb',
    category: '高度な機能',
    content: (
      <>
        <H2>コマンドパレット</H2>
        <P><C>Ctrl</C> + <C>K</C>（Mac は <C>⌘</C> + <C>K</C>）で検索付きのコマンドパレットが開きます。画面の移動や機能の呼び出しをキーボードだけで行えます。<C>Esc</C> で閉じます。</P>

        <H2>サイドメニューの開閉とパンくず</H2>
        <P>PC 表示では、右パネル上部の左端のボタンでサイドメニューを開閉できます。状態は端末に保存されます。ボタンの隣のパンくずは現在地を示し、上位の階層をクリックすると戻れます。</P>

        <H2>Web ターミナル</H2>
        <P><A href="/terminal">/terminal</A> では、CLI「ohax」と同じコマンドをブラウザ上で実行できます。履歴は上下キーで呼び出せ、<C>clear</C> または <C>clr</C> で画面を消去できます。</P>
      </>
    ),
  },
  {
    id: 'integrations',
    title: '通知とWebhook',
    shortTitle: '通知・Webhook',
    icon: 'bx-bell',
    category: '連携・サポート',
    content: (
      <>
        <H2>メール通知</H2>
        <P>通知を受け取るには、設定でメールアドレスを登録してください。届く通知は次の3種類です。</P>
        <Table
          head={['通知', '内容']}
          rows={[
            ['投稿リマインダー', '指定した時刻（0〜23時、最大3つ）までにおはツイの記録がないと届きます。'],
            ['アワード達成', '新しいアワードやマイルストーンに届いたときに届きます。'],
            ['週間・月間サマリー', '毎週月曜の朝に先週分、毎月初めに前月分の記録と統計が届きます。'],
          ]}
        />
        <P>
          リマインダーは、設定ページの「通知設定」で「未投稿リマインダー」をオンにし、時刻を決めて保存すると有効になります。それぞれの通知は設定でオン・オフを切り替えられます。
        </P>

        <H2>Webhook</H2>
        <P>
          記録が追加・削除されたとき、指定したURLにJSONを送ります。Discordのチャンネルに自動で知らせたり、自作のBotと連携したりできます。登録できるのは最大5個です。
        </P>
        <H3>設定手順</H3>
        <OL>
          <li>送り先のURLを用意します。Discordなら、サーバー設定の「連携サービス」→「ウェブフック」→「新しいウェブフック」で作ります。</li>
          <li>設定ページを開き、「Webhook」タブを選びます。</li>
          <li>名前（管理用）、Webhook URL、通知したいイベントを入力します。イベントは「記録追加（record_added）」と「記録削除（record_deleted）」から選べます。</li>
          <li>「Webhookを追加」を押します。</li>
          <li>登録したWebhookの「テスト送信」を押し、送り先に届くことを確認します。</li>
        </OL>
        <P>送信の成否はWebhookのログ画面で確認できます。届かないときは、URLの誤りと送り先側の設定を見直してください。</P>
      </>
    ),
  },
  {
    id: 'tools-ext',
    title: '拡張機能・CLI・ツール',
    shortTitle: '拡張・CLI・ツール',
    icon: 'bx-wrench',
    category: '高度な機能',
    content: (
      <>
        <H2>ブラウザ拡張機能（Chrome / Firefox）</H2>
        <P>
          Xのポスト画面で拡張機能のアイコンを押すと、そのポストを記録に追加します。URLをコピーして貼る手間がなくなります。案内は <A href={CONFIG.PAGES.EXTENSIONS}>拡張機能のページ</A> にあります。
        </P>
        <OL>
          <li>お使いのブラウザ（Chrome / Firefox）向けの拡張機能をインストールします。</li>
          <li>設定ページの「APIキー」タブでキーを発行し、拡張機能に設定します。</li>
          <li>Xで登録したいポストを開きます。</li>
          <li>ツールバーの拡張機能アイコンを押します。</li>
        </OL>

        <H2>CLI「ohax」</H2>
        <P>ターミナルで、プロフィール、グラフ、草カレンダー、アワードを表示できます。インストール方法は3つあります。</P>
        <H3>npm</H3>
        <Code>{`npm i -g @lapius/ohatwikeeper-cli`}</Code>
        <H3>Go</H3>
        <Code>{`go install github.com/lapius7/ohatwikeeper-cli/cmd/ohax@latest`}</Code>
        <H3>シェルスクリプト（Linux / Mac）</H3>
        <Code>{`curl -fsSL https://ohatwikeeper.com/cli/install.sh | bash`}</Code>
        <H3>コマンド</H3>
        <Table
          head={['コマンド', '内容']}
          rows={[
            [<C key="a">ohax profile UUID</C>, 'プロフィールを表示'],
            [<C key="b">ohax graph UUID</C>, 'いいね・表示の推移を文字で描画'],
            [<C key="c">ohax grass UUID</C>, '草カレンダーを表示'],
            [<C key="d">ohax awards UUID</C>, '獲得したアワードを表示'],
          ]}
        />
        <P>設定の「APIキー」タブで発行したキーは、CLIや自作スクリプトでも使えます。</P>

        <H2>便利ツール（/tools）</H2>
        <Table
          head={['ツール', '内容']}
          rows={[
            ['tweet.js URL抽出', 'Xからダウンロードした tweet.js をアップロードすると、おはツイらしきポストのURLを取り出します。過去分をまとめて登録するときに使います。'],
            ['おはツイ検索', '「おはよう」「おは」などのキーワードで自分の過去のポストを探し、登録の候補として表示します。'],
          ]}
        />
        <P><A href={CONFIG.PAGES.TOOLS}>便利ツールの一覧へ</A></P>
      </>
    ),
  },
  {
    id: 'api',
    title: 'API・開発者向け',
    shortTitle: 'API・開発者向け',
    icon: 'bx-code-alt',
    category: 'API・開発者向け',
    content: (
      <>
        <H2>概要</H2>
        <P>
          HTTPのAPIを公開しています。外部のアプリやBotから、投稿データの取得や登録ができます。全エンドポイントの仕様は<A href={CONFIG.EXTERNAL.API_DOCS}>APIドキュメント</A>にあります。公式のSDKはないため、HTTPで直接呼び出してください。
        </P>
        <P>ベースURLは <C>https://ohatwikeeper.com/api/v2</C> です。</P>
        <Note title="APIドキュメント">
          エンドポイントごとの詳しい仕様と、その場で試せる画面は <A href="/api-docs">/api-docs</A> にあります。
        </Note>

        <H2>認証</H2>
        <P>
          <C>/public/*</C> は認証が要りません。<C>/user/*</C> は、設定ページの「APIキー」タブで発行したキーを <C>OHATWIKEEPER-API-KEY</C> ヘッダーに付けて呼び出します。キーは他人に見せないでください。
        </P>
        <Code>{`GET https://ohatwikeeper.com/api/v2/user/me
OHATWIKEEPER-API-KEY: YOUR_API_KEY_HERE`}</Code>

        <H2>主なエンドポイント</H2>
        <H3>認証不要</H3>
        <Table
          head={['メソッドとパス', '内容']}
          rows={[
            [<C key="a">GET /public/users/{'{uuid}'}</C>, 'プロフィール'],
            [<C key="b">GET /public/users/{'{uuid}'}/stats</C>, '統計'],
            [<C key="c">GET /public/users/{'{uuid}'}/records</C>, '投稿一覧'],
            [<C key="d">GET /public/users/{'{uuid}'}/awards</C>, 'アワード'],
            [<C key="e">GET /public/ranking</C>, 'ランキング'],
            [<C key="f">GET /public/diff/{'{uuid1}'}/{'{uuid2}'}</C>, 'ユーザー比較'],
            [<C key="g">GET /public/search</C>, '投稿検索'],
          ]}
        />
        <H3>APIキーが必要</H3>
        <Table
          head={['メソッドとパス', '内容']}
          rows={[
            [<C key="a">GET /user/me</C>, '自分の情報'],
            [<C key="b">GET /user/stats</C>, '自分の統計'],
            [<C key="c">GET /user/streak</C>, '連続投稿の状況'],
            [<C key="d">GET /user/awards</C>, '自分のアワード'],
            [<C key="e">GET /user/records</C>, '自分の投稿一覧'],
            [<C key="f">POST /user/records</C>, '投稿を登録'],
            [<C key="g">POST /user/records/bulk</C>, '投稿を一括登録（最大100件）'],
            [<C key="h">DELETE /user/records/{'{uniqid}'}</C>, '投稿を削除'],
            [<C key="i">POST /user/records/{'{uniqid}'}/refresh</C>, '反応数を再取得'],
            [<C key="j">GET /user/export</C>, '投稿データをエクスポート'],
            [<C key="k">GET /user/webhooks</C>, 'Webhookの一覧（作成・更新・削除も可）'],
          ]}
        />
        <H3>呼び出しの例</H3>
        <Code>{`curl "https://ohatwikeeper.com/api/v2/public/users/{uuid}"`}</Code>

        <H2>ウィジェットの埋め込み</H2>
        <P>
          自分のサイトやブログに、統計ウィジェットを埋め込めます。設定ページの「ウィジェット」タブで名前を付けて作成すると、URLが発行されます。同じ画面で、埋め込みを許可するサイト（許可オリジン、最大20）も設定します。許可していないサイトでは表示されません。
        </P>
        <Code>{`<iframe
  src="https://ohatwikeeper.com/widget/{発行されたトークン}"
  width="300"
  height="400"
  frameborder="0"
></iframe>`}</Code>
      </>
    ),
  },
  {
    id: 'faq',
    title: 'よくある質問・困ったとき',
    shortTitle: 'よくある質問',
    icon: 'bx-help-circle',
    category: '連携・サポート',
    content: (
      <>
        <H2>利用について</H2>
        <H3>無料ですか。制限はありますか。</H3>
        <P>すべての機能を無料で使えます。登録件数やグラフの表示件数に制限はありません。</P>
        <H3>スマホアプリはありますか。</H3>
        <P>ネイティブアプリはありません。スマホのブラウザからすべての機能を使えます。</P>
        <H3>アカウントを削除したいです。</H3>
        <P>設定画面に削除ボタンはありません。<A href="https://discord.ohatwikeeper.com">公式Discord</A>または開発者の<A href="https://x.com/Lapius7">X</A>に連絡してください。</P>

        <H2>記録について</H2>
        <H3>鍵アカウントのポストは登録できますか。</H3>
        <P>できません。取得できるのは公開されているポストだけです。</P>
        <H3>元のポストを削除するとどうなりますか。</H3>
        <P>
          保存済みのテキストと画像のキャッシュは、おはツイKeeper上に残ります。ただし、元のポストのURLは開けなくなります。
        </P>
        <H3>数値が更新されません。</H3>
        <P>
          当日のポストは10分ごと、1か月以内のポストは毎日更新されます。すぐに反映したいときは、ダッシュボードの「過去1か月分を更新」を押してください。1か月より古いポストは「すべて更新」で更新されます。
        </P>
        <H3>登録したのに一覧に出ません。</H3>
        <P>
          一括登録は順番に処理されるため、件数が多いと反映に時間がかかります。しばらく待ってから画面を再読み込みしてください。それでも出ないときは、URLがポスト個別のURL（<C>/status/数字</C>）になっているか、鍵アカウントのポストではないかを確認してください。
        </P>

        <H2>公開とデータ</H2>
        <H3>自分のページを他人に見られたくありません。</H3>
        <P>設定で公開をオフにしてください。第三者は公開ページを見られなくなり、ランキングにも載りません。</P>
        <H3>データを書き出せますか。</H3>
        <P>
          設定の「基本・公開設定」からCSV・JSON・ICSで書き出せます。APIキーを使って <C>GET /api/v2/user/export</C> から投稿データを取得できます。画像は、ダッシュボードの「画像をZIPでDL」でまとめて保存できます。
        </P>

        <H2>不具合を見つけたとき</H2>
        <P>
          <A href="https://discord.ohatwikeeper.com">公式Discord</A>の「不具合報告」チャンネル、または開発者のX（<A href="https://x.com/Lapius7">@Lapius7</A>）に連絡してください。どのページで何をしたか、表示されたメッセージを添えてもらえると調べやすくなります。
        </P>
      </>
    ),
  },
]
