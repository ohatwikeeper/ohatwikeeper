import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { confirmDialog } from '@/lib/confirm'
import AppEmpty from '@/components/dashboard-ui/AppEmpty'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { moreget, useSession } from '@/lib/session'
import { CONFIG } from '@/lib/config'

interface Folder { id: number; slug: string; name: string; description: string; record_count: number }
interface Rec { id: number; text: string; date: string; likes: number; reposts: number; views: number; image_url?: string | null }

function RecCard({ r, selected, onClick, onRemove }: { r: Rec; selected?: boolean; onClick?: () => void; onRemove?: () => void }) {
  const { t } = useTranslation()
  return (
    <div onClick={onClick} className={`rounded-lg border bg-d-med overflow-hidden relative ${onClick ? 'cursor-pointer' : ''} ${selected ? 'border-d-text3 ring-1 ring-d-text3' : 'border-d-border'}`}>
      {r.image_url ? (
        <img src={r.image_url} alt="" loading="lazy" className="w-full h-32 object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
      ) : <div className="h-32 flex items-center justify-center text-d-text3 text-2xl">📝</div>}
      <div className="p-3 text-xs">
        <div className="text-d-text2 mb-1">{(r.date || '').slice(0, 10)}</div>
        <div className="text-d-text line-clamp-2 min-h-[2.4em]">{r.text}</div>
        <div className="flex gap-3 mt-2 text-d-text2"><span>♥ {r.likes}</span><span>🔁 {r.reposts}</span><span>👁 {r.views}</span></div>
      </div>
      {onRemove && <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); onRemove() }} className="absolute top-2 right-2">{t('fd.remove')}</Button>}
      {selected && <div className="absolute top-2 left-2 bg-d-text text-d-bg rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✓</div>}
    </div>
  )
}

export default function FolderPage() {
  const { t } = useTranslation()
  const { ready, logged_in, public_uuid, csrf_token } = useSession()
  const [folders, setFolders] = useState<Folder[]>([])
  const [cur, setCur] = useState<Folder | null>(null)
  const [inFolder, setInFolder] = useState<Rec[]>([])
  const [all, setAll] = useState<Rec[]>([])
  const [tab, setTab] = useState<'records' | 'picker'>('records')
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formInit, setFormInit] = useState('')
  const [msg, setMsg] = useState('')

  const api = useCallback(
    (action: string, data: Record<string, any> = {}) => moreget(public_uuid!, csrf_token, action, data),
    [public_uuid, csrf_token],
  )

  useEffect(() => { document.title = t('fd.doc') }, [])

  const loadFolders = useCallback(async () => {
    const r = await api('folder_list')
    setFolders(r.folders || [])
    return (r.folders || []) as Folder[]
  }, [api])

  const loadRecords = useCallback(async (f: Folder) => {
    const r = await fetch(`/app-api/moreget?action=folder_records_get&folder_id=${f.id}`, { credentials: 'include' }).then(x => x.json())
    setInFolder(r.records || [])
  }, [public_uuid])

  useEffect(() => {
    if (!ready) return
    if (!logged_in) { window.location.href = '/login?r=folder'; return }
    loadFolders()
    fetch(`/app-api/moreget?action=load_all_records`, { credentials: 'include' })
      .then(r => r.json()).then(d => setAll(d.data || [])).catch(() => {})
  }, [ready, logged_in, public_uuid, loadFolders])

  const pick = async (f: Folder) => { setCur(f); setTab('records'); setSel(new Set()); await loadRecords(f) }

  const inIds = useMemo(() => new Set(inFolder.map(r => r.id)), [inFolder])
  const pickerList = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? all.filter(r => (r.text || '').toLowerCase().includes(q) || (r.date || '').includes(q)) : all
  }, [all, filter])

  const submit = async () => {
    const name = form.name.trim()
    if (!name) return setMsg(t('fd.nameReq'))
    if (modal === 'create') {
      const r = await api('folder_create', form)
      if (r.status !== 'success') return setMsg(r.message || t('fd.createFail'))
      const list = await loadFolders()
      const f = list.find(x => x.id === Number(r.folder_id)); if (f) await pick(f)
    } else if (cur) {
      await api('folder_update', { folder_id: cur.id, ...form })
      const list = await loadFolders(); const f = list.find(x => x.id === cur.id); if (f) setCur(f)
    }
    setModal(null); setMsg('')
  }

  const remove = async () => {
    if (!cur || !await confirmDialog(t('fd.delAsk', { n: cur.name }))) return
    await api('folder_delete', { folder_id: cur.id })
    setCur(null); setInFolder([]); await loadFolders()
  }

  const addSelected = async () => {
    if (!cur || !sel.size) return
    await api('folder_record_add', { folder_id: cur.id, record_ids: [...sel] })
    setSel(new Set()); await loadRecords(cur); await loadFolders(); setTab('records')
  }

  const removeRec = async (id: number) => {
    if (!cur) return
    await api('folder_record_remove', { folder_id: cur.id, record_id: id })
    await loadRecords(cur); await loadFolders()
  }

  const publicUrl = cur && public_uuid ? `${location.origin}${CONFIG.PAGES.FOLDER_VIEW(public_uuid, cur.slug)}` : ''

  return (
    <div className="dash-scope text-d-text">
      <div className="max-w-6xl mx-auto px-5 py-8">
<PageHeader icon={FolderOpen} title={t('fd.title')} desc={t('fd.desc')} />

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
          <aside className="border-t border-d-border pt-3 first:border-t-0 first:pt-0 h-fit">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-d-text2">{t('fd.list')}</span>
              <Button variant="default" size="sm" onClick={() => { setForm({ name: '', description: '' }); setMsg(''); setModal('create') }} >{t('fd.new')}</Button>
            </div>
            {folders.length === 0 && <div className="text-xs text-d-text2 p-2">{t('fd.none')}</div>}
            {folders.map(f => (
              <button key={f.id} onClick={() => pick(f)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between gap-2 cursor-pointer ${cur?.id === f.id ? 'bg-d-light text-d-text font-semibold' : ' text-d-text'}`}>
                <span className="truncate">📁 {f.name}</span><span className="text-xs text-d-text2">{f.record_count}</span>
              </button>
            ))}
          </aside>

          <main>
            {!cur ? (
              <div className="text-center py-16 text-d-text3 bg-d-med border border-d-border rounded-xl">{t('fd.pick')}</div>
            ) : (
              <div className="space-y-4">
                <div className="border-t border-d-border pt-5 first:border-t-0 first:pt-0 flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">{cur.name}</h2>
                    {cur.description && <p className="text-sm text-d-text2">{cur.description}</p>}
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-d-text2 hover:text-d-text break-all">{t('fd.pubPage', { u: publicUrl })}</a>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(publicUrl)} className="border-d-border">{t('fd.copyUrl')}</Button>
                    <Button variant="outline" size="sm" onClick={() => { const f0 = { name: cur.name, description: cur.description || '' }; setForm(f0); setFormInit(JSON.stringify(f0)); setMsg(''); setModal('edit') }} className="border-d-border">{t('fd.edit')}</Button>
                    <Button variant="destructive" size="sm" onClick={remove} className="border-red-500/40">{t('fd.delete')}</Button>
                  </div>
                </div>

                <div className="flex gap-2 border-b border-d-border">
                  {([['records', t('fd.tRecords', { n: inFolder.length })], ['picker', t('fd.tPicker')]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === k ? 'border-d-text3 text-d-text' : 'border-transparent text-d-text3'}`}>{l}</button>
                  ))}
                </div>

                {tab === 'records' ? (
                  inFolder.length === 0 ? <AppEmpty icon={FolderOpen} title={t('fd.empty')} description={t('fd.emptyD')} /> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{inFolder.map(r => <RecCard key={r.id} r={r} onRemove={() => removeRec(r.id)} />)}</div>
                  )
                ) : (
                  <>
                    <div className="flex gap-2 items-center">
                      <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('fd.filter')} className="flex-1 bg-d-bg border border-d-border rounded-lg px-4 py-2 text-sm outline-none focus:border-d-text3" />
                      <Button variant="default" disabled={!sel.size} onClick={addSelected} >{t('fd.addSel', { n: sel.size })}</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {pickerList.slice(0, 200).map(r => {
                        const added = inIds.has(r.id)
                        return (
                          <div key={r.id} className={added ? 'opacity-40 pointer-events-none' : ''}>
                            <RecCard r={r} selected={sel.has(r.id)} onClick={() => setSel(p => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n })} />
                          </div>
                        )
                      })}
                    </div>
                    {pickerList.length > 200 && <p className="text-xs text-d-text2 text-center">{t('fd.first200')}</p>}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-d-med border border-d-border rounded-xl p-6 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold">{modal === 'create' ? t('fd.mNew') : t('fd.mEdit')}</h3>
            <Input autoFocus maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('fd.mName')} className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm outline-none focus:border-d-text3" />
            <Textarea maxLength={500} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('fd.mDesc')} className="w-full bg-d-bg border border-d-border rounded-lg px-3 py-2 text-sm outline-none focus:border-d-text3" />
            {msg && <p className="text-red-400 text-xs">{msg}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)} className="border-d-border">{t('fd.cancel')}</Button>
              <Button variant="default" onClick={submit} disabled={modal === 'edit' && JSON.stringify(form) === formInit}>{modal === 'create' ? t('fd.create') : t('fd.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
