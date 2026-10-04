// /api-docs (Scalar) をサイドメニューを保ったまま表示する(リロードなしで遷移させるため iframe)
export default function ApiDocsPage() {
  return <iframe src="/api-docs" title="API Docs" className="h-[calc(100vh-4rem)] w-full rounded-xl border border-[var(--arc-border)] bg-white" />
}
