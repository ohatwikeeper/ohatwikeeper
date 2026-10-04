import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useState } from 'react'
import { Heart, ExternalLink, Search, Copy, History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { Link, useParams } from 'react-router-dom'
import { apiGet, apiSend, friendlyError } from '@/lib/dashboard/api'
import { loadSession, useSession } from '@/lib/session'

const P = 'tools/search-ohatwi'
type Tweet = { id: string; url: string; text: string; created_at?: string; likes?: number; replying_to?: unknown }
type Hist = { uuid: string; handle: string; keyword: string; total_fetched: number; result_count?: number | null; created_at: string }

/** 過去のおはツイ検索(旧 tools/search_ohatwi)。ログイン中ユーザー自身の投稿を fxtwitter 検索で集める */
export default function SearchOhatwi() {
  const { t: tr } = useTranslation()
  const { uuid } = useParams()
  const session = useSession()
  const [keyword, setKeyword] = useState('おはよう')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [hist, setHist] = useState<Hist[]>([])
  const [saved, setSaved] = useState<{ keyword: string; created_at: string; results: Tweet[] } | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())

  useEffect(() => { document.title = tr('tl.shTitle') + ' - おはツイKeeper' }, [])
  useEffect(() => {
    setSaved(null); setSel(new Set())
    loadSession().then(s => { if (!s.logged_in) { setStatus(tr('tl.needLogin')); return } })
    if (uuid) apiGet<any>(`${P}/session/${uuid}`).then(setSaved).catch(e => setStatus(friendlyError(e)))
    else apiGet<{ items: Hist[] }>(`${P}/history`).then(r => setHist(r.items)).catch(() => {})
  }, [uuid])

  async function run() {
    setBusy(true); setStatus(tr('sr.busy'))
    try {
      const all: Tweet[] = []; let cursor = ''; let fetched = 0
      for (let page = 0; page < 30; page++) {
        const d = await apiSend<any>(`${P}/search`, 'POST', { keyword, cursor })
        if (d.error === 'cooldown') {
          const m = Math.floor(d.remaining / 60), s = d.remaining % 60
          throw new Error(tr('tl.cool', { r: m > 0 ? tr('tl.msec', { m, s }) : tr('tl.sec', { s }) }))
        }
        if (d.error) throw new Error(d.error)
        const tweets: Tweet[] = (d.results || []).filter((r: any) => r.type === 'status')
        fetched += tweets.length
        tweets.forEach(t => { if (!all.find(x => x.id === t.id)) all.push(t) })
        setStatus(tr('tl.fetching', { n: fetched }))
        cursor = d.cursor?.bottom ?? ''
        if (!cursor || !tweets.length) break
      }
      const filtered = all.filter(t => {
        const text = t.text || ''
        return text.includes(keyword) && (t.replying_to === null || t.replying_to === undefined) && !text.trimStart().startsWith('@')
      })
      setStatus(tr('tl.saving'))
      const r = await apiSend<{ uuid?: string; error?: string }>(`${P}/save`, 'POST', { keyword, results: filtered, total_fetched: fetched })
      if (r.error || !r.uuid) throw new Error(r.error || tr('tl.saveFail'))
      location.href = `/tools/search_ohatwi/${r.uuid}`
    } catch (e) { setStatus(e instanceof Error ? e.message : friendlyError(e)); setBusy(false) }
  }

  const list = saved?.results ?? []
  const urls = (sel.size ? list.filter(t => sel.has(String(t.id))) : list).map(t => t.url).filter(Boolean)
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="dash-scope text-d-text px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader icon={Search} title={tr('tl.shTitle')} />
        {session.ready && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--arc-border)] bg-[var(--surface-raised)] px-4 py-3">
            <img src={session.x_username ? `https://unavatar.io/x/${session.x_username}` : undefined} alt="" className={`size-10 rounded-full bg-d-med ${session.x_username ? '' : 'hidden'}`} />
            <div className="min-w-0">
              <div className="text-xs text-d-text3">{tr('tl.target')}</div>
              {session.x_username
                ? <div className="truncate text-base font-bold">@{session.x_username} <span className="text-xs font-normal text-d-text3">{tr('tl.targetOf')}</span></div>
                : <div className="text-sm font-semibold text-amber-500">{session.logged_in ? tr('tl.noX') : tr('tl.loginHint')}</div>}
            </div>
          </div>
        )}
        {!uuid && (
          <>
            <Card>
              <CardContent className="space-y-2">
                <label className="text-sm font-medium">{tr('tl.kwLabel')}</label>
                <div className="flex gap-2">
                  <Input value={keyword} maxLength={100} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && !busy && run()} placeholder={tr('tl.kw')} />
                  <Button disabled={busy || !keyword.trim()} onClick={run}>{busy ? <Spinner /> : <Search className="size-4" />}{tr('sr.go')}</Button>
                </div>
                <p className="text-xs text-d-text3">{tr('tl.kwHelp')}</p>
              </CardContent>
            </Card>
            {hist.length > 0 && (
              <div className="space-y-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold"><History className="size-4" />{tr('tl.history')}</h2>
                {hist.map(h => (
                  <Link key={h.uuid} to={`/tools/search_ohatwi/${h.uuid}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-d-border px-4 py-3 transition-colors hover:border-d-accent">
                    <span className="font-semibold">「{h.keyword}」</span>
                    <span className="text-sm text-d-text2">@{h.handle}</span>
                    <span className="text-sm text-d-text2">{tr('tl.count', { n: h.result_count ?? h.total_fetched })}</span>
                    <span className="ml-auto text-xs text-d-text3">{h.created_at}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        {status && <p className="flex items-center gap-2 rounded-lg bg-d-med px-3 py-2 text-sm text-d-text2">{busy && <Spinner />}{status}</p>}
        {saved && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">「{saved.keyword}」</span>
              <span className="text-sm text-d-text2">{tr('tl.count', { n: list.length })}</span>
              <span className="text-xs text-d-text3">{saved.created_at}</span>
            </div>
            <div className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-xl border border-d-border bg-[var(--surface-raised)] p-2">
              <Button variant="outline" size="sm" onClick={() => setSel(new Set(list.map(t => String(t.id))))}>{tr('tl.selAll')}</Button>
              <Button variant="outline" size="sm" onClick={() => setSel(new Set())}>{tr('tl.selNone')}</Button>
              <Button size="sm" className="ml-auto" onClick={() => navigator.clipboard.writeText(urls.join('\n')).then(() => setStatus(tr('tl.copiedN', { n: urls.length })))}>
                <Copy className="size-4" />{tr('tl.copyUrls', { n: urls.length })}
              </Button>
            </div>
            {list.map(t => (
              <label key={t.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${sel.has(String(t.id)) ? 'border-d-accent bg-d-med' : 'border-d-border hover:border-d-text3'}`}>
                <Checkbox checked={sel.has(String(t.id))} onCheckedChange={() => toggle(String(t.id))} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-sm">{t.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-d-text2">
                    <span>{t.created_at ? new Date(t.created_at).toLocaleString('ja-JP') : ''}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" />{t.likes ?? 0}</span>
                    <a href={t.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="ml-auto inline-flex items-center gap-1 text-d-accent hover:underline">{tr('tl.open')}<ExternalLink className="size-3.5" /></a>
                  </div>
                </div>
              </label>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
