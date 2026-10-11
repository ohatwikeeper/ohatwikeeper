import i18n from '@/i18n'
import { DisconnectButton } from '@/components/ui/disconnect-button'
import { Switch } from '@/components/ui/switch'
import { confirmDialog } from '@/lib/confirm'
import { Checkbox } from '@/components/ui/checkbox'
import MonthDayPicker from '@/components/dashboard-ui/MonthDayPicker'
import SecuritySection from './SecuritySection'
import PasskeySection from './PasskeySection'
import ExportMenu from '@/components/dashboard-ui/ExportMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/page-loader'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { XIcon, DiscordIcon } from '@/features/login/page'
import { useCallback, useEffect, useState } from 'react'
import { friendlyError, csrfHeaders } from '@/lib/dashboard/api'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from '@/lib/toast'
import {
  Settings as SettingsIcon,
  Globe,
  ShieldCheck,
  Mail,
  Key,
  Bell,
  Webhook as WebhookIcon,
  LayoutGrid,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Plus,
  Send,
  ExternalLink,
  AlertCircle,
  Palette,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { Spinner } from '@/components/ui/spinner'
import { SimpleSelect } from '@/components/ui/simple-select'
import SaveButton from '@/components/dashboard-ui/SaveButton'
import { ThemePanel } from './theme'
import { EmailChange } from './email'
import { WidgetBuilder } from './widget-builder'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'

interface Webhook {
  id: number
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  last_status_code?: number | null
  last_triggered_at?: string | null
}

interface Widget {
  id: number
  token: string
  name: string
  created_at: string
  allowed_origins: string[]
  config?: any
}

interface SettingsData {
  user: {
    public_uuid: string
    is_public: boolean
    api_key: string | null
    lapount_linked?: boolean
    lapount_handle?: string | null
    discord_id: string | null
    discord_username: string | null
    x_id: string | null
    x_username: string | null
    primary_email: string | null
    birth_month: number | null
    birth_day: number | null
  }
  notify: {
    reminder_enabled: boolean
    reminder_times: string[]
    award_email_enabled: boolean
    weekly_summary_enabled: boolean
    monthly_summary_enabled: boolean
  }
  webhooks: Webhook[]
  widgets: Widget[]
}

async function apiCall<T = any>(path: string, method = 'POST', body?: unknown): Promise<T> {
  const r = await fetch(`/app-api/settings${path}`, {
    method,
    credentials: 'include',
    headers: csrfHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.ok === false) {
    throw new Error(j.error || i18n.t('st.err'))
  }
  return j
}

type TabType = 'account' | 'notify' | 'api' | 'webhooks' | 'widgets' | 'theme' | 'security'
const TAB_PATH: Record<TabType, string> = { account: '/settings', notify: '/settings/notify', api: '/settings/apikey', webhooks: '/settings/webhooks', widgets: '/settings/widgets', theme: '/settings/theme', security: '/settings/security' }
const TAB_BY_SEG: Record<string, TabType> = { notify: 'notify', apikey: 'api', api: 'api', webhooks: 'webhooks', webhook: 'webhooks', widgets: 'widgets', theme: 'theme', email: 'account', security: 'security', sessions: 'security' }

export default function SettingsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const nav = useNavigate()
  const { pathname, hash } = useLocation()
  // タブごとにURLを持つ(/settings/apikey など)。旧 /settings_api・#api 形式も受け付ける
  const seg = pathname.replace(/^\/settings_?/, '').replace(/^\//, '').split('/')[0]
  const activeTab: TabType = TAB_BY_SEG[seg || hash.slice(1)] ?? 'account'
  const setActiveTab = (t: TabType) => nav(TAB_PATH[t])

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/app-api/settings', { credentials: 'include' })
      if (res.status === 401) {
        window.location.href = `/login?r=settings`
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `${t('st.docTitle')} - おはツイKeeper`
    loadData()
  }, [loadData])
  useEffect(() => {
    const h = () => { void loadData() }
    window.addEventListener('dashboard:reload', h)
    return () => window.removeEventListener('dashboard:reload', h)
  }, [loadData])


  const runAction = async (fn: () => Promise<any>, successMsg?: string) => {
    try {
      const r = await fn()
      if (successMsg) toast.success(successMsg)
      await loadData()
      return r
    } catch (e: any) {
      toast.error(friendlyError(e, t('st.opFail')))
    }
  }

  if (loading) {
    return (
      <div className="dash-scope flex items-center justify-center">
        <div className="text-center text-d-text3">
          <Spinner className="mb-3" />
          <PageLoader />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="dash-scope flex items-center justify-center p-4">
        <div className="bg-d-med border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-d-text mb-2">{t('st.loadFailT')}</h2>
          <p className="text-xs text-d-text2 mb-4">{t('st.loadFailD')}</p>
          <Button variant="default"
            onClick={() => loadData()}
            
          >
            {t('st.reload')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-scope text-d-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader icon={SettingsIcon} title={t('st.docTitle')} desc={t('st.pageDesc')} />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mb-8">
          <TabsList aria-label={t('st.tabsAria')}>
            {[
              { id: 'account', label: t('st.tabAccount'), icon: Globe },
              { id: 'notify', label: t('st.tabNotify'), icon: Bell },
              { id: 'api', label: t('st.tabApi'), icon: Key },
              { id: 'webhooks', label: `Webhook (${data.webhooks.length}/5)`, icon: WebhookIcon },
              { id: 'widgets', label: t('st.tabWidgets', { n: data.widgets.length }), icon: LayoutGrid },
              { id: 'theme', label: t('tab.theme'), icon: Palette },
              { id: 'security', label: t('sec.tab'), icon: ShieldCheck },
            ].map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id}>
                <Icon className="mr-1.5 inline h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'account' && (
            <AccountTab data={data} runAction={runAction} />
          )}

          {activeTab === 'notify' && (
            <NotifyTab data={data} runAction={runAction} />
          )}

          {activeTab === 'api' && (
            <ApiTab data={data} runAction={runAction} />
          )}

          {activeTab === 'webhooks' && (
            <WebhooksTab data={data} runAction={runAction} />
          )}

          {activeTab === 'theme' && <ThemePanel />}
          {activeTab === 'security' && (<><PasskeySection /><SecuritySection /></>)}
          {activeTab === 'widgets' && (
            <WidgetsTab data={data} runAction={runAction} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Tab 1: Account & Public Settings
// -------------------------------------------------------------
function AccountTab({
  data,
  runAction,
}: {
  data: SettingsData
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const u = data.user
  const profileUrl = CONFIG.PAGES.PROFILE(u.public_uuid)
  const [bm, setBm] = useState(String(u.birth_month ?? ''))
  const [bd, setBd] = useState(String(u.birth_day ?? ''))

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Public Profile Visibility */}
      <div className="pt-4 mt-0! first:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-d-text">{t('st.profPub')}</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  u.is_public
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-d-bg text-d-text3 border border-d-border'
                }`}
              >
                {u.is_public ? t('st.public') : t('st.private')}
              </span>
            </div>
            <p className="text-xs text-d-text2 mt-1">
              {t('st.pubDesc1')}
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-d-text2 hover:text-d-text inline-flex items-center gap-0.5"
              >
                {profileUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
              {t('st.pubDesc2')}
            </p>
          </div>

          <button
            onClick={() =>
              runAction(
                () => apiCall('/toggle_public'),
                u.is_public ? t('st.toast.private') : t('st.toast.public')
              )
            }
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
              u.is_public
                ? 'border border-red-500/40 text-red-400'
                : 'bg-d-text text-d-bg '
            }`}
          >
            {u.is_public ? t('st.makePrivate') : t('st.makePublic')}
          </button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="pt-4 mt-0! first:pt-0">
        <h2 className="text-lg font-bold text-d-text mb-1">{t('st.sns')}</h2>
        <p className="text-xs text-d-text2 mb-4">
          {t('st.snsDesc')}
        </p>

        <div className="space-y-1">
          {/* X (Twitter) */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black border border-d-border flex items-center justify-center font-bold text-lg text-white">
                <XIcon />
              </div>
              <div>
                <div className="font-semibold text-sm text-d-text">X (Twitter)</div>
                <div className="text-xs text-d-text3">
                  {u.x_id ? (
                    <span className="text-d-text2">@{u.x_username || t('st.linked')}</span>
                  ) : (
                    t('st.unlinked')
                  )}
                </div>
              </div>
            </div>

            {u.x_id ? (
              <DisconnectButton onConfirm={() => runAction(() => apiCall('/unlink', 'POST', { provider: 'x' }), t('st.unlinkedX'))} />
            ) : (
              <a
                href={CONFIG.EXTERNAL.X_LOGIN('settings')}
                className="px-3 py-1.5 rounded-lg bg-d-bg border border-d-border text-d-text text-xs font-semibold"
              >
                {t('st.link')}
              </a>
            )}
          </div>

          {/* Lapount */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-d-accent/15 border border-d-accent/40 flex items-center justify-center text-sm font-black text-d-accent">L</div>
              <div>
                <div className="font-semibold text-sm text-d-text">Lapount</div>
                <div className="text-xs text-d-text3">{u.lapount_linked ? <span className="text-d-text2">{u.lapount_handle ? `@${u.lapount_handle}` : t('st.linked')}</span> : t('st.unlinked')}</div>
              </div>
            </div>
            {u.lapount_linked ? (
              <DisconnectButton onConfirm={() => runAction(() => apiCall('/unlink', 'POST', { provider: 'lapount' }), 'Lapountの連携を解除しました')} />
            ) : (
              <a href="/auth/lapount/start?r=/settings" className="px-3 py-1.5 rounded-lg bg-d-bg border border-d-border text-d-text text-xs font-semibold">{t('st.link')}</a>
            )}
          </div>

          {/* Discord */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-lg text-[#5865F2]">
                <DiscordIcon />
              </div>
              <div>
                <div className="font-semibold text-sm text-d-text">Discord</div>
                <div className="text-xs text-d-text3">
                  {u.discord_id ? (
                    <span className="text-d-text2">@{u.discord_username || t('st.linked')}</span>
                  ) : (
                    t('st.unlinked')
                  )}
                </div>
              </div>
            </div>

            {u.discord_id ? (
              <DisconnectButton onConfirm={() => runAction(() => apiCall('/unlink', 'POST', { provider: 'discord' }), t('st.unlinkedD'))} />
            ) : (
              <a
                href="/login?provider=discord&r=settings"
                className="px-3 py-1.5 rounded-lg bg-d-bg border border-d-border text-d-text text-xs font-semibold"
              >
                {t('st.link')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Primary Email */}
      <div className="pt-4 mt-0! first:pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-d-text flex items-center gap-2">
              <Mail className="w-5 h-5 text-d-text" />
              {t('st.email')}
            </h2>
            <p className="text-sm text-d-text font-mono mt-1">
              {u.primary_email || <span className="text-d-text3 font-sans">{t('st.emailNone')}</span>}
            </p>
            <p className="text-xs text-d-text3 mt-1">
              {t('st.emailDesc')}
            </p>
          </div>

          <div className="flex gap-2">
            {u.primary_email && (
              <Button variant="outline" size="sm"
                onClick={() => runAction(() => apiCall('/test_email'), t('st.testSent'))}
                className="border-d-border"
              >
                {t('st.testSend')}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 max-w-md"><EmailChange onDone={() => window.dispatchEvent(new Event('dashboard:reload'))} /></div>
      </div>

      {/* Birthday */}
      <div className="pt-4 mt-0! first:pt-0">
        <h2 className="text-lg font-bold text-d-text">{t('st.bday')}</h2>
        <p className="text-xs text-d-text3 mt-1">{t('st.bdayDesc')}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <MonthDayPicker
            month={bm ? Number(bm) : null}
            day={bd ? Number(bd) : null}
            onChange={(m, d) => { setBm(m ? String(m) : ''); setBd(d ? String(d) : '') }}
          />
          <Button variant="outline" size="sm"
            disabled={bm === String(u.birth_month ?? '') && bd === String(u.birth_day ?? '')}
            onClick={() => runAction(() => apiCall('/birthday', 'POST', { birth_month: bm, birth_day: bd }), t('st.bdaySaved'))}
            className="border-d-border"
          >
            {t('st.save')}
          </Button>
        </div>
      </div>
      {/* Export */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-d-text">{t('st.export')}</h2>
        <p className="text-xs text-d-text3 mt-1 mb-4">{t('st.exportDesc')}</p>
        <ExportMenu />
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// Tab 2: Notification Settings
// -------------------------------------------------------------
function NotifyTab({
  data,
  runAction,
}: {
  data: SettingsData
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const [notify, setNotify] = useState({
    reminder_enabled: data.notify.reminder_enabled,
    reminder_times: [0, 1, 2].map((i) =>
      (data.notify.reminder_times[i] ?? '').slice(0, 2).replace(/^0(\d)/, '$1')
    ),
    award_email_enabled: data.notify.award_email_enabled,
    weekly_summary_enabled: data.notify.weekly_summary_enabled,
    monthly_summary_enabled: data.notify.monthly_summary_enabled,
  })

  const [saving, setSaving] = useState(false)
  const initialNotify = JSON.stringify({
    reminder_enabled: data.notify.reminder_enabled,
    reminder_times: [0, 1, 2].map((i) => (data.notify.reminder_times[i] ?? '').slice(0, 2).replace(/^0(\d)/, '$1')),
    award_email_enabled: data.notify.award_email_enabled,
    weekly_summary_enabled: data.notify.weekly_summary_enabled,
    monthly_summary_enabled: data.notify.monthly_summary_enabled,
  })
  const notifyDirty = JSON.stringify(notify) !== initialNotify

  const handleSave = async () => {
    setSaving(true)
    await runAction(() => apiCall('/notify', 'PUT', notify), t('st.notifySaved'))
    setSaving(false)
  }

  return (
    <motion.div
      key="notify"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="border-t border-d-border pt-6 mt-0! first:border-t-0 first:pt-0 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-d-text flex items-center gap-2">
            <Bell className="w-5 h-5 text-d-text" />
            {t('st.mailHead')}
          </h2>
          <p className="text-xs text-d-text2 mt-1">
            {t('st.mailDesc')}
          </p>
        </div>

        <div className="divide-y divide-d-border/50">
          {/* Reminder Toggle */}
          <div>
          <div className="py-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-d-text">{t('st.remind')}</div>
              <p className="text-xs text-d-text3 mt-0.5">
                {t('st.remindDesc')}
              </p>
            </div>
            <Switch checked={notify.reminder_enabled} onCheckedChange={(v) => setNotify((p) => ({ ...p, reminder_enabled: v }))} />
          </div>

          {/* Reminder Times */}
          {notify.reminder_enabled && (
            <div className="py-4">
              <label className="block text-xs font-bold text-d-text2 uppercase tracking-wider mb-2">
                {t('st.remindTimes')}
              </label>
              <div className="flex items-center gap-3">
                {notify.reminder_times.map((rt, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <SimpleSelect
                      value={String(rt ?? '')}
                      onChange={(v) => {
                        const copy = [...notify.reminder_times]
                        copy[idx] = v
                        setNotify((p) => ({ ...p, reminder_times: copy }))
                      }}
                      options={[{ value: '', label: t('st.unset') }, ...Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${h}` }))]}
                      className="min-w-24"
                    />
                    <span className="text-xs text-d-text3">{t('st.hourUnit')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Award Email */}
          <div className="py-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-d-text">{t('st.awardN')}</div>
              <p className="text-xs text-d-text3 mt-0.5">
                {t('st.awardND')}
              </p>
            </div>
            <Switch checked={notify.award_email_enabled} onCheckedChange={(v) => setNotify((p) => ({ ...p, award_email_enabled: v }))} />
          </div>

          {/* Weekly Summary */}
          <div className="py-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-d-text">{t('st.weekly')}</div>
              <p className="text-xs text-d-text3 mt-0.5">
                {t('st.weeklyD')}
              </p>
            </div>
            <Switch checked={notify.weekly_summary_enabled} onCheckedChange={(v) => setNotify((p) => ({ ...p, weekly_summary_enabled: v }))} />
          </div>

          {/* Monthly Summary */}
          <div className="pt-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-d-text">{t('st.monthly')}</div>
              <p className="text-xs text-d-text3 mt-0.5">
                {t('st.monthlyD')}
              </p>
            </div>
            <Switch checked={notify.monthly_summary_enabled} onCheckedChange={(v) => setNotify((p) => ({ ...p, monthly_summary_enabled: v }))} />
          </div>
        </div>

        <div className="pt-4 border-t border-d-border flex justify-end">
          <SaveButton saving={saving} disabled={!notifyDirty} label={t('st.saveNotify')} onClick={handleSave} />
        </div>
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// Tab 3: API Key Management
// -------------------------------------------------------------
function ApiTab({
  data,
  runAction,
}: {
  data: SettingsData
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const key = data.user.api_key

  const copyKey = () => {
    if (!key) return
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true)
      toast.success(t('st.keyCopied'))
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      key="api"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="border-t border-d-border pt-6 mt-0! first:border-t-0 first:pt-0">
        <h2 className="text-lg font-bold text-d-text flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-d-text" />
          {t('st.keyHead')}
        </h2>
        <p className="text-xs text-d-text2 mb-6">
          {t('st.keyDesc1')}<Link to={CONFIG.PAGES.CLI_TOOLS} className="text-d-text2 hover:text-d-text">ohax-cli</Link>{t('st.keyDesc2')}
        </p>

        {key ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-d-bg border border-d-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1 font-mono text-xs text-d-text break-all">
                {showKey ? key : key.slice(0, 8) + '••••••••••••••••••••••••••••••••'}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="border-d-border"
                  title={showKey ? t('st.hide') : t('st.show')}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                <Button variant="outline" size="sm"
                  onClick={copyKey}
                  className="border-d-border flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {t('st.copy')}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm"
                onClick={async () => {
                  if (
                    await confirmDialog(t('st.regenQ'))
                  ) {
                    runAction(
                      () => apiCall('/api_key', 'POST', { operation: 'regenerate' }),
                      t('st.regenDone')
                    )
                  }
                }}
                className="border-d-border flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('st.regen')}
              </Button>

              <Button variant="destructive" size="sm"
                onClick={async () => {
                  if (await confirmDialog(t('st.delKeyQ'))) {
                    runAction(
                      () => apiCall('/api_key', 'POST', { operation: 'delete' }),
                      t('st.delKeyDone')
                    )
                  }
                }}
                className="border-red-500/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('st.delKey')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-d-bg rounded-xl border border-d-border">
            <Key className="w-8 h-8 text-d-text3 mx-auto mb-2" />
            <p className="text-xs text-d-text3 mb-4">{t('st.noKey')}</p>
            <Button variant="default" size="sm"
              onClick={() =>
                runAction(
                  () => apiCall('/api_key', 'POST', { operation: 'generate' }),
                  t('st.keyIssued')
                )
              }
              
            >
              {t('st.issueKey')}
            </Button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-d-border/60 text-xs text-d-text3 space-y-1">
          <p>
            {t('st.tip1')}
            <Link to={CONFIG.PAGES.CLI_TOOLS} className="text-d-text2 hover:text-d-text">
              {t('st.tipCli')}
            </Link>{' '}
            {t('st.tipOr')}
            <Link to={CONFIG.PAGES.HOW_TO_USE} className="text-d-text2 hover:text-d-text">
              {t('st.tipHow')}
            </Link>{' '}
            {t('st.tip2')}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// Tab 4: Webhook Settings
// -------------------------------------------------------------
function WebhooksTab({
  data,
  runAction,
}: {
  data: SettingsData
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', url: '', events: ['record_added'] })
  const [adding, setAdding] = useState(false)

  const toggleEvent = (ev: string) => {
    setForm((p) => ({
      ...p,
      events: p.events.includes(ev) ? p.events.filter((x) => x !== ev) : [...p.events, ev],
    }))
  }

  const handleCreate = async () => {
    if (!form.url.trim()) return toast.error(t('st.whUrl'))
    setAdding(true)
    await runAction(async () => {
      await apiCall('/webhooks', 'POST', form)
      setForm({ name: '', url: '', events: ['record_added'] })
    }, t('st.whAdded'))
    setAdding(false)
  }

  return (
    <motion.div
      key="webhooks"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="border-t border-d-border pt-6 mt-0! first:border-t-0 first:pt-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-d-text flex items-center gap-2">
              <WebhookIcon className="w-5 h-5 text-d-text" />
              {t('st.whHead', { n: data.webhooks.length })}
            </h2>
            <p className="text-xs text-d-text2 mt-1">
              {t('st.whDesc')}
            </p>
          </div>
        </div>

        {/* Existing Webhooks List */}
        <div className="space-y-4 mb-6">
          {data.webhooks.length === 0 ? (
            <div className="text-center py-10 bg-d-bg rounded-xl border border-d-border text-xs text-d-text3">
              {t('st.whNone')}
            </div>
          ) : (
            data.webhooks.map((w) => (
              <WebhookItem key={w.id} webhook={w} runAction={runAction} />
            ))
          )}
        </div>

        {/* Create Webhook Form */}
        {data.webhooks.length < 5 && (
          <div className="p-5 rounded-xl bg-d-bg border border-d-border space-y-4">
            <h3 className="text-sm font-bold text-d-text flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-d-text" /> {t('st.whNew')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="text"
                placeholder={t('st.whNamePh')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-d-med border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
              />

              <Input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="md:col-span-2 bg-d-med border border-d-border rounded-lg px-3 py-2 text-sm text-d-text outline-none focus:border-d-text3"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-d-text">
              <span className="font-semibold text-d-text3">{t('st.whTrig')}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox checked={form.events.includes('record_added')} onCheckedChange={() => toggleEvent('record_added')} />
                {t('st.whEvAdd')}
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox checked={form.events.includes('record_deleted')} onCheckedChange={() => toggleEvent('record_deleted')} />
                {t('st.whEvDel')}
              </label>
            </div>

            <div className="flex justify-end">
              <Button variant="default" size="sm"
                onClick={handleCreate}
                disabled={adding}
                
              >
                {adding ? t('st.adding') : t('st.addWh')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function WebhookItem({
  webhook: w,
  runAction,
}: {
  webhook: Webhook
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const [showSecret, setShowSecret] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await apiCall<{ status_code: number }>(`/webhooks/${w.id}/test`)
      toast.success(t('st.testDone', { c: res.status_code }))
      runAction(async () => {})
    } catch (e: any) {
      toast.error(friendlyError(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="border-t border-d-border pt-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-d-text">{w.name}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
              w.is_active
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-d-med text-d-text3 border border-d-border'
            }`}
          >
            {w.is_active ? t('st.active') : t('st.paused')}
          </span>
          {w.last_status_code !== undefined && w.last_status_code !== null && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                w.last_status_code >= 200 && w.last_status_code < 300
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              HTTP {w.last_status_code}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm"
            onClick={handleTest}
            disabled={testing}
            className="border-d-border flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            {testing ? t('st.sending') : t('st.testSend')}
          </Button>
          <a
            href={`/settings/webhook/${w.id}`}
            className="px-2.5 py-1 rounded bg-d-med border border-d-border !text-d-text text-xs flex items-center gap-1"
          >
            {t('st.log')}
          </a>
          <Button variant="outline" size="sm"
            onClick={() => setShowSecret(!showSecret)}
            className="border-d-border"
          >
            {showSecret ? t('st.hideSecret') : t('st.showSecret')}
          </Button>
          <Button variant="destructive" size="sm"
            onClick={async () => {
              if (await confirmDialog(t('st.delWhQ'))) {
                runAction(() => apiCall(`/webhooks/${w.id}`, 'DELETE'), t('st.delWhDone'))
              }
            }}
            
            title={t('st.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="font-mono text-xs text-d-text3 break-all">{w.url}</div>

      {showSecret && (
        <div className="p-2 rounded bg-black/40 border border-d-border/60 text-xs font-mono text-d-text2 flex items-center justify-between">
          <span className="truncate">Secret: {w.secret}</span>
          <Button variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(w.secret)
              toast.success(t('st.secretCopied'))
            }}
            className="ml-2 shrink-0"
          >
            {t('st.copy')}
          </Button>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Tab 5: Widgets
// -------------------------------------------------------------
function WidgetsTab({
  data,
  runAction,
}: {
  data: SettingsData
  runAction: (fn: () => Promise<any>, msg?: string) => Promise<any>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [origins, setOrigins] = useState<Record<number, string>>({})

  const handleCreate = async (config: Record<string, string>) => {
    if (!name.trim()) return toast.error(t('st.wgName'))
    await runAction(async () => {
      await apiCall('/widgets', 'POST', { name: name.trim(), config })
      setName('')
    }, t('st.wgMade'))
  }

  return (
    <motion.div
      key="widgets"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="border-t border-d-border pt-6 mt-0! first:border-t-0 first:pt-0">
        <h2 className="text-lg font-bold text-d-text flex items-center gap-2 mb-1">
          <LayoutGrid className="w-5 h-5 text-d-text" />
          {t('st.wgHead')}
        </h2>
        <p className="text-xs text-d-text2 mb-6">
          {t('st.wgDesc')}
        </p>

        {/* Existing Widgets */}
        <div className="space-y-4 mb-6">
          {data.widgets.length === 0 ? (
            <div className="text-center py-10 bg-d-bg rounded-xl border border-d-border text-xs text-d-text3">
              {t('st.wgNone')}
            </div>
          ) : (
            data.widgets.map((w) => {
              const widgetUrl = `${window.location.origin}/widget/v/${w.token}`
              return (
                <div key={w.id} className="border-t border-d-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-d-text">{w.name}</span>
                      <span className="text-xs text-d-text3 ml-2">{w.created_at?.slice(0, 10)}</span>
                    </div>

                    <Button variant="destructive" size="sm"
                      onClick={async () => {
                        if (await confirmDialog(t('st.delWgQ'))) {
                          runAction(() => apiCall(`/widgets/${w.id}`, 'DELETE'), t('st.delWgDone'))
                        }
                      }}
                      
                      title={t('st.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-d-border/60 flex items-center justify-between gap-2">
                    <code className="text-xs text-d-text font-mono truncate">{widgetUrl}</code>
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(widgetUrl)
                        toast.success(t('st.wgUrlCopied'))
                      }}
                      className="border-d-border flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" /> {t('st.copy')}
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-d-border/60 flex items-center justify-between gap-2">
                    <code className="text-xs text-d-text font-mono truncate">{`<iframe src="${widgetUrl}" style="border:0;width:100%;height:200px" loading="lazy"></iframe>`}</code>
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${widgetUrl}" style="border:0;width:100%;height:200px" loading="lazy"></iframe>`)
                        toast.success(t('st.embedCopied'))
                      }}
                      className="border-d-border flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" /> {t('st.code')}
                    </Button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-d-text3 uppercase mb-1">
                      {t('st.origins')}
                    </label>
                    <Textarea
                      rows={2}
                      value={origins[w.id] ?? w.allowed_origins.join('\n')}
                      onChange={(e) => setOrigins({ ...origins, [w.id]: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-d-med border border-d-border rounded-lg px-3 py-1.5 text-xs text-d-text font-mono outline-none focus:border-d-text3"
                    />
                    <div className="flex justify-end mt-1.5">
                      <Button variant="outline" size="sm"
                        onClick={() =>
                          runAction(
                            () =>
                              apiCall(`/widgets/${w.id}/origins`, 'PUT', {
                                origins: (origins[w.id] ?? w.allowed_origins.join('\n')).split('\n'),
                              }),
                            t('st.originsSaved')
                          )
                        }
                        className="border-d-border"
                      >
                        {t('st.originsSave')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Create Widget Form */}
        <WidgetBuilder uuid={data.user.public_uuid} name={name} setName={setName} onCreate={handleCreate} />
      </div>
    </motion.div>
  )
}
