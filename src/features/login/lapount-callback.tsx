import { useEffect, useState } from 'react'

// Lapount から #access_token 付きで戻るページ。API で1回だけ検証し、結果の遷移先へ移動する
export default function LapountCallbackPage() {
  const [err, setErr] = useState('')
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = h.get('access_token')
    history.replaceState(null, '', window.location.pathname)
    if (!token) { setErr('Lapount認証に失敗しました。'); return }
    fetch('/app-api/auth/lapount/verify', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    })
      .then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }))
      .then(({ ok, j }) => {
        if (ok && j.redirect) window.location.replace(/^\/(?![\/\\])/.test(j.redirect) ? j.redirect : '/dashboard')
        else setErr(j.error || 'Lapount認証に失敗しました。')
      })
      .catch(() => setErr('Lapount認証に失敗しました。'))
  }, [])
  return (
    <div className="dash-scope grid min-h-screen place-items-center bg-d-bg px-6 text-d-text">
      {err ? <div className="text-center"><p className="text-sm text-red-400">{err}</p><a href="/login" className="mt-4 inline-block text-sm underline">ログインへ戻る</a></div> : <p className="text-sm text-d-text2">Lapount で認証中...</p>}
    </div>
  )
}
