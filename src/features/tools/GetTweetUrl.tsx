import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Repeat2, ExternalLink, Link2, Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, csrfHeaders, friendlyError } from '@/lib/dashboard/api'
import { CopyChip } from '@/components/ui/copy-chip'
import { loadSession } from '@/lib/session'
import { FileDropzone } from '@/components/arc/file-dropzone/file-dropzone'
import { SimpleSelect } from '@/components/ui/simple-select'
import { DatePicker } from '@/components/arc/date-picker/date-picker'

const P = 'tools/tweeturl'
type Tw = { tweet_id: string; full_text: string; created_at: string; favorite_count: number; retweet_count: number; has_media: number }
type Res = { upload: { filename: string; username: string; display_name: string }; total: number; page: number; limit: number; tweets: Tw[]; tweet_ids: string[] }

/** tweet.js から指定条件のツイートURLを抽出(旧 tools/get_tweeturl) */
export default function GetTweetUrl() {
  const { id } = useParams()
  return id ? <Search id={id} /> : <Upload />
}

function Upload() {
  const { t: tr } = useTranslation()
  const nav = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [username, setUsername] = useState('')
  const [pr, setPr] = useState<{ processed: number; total: number } | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { loadSession() }, [])

  const submit = async () => {
    if (!file) return
    setErr(''); setPr({ processed: 0, total: 0 })
    const rid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
    const timer = setInterval(() => apiGet<{ processed: number; total: number }>(`${P}/progress?id=${rid}`).then(setPr).catch(() => {}), 1000)
    try {
      const fd = new FormData()
      fd.append('tweet_js', file); fd.append('username', username); fd.append('request_id', rid)
      const h = csrfHeaders(); delete h['Content-Type']
      const r = await fetch(`/app-api/${P}/upload`, { method: 'POST', body: fd, headers: h, credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || i18n.t('tl.importFail'))
      nav(`/tools/get_tweeturl/search/${j.id}`)
    } catch (e) { setErr(friendlyError(e)); setPr(null) } finally { clearInterval(timer) }
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <PageHeader icon={Link2} title={tr('tl.tuTitle')} />
      <Card>
        <CardHeader>
          <CardTitle>{tr('tl.step1')}</CardTitle>
          <CardDescription>{tr('tl.step1d')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone accept=".js" multiple={false} maxFiles={1} label="tweet.js" description={tr('tl.drop')} onFilesChange={(fs) => setFile(fs[0] ?? null)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tr('tl.user')} <span className="text-xs font-normal text-muted-foreground">{tr('tl.userNote')}</span></label>
            <Input placeholder={tr('tl.userPh')} value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!file || !!pr} onClick={submit}>
            {pr ? <><Spinner />{tr('tl.importing', { p: pr.processed, t: pr.total || '?' })}</> : tr('tl.upStart')}
          </Button>
          {pr && <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: pr.total ? `${Math.min(100, (pr.processed / pr.total) * 100)}%` : '10%' }} /></div>}
          {err && <p className="text-sm text-red-500">{err}</p>}
        </CardContent>
      </Card>
    </main>
  )
}

function Search({ id }: { id: string }) {
  const { t: tr } = useTranslation()
  const [f, setF] = useState<Record<string, string>>({ mode: 'and', s: 'newest' })
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState<Res | null>(null)
  const [err, setErr] = useState('')
  const setDate = (k: string) => (d?: Date) => setF((o) => ({ ...o, [k]: d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '' }))
  const set = (k: string) => (e: { target: { value: string } }) => setF((o) => ({ ...o, [k]: e.target.value }))

  useEffect(() => {
    loadSession()
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), p: String(page) })
    if (!applied && page === 1 && res) return
    apiGet<Res>(`${P}/${id}?${applied ? new URLSearchParams(applied) : qs}`).then(setRes).catch((e) => setErr(friendlyError(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, applied, page])

  const apply = () => { setPage(1); setApplied(new URLSearchParams(f).toString() + '&t=' + Date.now()) }
  const user = res?.upload.username || '_'
  const url = (t: string) => `https://x.com/${user}/status/${t}`
  // 空値は Select で扱いにくいので 'all' に置き換えて橋渡しする
  const sel = (k: string, options: [string, string][]) => (
    <SimpleSelect value={f[k] || 'all'} onChange={(v) => setF((o) => ({ ...o, [k]: v === 'all' ? '' : v }))}
      options={options.map(([value, label]) => ({ value: value || 'all', label }))} className="w-full" />
  )

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <PageHeader icon={Link2} title={<>{tr('tl.tuTitle')} — {res?.upload.display_name || res?.upload.filename}</>} />
      <Card>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input placeholder={tr('tl.kw')} onChange={set('q')} onKeyDown={(e) => e.key === 'Enter' && apply()} />
            <Input placeholder={tr('tl.nx')} onChange={set('nx')} onKeyDown={(e) => e.key === 'Enter' && apply()} />
            {sel('mode', [['and', 'AND'], ['or', 'OR'], ['exact', tr('tl.exact')]])}
            {sel('s', [['newest', tr('tl.newest')], ['oldest', tr('tl.oldest')], ['likes', tr('tl.likes')], ['rts', tr('tl.rts')], ['random', tr('tl.random')]])}
            <DatePicker label={tr('sr.since')} onChange={setDate('ds')} /><DatePicker label={tr('sr.until')} onChange={setDate('de')} />
            {sel('m', [['', tr('tl.mediaAll')], ['has_media', tr('tl.has')], ['no_media', tr('tl.no')]])}
            {sel('rt', [['', tr('tl.rtAll')], ['yes', tr('tl.rtOnly')], ['no', tr('tl.rtEx')]])}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={apply}><SearchIcon className="size-4" />{tr('sr.go')}</Button>
            <CopyChip text={() => (res?.tweet_ids ?? []).map(url).join('\n')} label={tr('tl.copyAll')} toastMessage={tr('tl.copied')} className="px-3 py-1.5 text-sm" />
            {res && <Badge variant="secondary" className="ml-auto">{tr('tl.count', { n: res.total.toLocaleString() })}</Badge>}
          </div>
        </CardContent>
      </Card>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {!res && !err && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>}
      {res && res.tweets.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{tr('tl.noMatch')}</p>}
      <ul className="space-y-2">
        {res?.tweets.map((t) => (
          <li key={t.tweet_id} className="rounded-xl border bg-card p-3 text-sm shadow-xs">
            <p className="whitespace-pre-wrap break-words">{t.full_text}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{t.created_at}</span>
              <span className="inline-flex items-center gap-1"><Heart className="size-3.5" />{t.favorite_count}</span>
              <span className="inline-flex items-center gap-1"><Repeat2 className="size-3.5" />{t.retweet_count}</span>
              <a className="ml-auto inline-flex items-center gap-1 text-d-accent hover:underline" href={url(t.tweet_id)} target="_blank" rel="noreferrer">{tr('tl.open')}<ExternalLink className="size-3.5" /></a>
            </div>
          </li>
        ))}
      </ul>
      {res && res.total > res.limit && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" />{tr('tl.prev')}</Button>
          <span className="text-xs text-muted-foreground">{page} / {Math.ceil(res.total / res.limit)}</span>
          <Button variant="outline" size="sm" disabled={page * res.limit >= res.total} onClick={() => setPage(page + 1)}>{tr('tl.next')}<ChevronRight className="size-4" /></Button>
        </div>
      )}
    </main>
  )
}
