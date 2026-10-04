import { useEffect, useState, useRef } from 'react'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { friendlyError } from '@/lib/dashboard/api'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CONFIG } from '@/lib/config'
import { Spinner } from '@/components/ui/spinner'
import { Swords } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Autocomplete, AutocompleteContent, AutocompleteEmpty, AutocompleteInput, AutocompleteItem, AutocompleteList } from '@/components/reui/autocomplete'

interface UserSearchResult {
  public_uuid: string
  display_name: string
  x_username: string
  x_icon: string | null
}

interface UserDiffStats {
  user: {
    display_name: string
    x_username: string
    x_icon: string
    public_uuid: string
  }
  stats: {
    total_posts: number
    total_likes: number
    total_views: number
    avg_likes: number
    current_streak?: number
    current_consecutive_streak?: number
    max_streak: number
    first_date: string | null
    latest_date: string | null
  }
}

function UserPickerInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect: (uuid: string) => void
  placeholder: string
}) {
  const { t } = useTranslation()
  const [results, setResults] = useState<UserSearchResult[]>([])
  const typedRef = useRef(false)

  useEffect(() => {
    const q = value.trim()
    if (!typedRef.current) return
    if (!q) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`${CONFIG.API_BASE}/app-api/view/users/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => setResults(d.users || []))
        .catch(() => {})
    }, 200)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative flex-1 w-full">
      {label && <label className="sr-only">{label}</label>}
      <Autocomplete
        value={value}
        onValueChange={(v: string) => {
          typedRef.current = true
          onChange(v)
        }}
        items={results}
        filter={null}
        itemToStringValue={(u: unknown) => (u as UserSearchResult).public_uuid}
      >
        <AutocompleteInput placeholder={placeholder} />
        <AutocompleteContent>
          <AutocompleteEmpty>{t('diff.noUser')}</AutocompleteEmpty>
          <AutocompleteList>
            {(u: UserSearchResult) => (
              <AutocompleteItem
                key={u.public_uuid}
                value={u}
                onClick={() => {
                  typedRef.current = false
                  onSelect(u.public_uuid)
                }}
              >
                {u.x_icon ? (
                  <img src={u.x_icon} alt="" className="w-8 h-8 rounded-full border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{u.display_name || u.x_username}</div>
                  <div className="text-[11px] text-muted-foreground truncate">@{u.x_username || u.public_uuid} ({u.public_uuid})</div>
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  )
}

export default function DiffPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams<{ u1?: string; u2?: string }>()
  const [searchParams] = useSearchParams()

  const targetU1 = params.u1 || searchParams.get('u1') || ''
  const targetU2 = params.u2 || searchParams.get('u2') || ''

  const [u1, setU1] = useState(targetU1)
  const [u2, setU2] = useState(targetU2)

  const [data, setData] = useState<{ user1: UserDiffStats | null; user2: UserDiffStats | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = t('df.doc')
  }, [])

  useEffect(() => {
    setU1(targetU1)
    setU2(targetU2)
  }, [targetU1, targetU2])

  const handleCompare = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!u1.trim() || !u2.trim()) return
    navigate(`/diff/${encodeURIComponent(u1.trim())}/${encodeURIComponent(u2.trim())}`)
  }

  useEffect(() => {
    if (!targetU1 || !targetU2) return

    setLoading(true)
    setError('')
    fetch(`${CONFIG.API_BASE}/app-api/view/diff-data?u1=${targetU1}&u2=${targetU2}`)
      .then(r => {
        if (!r.ok) throw new Error(t('df.fail'))
        return r.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(friendlyError(err))
        setLoading(false)
      })
  }, [targetU1, targetU2])

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text">
      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Title Section */}
        <PageHeader icon={Swords} title={t('diff.title')} desc={t('diff.desc')} />

        {/* Real-time User Search & Compare Form */}
        <form onSubmit={handleCompare} className="bg-d-med border border-d-border rounded-xl p-5 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <UserPickerInput
              label={t('df.u1')}
              placeholder={t('diff.ph')}
              value={u1}
              onChange={setU1}
              onSelect={uuid => {
                setU1(uuid)
                if (u2) navigate(`/diff/${uuid}/${u2}`)
              }}
            />


            <UserPickerInput
              label={t('df.u2')}
              placeholder={t('diff.ph')}
              value={u2}
              onChange={setU2}
              onSelect={uuid => {
                setU2(uuid)
                if (u1) navigate(`/diff/${u1}/${uuid}`)
              }}
            />
          </div>
        </form>

        {loading ? (
          <div className="py-20 text-center text-d-text3">
            <Spinner className="mb-3" />
            <p>{t('df.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-d-med border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
            <p className="font-bold">{error}</p>
          </div>
        ) : data && data.user1 && data.user2 ? (
          <div className="space-y-6">
            {(() => {
              const A = data.user1, B = data.user2
              const rows = [
                { label: t('df.total'), v1: A.stats.total_posts, v2: B.stats.total_posts, unit: t('df.uCount') },
                { label: t('df.streak'), v1: A.stats.current_streak ?? A.stats.current_consecutive_streak ?? 0, v2: B.stats.current_streak ?? B.stats.current_consecutive_streak ?? 0, unit: t('df.uDay') },
                { label: t('df.maxStreak'), v1: A.stats.max_streak, v2: B.stats.max_streak, unit: t('df.uDay') },
                { label: t('df.likes'), v1: A.stats.total_likes, v2: B.stats.total_likes, unit: t('df.uLike') },
                { label: t('df.avgLikes'), v1: A.stats.avg_likes, v2: B.stats.avg_likes, unit: t('df.uLike') },
                { label: t('df.views'), v1: A.stats.total_views, v2: B.stats.total_views, unit: t('df.uView') },
              ]
              const w1 = rows.filter((r) => (r.v1 ?? 0) > (r.v2 ?? 0)).length
              const w2 = rows.filter((r) => (r.v2 ?? 0) > (r.v1 ?? 0)).length
              const side = (u: typeof A, wins: number, lead: boolean, right: boolean) => (
                <Link to={CONFIG.PAGES.PROFILE(u.user.public_uuid)} className={`flex min-w-0 flex-1 items-center gap-3 !text-d-text ${right ? 'flex-row-reverse text-right' : ''}`}>
                  {u.user.x_icon ? <img src={u.user.x_icon} alt="" className={`size-14 shrink-0 rounded-full border-2 object-cover ${lead ? 'border-d-text3' : 'border-d-border'}`} /> : <div className="size-14 shrink-0 rounded-full bg-d-border" />}
                  <div className="min-w-0">
                    <div className="truncate font-bold">{u.user.display_name}</div>
                    <div className="truncate text-xs text-d-text3">@{u.user.x_username}</div>
                    <div className={`mt-1 text-2xl font-black tabular-nums leading-none ${lead ? 'text-d-text' : 'text-d-text2'}`}>{wins}<span className="ml-1 text-[11px] font-normal text-d-text3">{t('df.win')}</span></div>
                  </div>
                </Link>
              )
              return (
                <>
                  <div className="flex items-center gap-4 rounded-xl border border-d-border bg-d-med p-4">
                    {side(A, w1, w1 > w2, false)}
                    <span className="shrink-0 rounded-full bg-d-bg px-2.5 py-1 text-xs font-black text-d-text3">VS</span>
                    {side(B, w2, w2 > w1, true)}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-d-border bg-d-med">
                    {rows.map((row, i) => {
                      const v1 = row.v1 ?? 0, v2 = row.v2 ?? 0
                      const win1 = v1 > v2, win2 = v2 > v1
                      const max = Math.max(v1, v2, 1)
                      return (
                        <div key={i} className="border-b border-d-border px-4 py-3 last:border-0">
                          <div className="mb-1.5 text-center text-xs font-medium text-d-text3">{row.label}</div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-base font-extrabold tabular-nums ${win1 ? 'text-d-text' : 'text-d-text2'}`}>{v1.toLocaleString()}<span className="ml-0.5 text-[10px] font-normal text-d-text3">{row.unit}</span></span>
                            </div>
                            <span className="w-px self-stretch bg-d-border" />
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-extrabold tabular-nums ${win2 ? 'text-d-text' : 'text-d-text2'}`}>{v2.toLocaleString()}<span className="ml-0.5 text-[10px] font-normal text-d-text3">{row.unit}</span></span>
                            </div>
                          </div>
                          <div className="mt-1.5 grid grid-cols-2 gap-px">
                            <div className="flex h-1.5 justify-end overflow-hidden rounded-l-full bg-d-border"><div className={win1 ? 'bg-d-text' : 'bg-d-text3/50'} style={{ width: `${(v1 / max) * 100}%` }} /></div>
                            <div className="flex h-1.5 overflow-hidden rounded-r-full bg-d-border"><div className={win2 ? 'bg-d-text' : 'bg-d-text3/50'} style={{ width: `${(v2 / max) * 100}%` }} /></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        ) : !targetU1 ? (
          <AppEmpty icon={Swords} title={t('df.emptyT')} description={t('df.emptyD')} className="py-16" />
        ) : null}
      </div>
    </div>
  )
}
