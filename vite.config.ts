import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// ビルドごとに「年月日-公開リポジトリのコミットID先頭16桁」のバージョンを発行し、フッターに表示する(例: 20261005-b9cf23c5160504cc)。
// コミットID(40桁)は公開リポジトリ(ohatwikeeper/ohatwikeeper)のもの。top/.public-commit があればそれを優先(公開側には無いので自身のHEAD)
const ymd = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' }).replace(/-/g, '')
const commit = (() => {
  try { const v = readFileSync(new URL('.public-commit', import.meta.url), 'utf8').trim(); if (/^[0-9a-f]{40}$/.test(v)) return v } catch {}
  try { return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '0'.repeat(40) }
})()

export default defineConfig({
  define: { __BUILD_VERSION__: JSON.stringify(`${ymd}-${commit.slice(0, 16)}`), __BUILD_COMMIT__: JSON.stringify(commit) },
  plugins: [react(), tailwindcss()],
  base: '/',
  // 遅延ロードのページ内の依存も起動時にまとめて最適化する(後から見つかって再最適化→504 Outdated Optimize Dep になるのを防ぐ)
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}'] },
  // 開発時は Node(:8790) へ中継する
  server: {
    host: true,
    proxy: {
      '/api-docs': { target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790', changeOrigin: true },
      // 埋め込みウィジェットは Node が配信(SPAではない)
      '/widget': { target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790', changeOrigin: true },
      // /app-api は Node(Hono, server/) へ
      '/app-api': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
      // /api/v2/* は Node へ
      '/api/v2': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
      },
      // /api/* の公開API・session_api.php も Node へ(PHP は撤去済み)
      '/api': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
      // ログインは Node へ(OAuth コールバックも /login)
      '/login': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
        bypass: (req) => (req.method === 'GET' && !/[?&](code|oauth_token|action)=/.test(req.url ?? '') ? '/index.html' : undefined),
      },
      '/logout': { target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790', changeOrigin: true },
      '/dev_login': { target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790', changeOrigin: true, cookieDomainRewrite: { '*': 'localhost' } },
      '/confirm_login': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
      },
      '/app-api/auth': { target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790', changeOrigin: true },
      '/session_api.php': {
        target: process.env.VITE_NODE_ORIGIN ?? 'http://localhost:8790',
        changeOrigin: true,
        cookieDomainRewrite: {
          '*': 'localhost',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'top-assets',
    emptyOutDir: true,
  },
})
