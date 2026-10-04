import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/** デプロイ後に古いチャンクが消えて動的 import が失敗した場合の判定 */
export const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|Unable to preload CSS/i.test(
    String((e as Error)?.message ?? e),
  )

/** 無限リロード防止: 30秒以内に1回までだけ自動リロードする */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-at') ?? 0)
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem('chunk-reload-at', String(Date.now()))
  } catch { /* sessionStorage 不可でも1回は試す */ }
  location.reload()
  return true
}

interface P { children: ReactNode; pathname: string }
interface S { error: Error | null }

class Boundary extends Component<P, S> {
  state: S = { error: null }
  static getDerivedStateFromError(error: Error): S { return { error } }
  componentDidUpdate(prev: P) {
    // エラー表示中にパスが変わったら復帰させる(子ツリーは作り直さない)
    if (this.state.error && prev.pathname !== this.props.pathname) this.setState({ error: null })
  }
  componentDidCatch(error: Error) {
    if (isChunkError(error)) reloadOnce()
    else console.error('[RouteErrorBoundary]', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-lg font-bold text-d-text">ページの表示中に問題が発生しました</h1>
        <p className="text-sm text-d-text3">更新直後や通信の不調で起きることがあります。再読み込みすると直る場合があります。</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => location.reload()}>再読み込み</button>
          <button type="button" className="rounded-lg border border-d-border px-4 py-2 text-sm text-d-text" onClick={() => { location.href = '/' }}>トップへ</button>
        </div>
      </div>
    )
  }
}

/** ページ遷移(pathname 変化)でエラー状態をリセットする */
export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <Boundary pathname={pathname}>{children}</Boundary>
}
