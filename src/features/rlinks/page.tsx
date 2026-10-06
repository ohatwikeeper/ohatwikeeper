import i18n from '@/i18n'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Link2Off, SearchX } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { confirmDialog } from '@/lib/confirm'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { Pagination } from '@/components/arc/pagination/pagination'
import { SimpleSelect } from '@/components/ui/simple-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { PageLoader } from '@/components/ui/page-loader'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CopyChip } from '@/components/ui/copy-chip'
import RLinkDetailPage from './detail'
import { friendlyError, csrfHeaders } from '@/lib/dashboard/api'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from '@/lib/toast'
import {
  Link as LinkIcon,
  QrCode,
  BarChart2,
  Trash2,
  Edit3,
  ExternalLink,
  Plus,
  Search,
  Download,
  Lock,
  Eye,
  Clock,
  Sparkles,
  Tag,
  ArrowUpDown,
  X,
  TrendingUp } from 'lucide-react'

interface ShortLink {
  id: number
  uuid: string
  slug: string
  original_url: string
  title: string | null
  expiry_date: string | null
  max_uses: number | null
  use_count: number
  tags: string | null
  created_at: string
  show_preview: boolean
  has_password: boolean
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  ab_variants: any
  geo_variants: any
  url_mobile?: string | null
  url_tablet?: string | null
  og_image_url?: string | null
  og_title?: string | null
  og_description?: string | null
  short_url: string
}

interface TagItem {
  name: string
  count: number
}

interface TopLink {
  slug: string
  title: string | null
  use_count: number
}

interface RLinksData {
  total: number
  page: number
  per: number
  pages: number
  total_clicks: number
  links: ShortLink[]
  tags: TagItem[]
  top: TopLink[]
}

interface AccessLog {
  accessed_at: string
  country: string
  cc: string
  region: string
  browser: string
  os: string
  device: string
  referrer: string
  is_bot: boolean
  flag: string
  ref_domain: string
}

async function apiCall<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/app-api/r-links${path}`, {
    method,
    credentials: 'include',
    headers: csrfHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error(json.error || i18n.t('rl.err'))
  }
  return json as T
}

export default function RLinksPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const [data, setData] = useState<RLinksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'new' | 'old' | 'clicks' | 'title'>('new')
  const [currentPage, setCurrentPage] = useState(1)

  // Modals & Panels
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null)
  const [logModalLink, setLogModalLink] = useState<ShortLink | null>(null)

  // Load Short Links
  const fetchLinks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (selectedTag) params.set('tag', selectedTag)
      params.set('sort', sortBy)

      const res = await apiCall<RLinksData>(`?${params.toString()}`)
      setData(res)
    } catch (e: any) {
      setError(friendlyError(e, t('rl.fetchFail')))
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, selectedTag, sortBy])

  useEffect(() => {
    document.title = t('rl.doc')
    fetchLinks()
  }, [fetchLinks])


  // Delete Link
  const handleDelete = async (link: ShortLink) => {
    if (!await confirmDialog(t('rl.delAsk', { n: link.title || link.slug }))) return
    try {
      await apiCall(`/${link.slug}`, 'DELETE')
      toast.success(t('rl.deleted'))
      fetchLinks()
    } catch (e: any) {
      toast.error(friendlyError(e))
    }
  }

  return (
    <div>
      <div className={slug ? 'hidden' : 'min-w-0'}>
    <div className="dash-scope text-d-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          icon={LinkIcon}
          title={<>{t('rl.title')} <span className="font-mono text-sm font-normal text-d-text3">r-links</span></>}
          desc={t('rl.desc')}
          right={
          <div className="flex items-center gap-3">
            <a
              href="/app-api/r-links/export/csv"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-d-border bg-d-med text-d-text transition-all text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-d-text2" />
              {t('rl.csv')}
            </a>

            <Button variant="default"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t('rl.create')}
            </Button>
          </div>
          }
        />

        {/* Stats Row */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wider text-d-text3 font-bold mb-1">
                {t('rl.totalLinks')}
              </div>
              <div className="text-2xl font-bold text-d-text">
                {data.total.toLocaleString()} <span className="text-xs text-d-text3 font-normal">{t('rl.unitItems')}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs uppercase tracking-wider text-d-text3 font-bold mb-1">
                {t('rl.totalClicks')}
              </div>
              <div className="text-2xl font-bold text-d-text">
                {data.total_clicks.toLocaleString()} <span className="text-xs text-d-text3 font-normal">{t('rl.unitTimes')}</span>
              </div>
            </div>

            <div className="pt-2 col-span-2">
              <div className="text-xs uppercase tracking-wider text-d-text3 font-bold mb-1.5 flex items-center justify-between">
                <span>{t('rl.top3')}</span>
                <Sparkles className="w-3.5 h-3.5 text-d-text" />
              </div>
              <div className="flex flex-wrap gap-2">
                {data.top.length === 0 ? (
                  <span className="text-xs text-d-text3">{t('rl.noClicks')}</span>
                ) : (
                  data.top.slice(0, 3).map((item) => (
                    <div
                      key={item.slug}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-d-bg border border-d-border text-xs text-d-text2"
                    >
                      <span className="font-mono text-d-text font-semibold">{item.slug}</span>
                      <span className="text-d-text3">({item.use_count} clicks)</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search, Filter & Tag Bar */}
        <div className="border-t border-d-border pt-4 first:border-t-0 first:pt-0 mb-6 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-d-text3" />
              <Input
                type="text"
                placeholder={t('rl.search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-d-bg border border-d-border text-d-text text-sm placeholder:text-d-text3 outline-none focus:border-d-text3 transition-colors"
              />
              {searchQuery && (
                <Button variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-d-text3" />
              <SimpleSelect
              value={sortBy}
              onChange={(v) => { setSortBy(v as any); setCurrentPage(1) }}
              options={[{ value: 'new', label: t('rl.sNew') }, { value: 'old', label: t('rl.sOld') }, { value: 'clicks', label: t('rl.sClicks') }, { value: 'title', label: t('rl.sTitle') }]}
            />
            </div>
          </div>

          {/* Tag Badges Filter */}
          {data?.tags && data.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-d-border/60">
              <span className="text-xs text-d-text3 font-medium mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {t('rl.tag')}
              </span>
              <button
                onClick={() => {
                  setSelectedTag(null)
                  setCurrentPage(1)
                }}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  selectedTag === null
                    ? 'bg-d-text text-d-bg font-semibold'
                    : 'bg-d-bg border border-d-border text-d-text2 hover:text-d-text'
                }`}
              >
                {t('rl.all')}
              </button>
              {data.tags.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setSelectedTag(t.name === selectedTag ? null : t.name)
                    setCurrentPage(1)
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedTag === t.name
                      ? 'bg-d-text text-d-bg font-semibold'
                      : 'bg-d-bg border border-d-border text-d-text2 hover:text-d-text'
                  }`}
                >
                  #{t.name} <span className="opacity-70 text-[10px]">({t.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Links List */}
        {loading ? (
          <div className="text-center py-20 text-d-text3">
            <Spinner className="mb-3" />
            <PageLoader />
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-center">
            <p className="font-semibold">{error}</p>
            <Button variant="outline" size="sm"
              onClick={fetchLinks}
              className="mt-3 border-d-border"
            >
              {t('rl.retry')}
            </Button>
          </div>
        ) : !data || data.links.length === 0 ? (
          <div className="text-center">
            <AppEmpty
              icon={searchQuery || selectedTag ? SearchX : Link2Off}
              className="pb-6"
              title={t('rl.notFound')}
              description={searchQuery || selectedTag
                ? t('rl.notFoundF')
                : t('rl.notFoundN')}
            />
            {searchQuery || selectedTag ? (
              <Button variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTag(null)
                }}
                className="border-d-border"
              >
                {t('rl.clearF')}
              </Button>
            ) : (
              <Button variant="default"
                onClick={() => setIsCreateOpen(true)}
                
              >
                {t('rl.createFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.links.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-d-border pt-4 sm:pt-5 first:border-t-0 first:pt-0 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Link Info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-d-text truncate">
                        {link.title || link.slug}
                      </h3>

                      {link.has_password && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                          <Lock className="w-3 h-3" /> {t('rl.pw')}
                        </span>
                      )}

                      {link.show_preview && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <Eye className="w-3 h-3" /> {t('rl.preview')}
                        </span>
                      )}

                      {link.expiry_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                          <Clock className="w-3 h-3" /> {t('rl.expiry', { d: link.expiry_date.slice(0, 10) })}
                        </span>
                      )}
                    </div>

                    {/* Short URL & Copy Action */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={link.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-d-text2 font-semibold text-sm flex items-center gap-1 break-all hover:text-d-text"
                      >
                        {(() => { try { return new URL(link.short_url).pathname } catch { return '/' + link.slug } })()}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      </a>

                      <CopyChip text={link.short_url} />
                    </div>

                    {/* Original Destination */}
                    <div className="text-xs text-d-text3 truncate max-w-xl">
                      <span className="text-d-text2">{t('rl.dest')}</span>{' '}
                      <a
                        href={link.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-d-text2 hover:text-d-text"
                      >
                        {link.original_url}
                      </a>
                    </div>

                    {/* Tags & Meta */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-d-text3">
                      {link.tags &&
                        link.tags.split(',').map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-d-bg border border-d-border/70 text-d-text2 text-[11px]"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      <span>{t('rl.created', { d: link.created_at.slice(0, 10) })}</span>
                    </div>
                  </div>

                  {/* Right Actions & Stats */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-d-border/60">
                    {/* Click Stats Pill */}
                    <div className="px-3.5 py-1.5 rounded-lg bg-d-bg border border-d-border text-center min-w-20">
                      <div className="text-[10px] text-d-text3 uppercase font-bold">Clicks</div>
                      <div className="text-lg font-bold text-d-text">
                        {link.use_count.toLocaleString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/r-links/${link.slug}`}
                        className="p-2 rounded-lg border border-d-border bg-d-bg !text-d-text2 hover:!text-d-text text-xs"
                        title={t('rl.detail')}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Link>
                      <Button variant="outline" size="sm"
                        onClick={() => setLogModalLink(link)}
                        className="border-d-border"
                        title={t('rl.logs')}
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" size="sm"
                        onClick={() => setQrModalLink(link)}
                        className="border-d-border"
                        title={t('rl.showQr')}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" size="sm"
                        onClick={() => setEditingLink(link)}
                        className="border-d-border"
                        title={t('rl.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button variant="destructive" size="sm"
                        onClick={() => handleDelete(link)}
                        className="border-red-500/30"
                        title={t('rl.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-sm text-d-text2">
            <span className="tabular-nums">{t('rl.pageInfo', { p: currentPage, n: data.pages, t: data.total })}</span>
            <Pagination page={currentPage} pageCount={data.pages} onPageChange={setCurrentPage} label={t('rl.pagLabel')} />
          </div>
        )}

        {/* Create Link Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <LinkEditorModal
              onClose={() => setIsCreateOpen(false)}
              onSaved={() => {
                setIsCreateOpen(false)
                fetchLinks()
              }}
            />
          )}
        </AnimatePresence>

        {/* Edit Link Modal */}
        <AnimatePresence>
          {editingLink && (
            <LinkEditorModal
              link={editingLink}
              onClose={() => setEditingLink(null)}
              onSaved={() => {
                setEditingLink(null)
                fetchLinks()
              }}
            />
          )}
        </AnimatePresence>

        {/* QR Code Modal */}
        <AnimatePresence>
          {qrModalLink && (
            <QrCodeModal link={qrModalLink} onClose={() => setQrModalLink(null)} />
          )}
        </AnimatePresence>

        {/* Access Logs Modal */}
        <AnimatePresence>
          {logModalLink && (
            <AccessLogsModal link={logModalLink} onClose={() => setLogModalLink(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
      </div>
      {slug && (
        <div className="dash-scope">
          <RLinkDetailPage slug={slug} />
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Link Editor Modal (Create / Edit)
// -------------------------------------------------------------
function LinkEditorModal({
  link,
  onClose,
  onSaved,
}: {
  link?: ShortLink
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(link)
  const [tab, setTab] = useState<'basic' | 'utm' | 'advanced'>('basic')
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [originalUrl, setOriginalUrl] = useState(link?.original_url || '')
  const [customSlug, setCustomSlug] = useState(link?.slug || '')
  const [title, setTitle] = useState(link?.title || '')
  const [tags, setTags] = useState(link?.tags || '')
  const [expiryDate, setExpiryDate] = useState(link?.expiry_date ? link.expiry_date.slice(0, 16) : '')
  const [maxUses, setMaxUses] = useState(link?.max_uses ? String(link.max_uses) : '')
  const [password, setPassword] = useState('')
  const [showPreview, setShowPreview] = useState(link ? link.show_preview : false)

  // UTM
  const [urlMobile, setUrlMobile] = useState(link?.url_mobile || '')
  const [urlTablet, setUrlTablet] = useState(link?.url_tablet || '')
  const [ogImage, setOgImage] = useState(link?.og_image_url || '')
  const [ogTitle, setOgTitle] = useState(link?.og_title || '')
  const [ogDesc, setOgDesc] = useState(link?.og_description || '')
  const jv = (x: any) => (x == null ? '' : typeof x === 'string' ? x : JSON.stringify(x))
  const [abVariants, setAbVariants] = useState(jv(link?.ab_variants))
  const [geoVariants, setGeoVariants] = useState(jv(link?.geo_variants))
  const [utmSource, setUtmSource] = useState(link?.utm_source || '')
  const [utmMedium, setUtmMedium] = useState(link?.utm_medium || '')
  const [utmCampaign, setUtmCampaign] = useState(link?.utm_campaign || '')
  const [utmTerm, setUtmTerm] = useState(link?.utm_term || '')
  const [utmContent, setUtmContent] = useState(link?.utm_content || '')
  const formSnap = JSON.stringify([originalUrl, customSlug, title, tags, expiryDate, maxUses, password, showPreview, urlMobile, urlTablet, ogImage, ogTitle, ogDesc, abVariants, geoVariants, utmSource, utmMedium, utmCampaign, utmTerm, utmContent])
  const initSnap = useRef(formSnap)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!originalUrl.trim()) {
      toast.error(t('rl.needDest'))
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        original_url: originalUrl.trim(),
        title: title.trim() || null,
        tags: tags.trim() || null,
        expiry_date: expiryDate ? expiryDate.replace('T', ' ') + ':00' : null,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        show_preview: showPreview ? 1 : 0,
        utm_source: utmSource.trim() || null,
        utm_medium: utmMedium.trim() || null,
        utm_campaign: utmCampaign.trim() || null,
        utm_term: utmTerm.trim() || null,
        utm_content: utmContent.trim() || null,
        url_mobile: urlMobile.trim() || null,
        url_tablet: urlTablet.trim() || null,
        og_image_url: ogImage.trim() || null,
        og_title: ogTitle.trim() || null,
        og_description: ogDesc.trim() || null,
        ab_variants: abVariants.trim() || null,
        geo_variants: geoVariants.trim() || null,
      }

      if (password.trim()) {
        payload.password = password.trim()
      }

      if (!isEdit && customSlug.trim()) {
        payload.custom_slug = customSlug.trim()
      }

      if (isEdit && link) {
        await apiCall(`/${link.slug}`, 'PUT', payload)
        toast.success(t('rl.updated'))
      } else {
        const res = await apiCall<{ short_url: string }>('', 'POST', payload)
        toast.success(t('rl.createdOk', { u: res.short_url }))
      }
      onSaved()
    } catch (err: any) {
      toast.error(friendlyError(err, t('rl.saveFail')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-d-med border border-d-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-d-border">
          <h2 className="text-lg font-bold text-d-text flex items-center gap-2">
            <span>{isEdit ? '✏️' : '🔗'}</span>
            {isEdit ? t('rl.editTitle') : t('rl.newTitle')}
          </h2>
          <Button variant="ghost"
            onClick={onClose}
            
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-d-border bg-d-bg/40 px-5 text-sm font-semibold">
          {[
            ['basic', t('rl.tBasic')],
            ['utm', t('rl.tUtm')],
            ['advanced', t('rl.tAdv')],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as any)}
              className={`py-3 px-4 border-b-2 transition-colors ${
                tab === key
                  ? 'border-d-text3 text-d-text'
                  : 'border-transparent text-d-text3 hover:text-d-text2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {tab === 'basic' && (
            <>
              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.destUrl')} <span className="text-red-400">*</span>
                </label>
                <Input
                  type="url"
                  required
                  placeholder="https://example.com/your-long-url..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                    {t('rl.slug')}
                  </label>
                  <div className="flex items-center gap-1.5 bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm">
                    <span className="text-d-text3 select-none">https://go.ohax.pw/</span>
                    <Input
                      type="text"
                      placeholder="my-link"
                      pattern="[A-Za-z0-9_-]{3,20}"
                      title={t('rl.slugRule')}
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      className="bg-transparent border-none outline-none flex-1 text-d-text text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-d-text3 mt-1">
                    {t('rl.slugNote')}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.titleAdmin')}
                </label>
                <Input
                  type="text"
                  placeholder={t('rl.titlePh')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.tags')}
                </label>
                <Input
                  type="text"
                  placeholder="sns, x, campaign"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>
            </>
          )}

          {tab === 'utm' && (
            <div className="space-y-3">
              <p className="text-xs text-d-text2 mb-3">
                {t('rl.utmNote')}
              </p>
              <div>
                <label className="block text-xs font-bold text-d-text3 mb-1">{t('rl.uSource')}</label>
                <Input
                  type="text"
                  placeholder="twitter, newsletter, discord"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-d-text3 mb-1">{t('rl.uMedium')}</label>
                <Input
                  type="text"
                  placeholder="social, post, banner"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-d-text3 mb-1">{t('rl.uCampaign')}</label>
                <Input
                  type="text"
                  placeholder="morning_post_2026"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-d-text3 mb-1">{t('rl.uTerm')}</label>
                  <Input
                    type="text"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-d-text3 mb-1">{t('rl.uContent')}</label>
                  <Input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.expiryLabel')}
                </label>
                <Input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
                <p className="text-[11px] text-d-text3 mt-1">{t('rl.expiryNote')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.maxClicks')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000000"
                  placeholder={t('rl.unlimited')}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">
                  {t('rl.pwLabel')}
                </label>
                <Input
                  type="password"
                  placeholder={isEdit ? t('rl.pwKeep') : t('rl.pwNone')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-d-text select-none">
                  <Checkbox checked={showPreview} onCheckedChange={(v) => setShowPreview(!!v)} />
                  <span>{t('rl.previewChk')}</span>
                </label>
              </div>

              {([
                [t('rl.fMobile'), urlMobile, setUrlMobile, 'url'],
                [t('rl.fTablet'), urlTablet, setUrlTablet, 'url'],
                [t('rl.fOgImg'), ogImage, setOgImage, 'url'],
                [t('rl.fOgTitle'), ogTitle, setOgTitle, 'text'],
                [t('rl.fOgDesc'), ogDesc, setOgDesc, 'text'],
              ] as const).map(([lb, v, set, ty]) => (
                <div key={lb}>
                  <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-1.5">{lb}</label>
                  <Input type={ty} value={v} onChange={(e) => set(e.target.value)} placeholder={t('rl.optional')}
                    className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none" />
                </div>
              ))}
              {([
                [t('rl.fAb'), abVariants, setAbVariants],
                [t('rl.fGeo'), geoVariants, setGeoVariants],
              ] as const).map(([lb, v, set]) => (
                <div key={lb}>
                  <label className="block text-xs font-bold text-d-text2 mb-1.5">{lb}</label>
                  <Textarea rows={3} value={v} onChange={(e) => set(e.target.value)} placeholder={t('rl.emptyOff')}
                    className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-xs font-mono text-d-text outline-none" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-d-border mt-6">
            <Button variant="outline"
              type="button"
              onClick={onClose}
              className="border-d-border"
            >
              {t('rl.cancel')}
            </Button>
            <Button variant="default"
              type="submit"
              disabled={submitting || (isEdit && formSnap === initSnap.current)}
              
            >
              {submitting ? t('rl.saving') : isEdit ? t('rl.saveChg') : t('rl.doCreate')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// -------------------------------------------------------------
// QR Code Display Modal
// -------------------------------------------------------------
function QrCodeModal({ link, onClose }: { link: ShortLink; onClose: () => void }) {
  const { t } = useTranslation()
  const qrUrl = `https://ohatwikeeper.com/qr?size=300&data=${encodeURIComponent(link.short_url)}`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-d-med border border-d-border rounded-xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-d-text text-base flex items-center gap-2">
            <QrCode className="w-5 h-5 text-d-text" /> {t('rl.qr')}
          </h3>
          <Button variant="ghost"
            onClick={onClose}
            
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
          <img
            src={qrUrl}
            alt={`QR code for ${link.short_url}`}
            className="w-56 h-56 object-contain"
          />
        </div>

        <div className="space-y-1 mb-5">
          <div className="font-mono text-sm font-semibold text-d-text break-all">
            {link.short_url}
          </div>
          <p className="text-xs text-d-text3 truncate max-w-xs mx-auto">
            {link.title || link.original_url}
          </p>
        </div>

        <div className="flex gap-2">
          <CopyChip text={link.short_url} label={t('rl.copyUrl')} className="flex-1 justify-center py-2 text-xs font-semibold" />
          <a
            href={qrUrl}
            download={`qr-${link.slug}.png`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 rounded-lg bg-d-text text-d-bg text-xs font-bold  flex items-center justify-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> {t('rl.saveImg')}
          </a>
        </div>
      </motion.div>
    </div>
  )
}

// -------------------------------------------------------------
// Access Logs Modal
// -------------------------------------------------------------
function AccessLogsModal({ link, onClose }: { link: ShortLink; onClose: () => void }) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    apiCall<{ success: boolean; logs: AccessLog[]; total: number; pages: number }>(
      `/${link.slug}/logs?page=${page}`
    )
      .then((res) => {
        setLogs(res.logs)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((err) => toast.error(friendlyError(err)))
      .finally(() => setLoading(false))
  }, [link.slug, page])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-d-med border border-d-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-d-border">
          <div>
            <h3 className="font-bold text-d-text text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-d-text" />
              {t('rl.logTitle')} <span className="font-mono text-d-text">{link.slug}</span>
            </h3>
            <p className="text-xs text-d-text3 mt-0.5">
              {t('rl.logTotal', { n: total.toLocaleString() })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/app-api/r-links/export/csv?slug=${link.slug}&target=clicks`}
              download
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-d-border bg-d-bg text-xs text-d-text font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              {t('rl.logCsv')}
            </a>
            <Button variant="ghost"
              onClick={onClose}
              
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-16 text-d-text3">
              <Spinner className="mb-2" />
              <PageLoader />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-d-text3 text-sm">
              {t('rl.noLogs')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-xs text-d-text">
                <TableHeader>
                  <TableRow className="border-b border-d-border/60 text-d-text3 font-semibold">
                    <TableHead className="pb-2">{t('rl.cDate')}</TableHead>
                    <TableHead className="pb-2">{t('rl.cCountry')}</TableHead>
                    <TableHead className="pb-2">{t('rl.cOs')}</TableHead>
                    <TableHead className="pb-2">{t('rl.cDevice')}</TableHead>
                    <TableHead className="pb-2">{t('rl.cReferrer')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-d-border/40">
                  {logs.map((log, idx) => (
                    <TableRow key={idx} className="">
                      <TableCell className="py-2.5 font-mono text-d-text2 whitespace-nowrap">
                        {log.accessed_at}
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <span className="mr-1.5">{log.flag}</span>
                        <span>{log.country || t('rl.unknown')}</span>
                        {log.region && (
                          <span className="text-d-text3 ml-1">({log.region})</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-d-text2">
                        {log.os || t('rl.unknown')} / {log.browser || t('rl.unknown')}
                        {log.is_bot && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px]">
                            Bot
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-d-text3 capitalize">{log.device || '-'}</TableCell>
                      <TableCell className="py-2.5 text-d-text truncate max-w-48">
                        {log.ref_domain || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-d-border flex items-center justify-between gap-3 text-xs text-d-text2">
            <span className="tabular-nums">{t('rl.totalN', { n: total })}</span>
            <Pagination page={page} pageCount={pages} onPageChange={setPage} label={t('rl.pagLabel')} />
          </div>
        )}
      </motion.div>
    </div>
  )
}
