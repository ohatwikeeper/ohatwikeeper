<div align="center">

# おはツイKeeper

**「おはツイ」を記録・可視化・共有する Web サービス**

[サービスを使う](https://ohatwikeeper.com) ・ [API ドキュメント](https://ohatwikeeper.com/api-docs) ・ [ライセンス](./LICENSE)

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06b6d4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-All_Rights_Reserved-red)

</div>

> [!IMPORTANT]
> このリポジトリは **閲覧専用(source-available ではなく "view-only")** です。
> コードの複製・改変・再配布・商用/非商用を問わない利用は許可されていません。詳細は [LICENSE](./LICENSE) を参照してください。
> Issue / Pull Request による貢献も受け付けていません。

## 概要

おはツイKeeper は、X(旧 Twitter)上の「おはツイ」を自動で記録し、継続日数・ランキング・グラフ・振り返りなどで楽しめるサービスです。
本リポジトリは、その **公式フロントエンド(Web UI)のソースコード** を公開したものです。

- 公式サイト: https://ohatwikeeper.com
- バックエンド(API・DB・管理画面)は **非公開** です。公開 API は [API ドキュメント](https://ohatwikeeper.com/api-docs) を参照してください。

## 主な機能(`src/features/`)

| 領域 | 内容 |
|---|---|
| `dashboard` / `records` / `details` | 記録の一覧・詳細・ダッシュボード |
| `graph` / `recap` / `diff` | グラフ、年間などの振り返り、期間比較 |
| `ranking` / `awards` / `profile` | ランキング、アワード、プロフィール |
| `search` / `folder` / `gallery` / `handle` | 検索、フォルダ整理、ギャラリー、ハンドル管理 |
| `share` / `rlinks` | 共有カード・共有リンク |
| `cli` / `extensions` / `tools` | CLI・拡張機能の案内、補助ツール |
| `notifications` / `settings` / `onboard` / `login` | 通知、設定、初回案内、ログイン |
| `howtouse` / `patchnotes` / `survey` / `policy` / `terms` | 使い方、更新履歴、アンケート、規約類 |
| `maintenance` | メンテナンス表示 |

多言語対応: 日本語 / English / Deutsch / Español / Français / 한국어 / Português / Русский / 中文(i18next)

## 技術スタック

- **React 19 + TypeScript + Vite**(SPA、`react-router-dom`)
- **UI**: Tailwind CSS、Radix UI / Base UI、shadcn/ui 系コンポーネント、[Arc](https://uiarc.dev)、cmdk、sonner、next-themes
- **データ表示**: TanStack Table、Recharts、three.js
- **アニメーション**: GSAP、motion
- **i18n**: i18next + browser-languagedetector
- **アイコン / フォント**: Phosphor、Lucide、Geist
- **解析(任意)**: PostHog、Rybbit(環境変数が空なら無効)

## ディレクトリ構成

```
src/
├─ app/          ルーティング・アプリ全体の組み立て
├─ features/     機能(ページ)単位のモジュール
├─ widgets/      ナビゲーションなど複数機能にまたがる UI
├─ components/   共通コンポーネント(dashboard-ui / arc / ui)
├─ i18n/         翻訳リソース(9 言語)
└─ main.tsx      エントリポイント(解析の初期化を含む)
public/          静的アセット(favicon.ico / favicon.svg / icons.svg)
```

## 開発(メンテナ向け)

動作確認には対応するバックエンド(非公開)が必要です。外部の方が単独で完全に動かすことは想定していません。

```bash
npm ci
cp .env.example .env     # 値を設定
npm run dev              # 開発サーバー
npm run build            # 型チェック + 本番ビルド(出力: dist/)
npm run lint
```

### 環境変数(`.env.example`)

| 変数 | 説明 |
|---|---|
| `VITE_API_BASE` / `VITE_APP_BASE` / `VITE_PHP_ORIGIN` | バックエンドのオリジン。空なら同一オリジンの相対パス |
| `VITE_NODE_ORIGIN` | 開発時のプロキシ先(既定 `http://localhost:8790`) |
| `VITE_RYBBIT_SRC` / `VITE_RYBBIT_HOSTS` | Rybbit のスクリプト URL と、読み込みを許可するホスト名(カンマ区切り)。空なら無効 |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | PostHog の設定。空なら無効 |

`VITE_*` はビルド時にバンドルへ埋め込まれます。**秘密情報は設定しないでください。**

## セキュリティ

脆弱性を発見した場合は [SECURITY.md](./SECURITY.md) に従って非公開で報告してください。

## ライセンス

Copyright (c) 2026 おはツイKeeper (ohatwikeeper) / Lapius7. All rights reserved.
閲覧のみ許可します。詳細は [LICENSE](./LICENSE)。
