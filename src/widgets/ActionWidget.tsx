import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

type FeedbackType = 'bug' | 'feature' | 'other'
type ModalState = null | 'fb' | 'su'
type SuMode = 'current' | 'custom'

interface SessionData {
  logged_in: boolean
  x_username: string | null
  csrf_token: string
}

export default function ActionWidget() {
  const { t } = useTranslation()
  const [dialOpen, setDialOpen]   = useState(false)
  const [modal, setModal]         = useState<ModalState>(null)
  const [session, setSession]     = useState<SessionData>({ logged_in: false, x_username: null, csrf_token: '' })

  // feedback state
  const [fbType, setFbType]       = useState<FeedbackType>('other')
  const [fbContent, setFbContent] = useState('')
  const [fbImage, setFbImage]     = useState<File | null>(null)
  const [fbImgPrev, setFbImgPrev] = useState<string | null>(null)
  const [fbSending, setFbSending] = useState(false)
  const [fbSuccess, setFbSuccess] = useState(false)
  const [fbError, setFbError]     = useState('')
  const fbFileRef = useRef<HTMLInputElement>(null)

  // shorturl state
  const [suMode, setSuMode]       = useState<SuMode>('current')
  const [suUrl, setSuUrl]         = useState('')
  const [suTitle, setSuTitle]     = useState('')
  const [suExpiry, setSuExpiry]   = useState('')
  const [suMaxUses, setSuMaxUses] = useState('')
  const [suSlug, setSuSlug]       = useState('')
  const [suCreating, setSuCreating] = useState(false)
  const [suError, setSuError]     = useState('')
  const [suResult, setSuResult]   = useState<{ short_url: string; uuid: string } | null>(null)
  const [suCopied, setSuCopied]   = useState(false)

  useEffect(() => {
    fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSession({ logged_in: !!d.logged_in, x_username: d.x_username ?? null, csrf_token: d.csrf_token ?? '' }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeAll() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function closeAll() { setDialOpen(false); setModal(null) }
  function openModal(m: ModalState) { setDialOpen(false); setModal(m) }

  // ── Feedback handlers ──
  function fbHandleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error(t('aw.imgTooBig')); return }
    setFbImage(file)
    const reader = new FileReader()
    reader.onload = ev => setFbImgPrev(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function fbRemoveImage() {
    setFbImage(null); setFbImgPrev(null)
    if (fbFileRef.current) fbFileRef.current.value = ''
  }

  async function fbSubmit() {
    const trimmed = fbContent.trim()
    if (!trimmed) { setFbError(t('aw.fbEmpty')); return }
    if (trimmed.length > 1000) { setFbError(t('aw.fbTooLong')); return }
    setFbSending(true); setFbError('')
    try {
      const fd = new FormData()
      fd.append('type', fbType); fd.append('content', trimmed)
      fd.append('page_url', location.href); fd.append('csrf_token', session.csrf_token)
      if (fbImage) fd.append('image', fbImage)
      const res = await fetch('/app-api/feedback', { method: 'POST', body: fd, credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setFbSuccess(true); setFbContent(''); fbRemoveImage()
        setTimeout(() => { closeAll(); setFbSuccess(false) }, 2200)
      } else {
        setFbError(data.error || t('aw.sendFail'))
      }
    } catch {
      setFbError(t('aw.netErr'))
    } finally {
      setFbSending(false)
    }
  }

  // ── ShortURL handlers ──
  async function suCreate() {
    const url = suMode === 'current' ? location.href : suUrl.trim()
    if (!url) { setSuError(t('aw.urlEmpty')); return }
    setSuCreating(true); setSuError('')
    try {
      const body: Record<string, string> = { original_url: url }
      if (suTitle.trim()) body.title = suTitle.trim()
      if (suExpiry) body.expiry_date = suExpiry
      if (suMaxUses) body.max_uses = suMaxUses
      if (suSlug.trim()) body.custom_slug = suSlug.trim()
      const res = await fetch('/app-api/r-links', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf_token }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        setSuResult({ short_url: data.short_url, uuid: data.uuid })
      } else {
        setSuError(data.error || t('aw.genFail'))
      }
    } catch {
      setSuError(t('aw.netErr'))
    } finally {
      setSuCreating(false)
    }
  }

  function suCopy() {
    if (!suResult) return
    navigator.clipboard?.writeText(suResult.short_url)
    setSuCopied(true)
    setTimeout(() => setSuCopied(false), 2000)
  }

  function suReset() {
    setSuResult(null); setSuError(''); setSuUrl(''); setSuTitle('')
    setSuExpiry(''); setSuMaxUses(''); setSuSlug(''); setSuMode('current')
  }

  const fbPlaceholders: Record<FeedbackType, string> = {
    bug: t('aw.phBug'),
    feature: t('aw.phFeature'),
    other: t('aw.phOther'),
  }

  const anyOpen = dialOpen || modal !== null

  return (
    <>
      <style>{`
        /* ── Speed-dial FAB ── */
        .aw-container {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 900;
          display: flex; flex-direction: column; align-items: flex-end; gap: 0.55rem;
          pointer-events: none; /* 隠れているサブボタンの領域が背後のUI(ページ送り等)のクリックを塞がないように */
        }
        .aw-fab { pointer-events: auto; pointer-events: auto;
          width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1 0%, #38bdf8 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(99,102,241,0.45); transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.2s;
          flex-shrink: 0;
        }
        .aw-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(99,102,241,0.6); }
        .aw-fab:active { transform: scale(0.95); }
        .aw-fab-icon { transition: transform 0.25s cubic-bezier(0.34,1.2,0.64,1); }
        .aw-fab.open .aw-fab-icon { transform: rotate(45deg); }

        .aw-subs { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
        .aw-sub {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.5rem 1rem 0.5rem 0.85rem; border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.09); background: rgba(18,24,38,0.9);
          backdrop-filter: blur(14px) saturate(150%); color: #e2e8f0;
          font-size: 0.84rem; font-weight: 600; cursor: pointer; white-space: nowrap;
          font-family: inherit; box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          opacity: 0; transform: translateY(10px) scale(0.94);
          transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.34,1.5,0.64,1), background 0.15s;
          pointer-events: none;
        }
        .aw-sub.vis { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .aw-sub:hover { background: rgba(28,36,54,0.97); border-color: rgba(255,255,255,0.18); }
        .aw-sub-short.vis { transition-delay: 0.06s; }
        .aw-sub-fb.vis    { transition-delay: 0s; }

        /* ── Backdrop ── */
        .aw-backdrop {
          position: fixed; inset: 0; z-index: 899;
          background: rgba(0,0,0,0.35); backdrop-filter: blur(3px);
          opacity: 0; visibility: hidden; transition: opacity 0.22s, visibility 0s linear 0.22s;
        }
        .aw-backdrop.open { opacity: 1; visibility: visible; transition: opacity 0.22s, visibility 0s; }

        /* ── Shared modal ── */
        .aw-modal {
          position: fixed; z-index: 901; bottom: 5.5rem; right: 1.5rem;
          width: min(400px, calc(100vw - 2rem));
          background: #0f172a; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          overflow: hidden; font-family: inherit;
          transform: translateY(12px) scale(0.97); opacity: 0; visibility: hidden;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .aw-modal.open { transform: translateY(0) scale(1); opacity: 1; visibility: visible; }

        .aw-mhd {
          padding: 1.1rem 1.35rem 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
        }
        .aw-mhd h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #e2e8f0; }
        .aw-mclose {
          background: none; border: none; cursor: pointer; padding: 6px; color: #64748b;
          border-radius: 8px; transition: all 0.15s; display: flex; align-items: center;
        }
        .aw-mclose:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); }
        .aw-mbody { padding: 1.1rem 1.35rem 1.35rem; }
        .aw-input {
          width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; color: #e2e8f0;
          font-size: 0.875rem; padding: 0.55rem 0.875rem; font-family: inherit;
          outline: none; transition: border-color 0.15s; margin-bottom: 0.65rem;
        }
        .aw-input:focus { border-color: rgba(99,102,241,0.5); }
        .aw-input::placeholder { color: #3d4f65; }
        .aw-lbl { display: block; font-size: 0.74rem; color: #4a6080; margin-bottom: 0.25rem; font-weight: 500; }
        .aw-err { color: #f87171; font-size: 0.8rem; margin-bottom: 0.65rem; }
        .aw-submit {
          width: 100%; padding: 0.68rem; border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: #fff; font-size: 0.9rem; font-weight: 700; transition: opacity 0.15s; font-family: inherit;
        }
        .aw-submit:hover { opacity: 0.9; }
        .aw-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Feedback specific ── */
        .fb-types { display: flex; gap: 0.5rem; margin-bottom: 0.9rem; }
        .fb-type-btn {
          flex: 1; padding: 0.5rem 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .fb-type-btn:hover { border-color: rgba(99,102,241,0.4); color: #e2e8f0; }
        .fb-type-btn.act-bug  { border-color: #f43f5e; background: rgba(244,63,94,0.15); color: #fca5a5; }
        .fb-type-btn.act-feat { border-color: #8b5cf6; background: rgba(139,92,246,0.15); color: #c4b5fd; }
        .fb-type-btn.act-oth  { border-color: #38bdf8; background: rgba(56,189,248,0.15); color: #7dd3fc; }
        .fb-textarea {
          width: 100%; box-sizing: border-box; resize: vertical; min-height: 100px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #e2e8f0; font-size: 0.875rem;
          padding: 0.75rem 1rem; font-family: inherit; line-height: 1.6; outline: none;
          transition: border-color 0.2s; margin-bottom: 0.5rem;
        }
        .fb-textarea:focus { border-color: rgba(99,102,241,0.5); }
        .fb-textarea::placeholder { color: #475569; }
        .fb-counter { text-align: right; font-size: 0.72rem; color: #475569; margin-bottom: 0.75rem; }
        .fb-img-area { margin-bottom: 0.75rem; }
        .fb-img-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.85rem; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03); color: #64748b; font-size: 0.8rem;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .fb-img-btn:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
        .fb-img-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
        .fb-img-prev-wrap { position: relative; display: inline-block; margin-top: 0.5rem; }
        .fb-img-prev-wrap img { max-width: 100%; max-height: 140px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: block; }
        .fb-img-remove {
          position: absolute; top: -6px; right: -6px; width: 22px; height: 22px;
          background: #1e293b; border: 1px solid rgba(255,255,255,0.15); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: #94a3b8; font-size: 12px; transition: all 0.15s;
        }
        .fb-img-remove:hover { color: #f87171; }
        .fb-meta { font-size: 0.72rem; color: #475569; margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .fb-notice {
          display: flex; align-items: flex-start; gap: 0.45rem;
          font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.85rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.55rem 0.85rem; line-height: 1.5;
        }
        .fb-notice a { color: #38bdf8; }
        .fb-success {
          display: flex; flex-direction: column; align-items: center;
          padding: 2.5rem 1.35rem; text-align: center; color: #e2e8f0;
        }
        .fb-success svg { color: #34d399; margin-bottom: 0.85rem; }
        .fb-success h4 { margin: 0 0 0.3rem; font-size: 1.05rem; }
        .fb-success p { margin: 0; font-size: 0.85rem; color: #64748b; }

        /* ── ShortURL specific ── */
        .su-tabs { display: flex; gap: 0.4rem; margin-bottom: 0.85rem; }
        .su-tab {
          flex: 1; padding: 0.42rem 0; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          color: #6b7f97; font-size: 0.77rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .su-tab.act { border-color: #38bdf8; background: rgba(56,189,248,0.12); color: #7dd3fc; }
        .su-tab:hover:not(.act) { border-color: rgba(255,255,255,0.15); color: #94a3b8; }
        .su-adv summary {
          cursor: pointer; font-size: 0.74rem; color: #3d5270; user-select: none;
          list-style: none; display: flex; align-items: center; gap: 0.35rem;
          transition: color 0.15s; margin-bottom: 0.65rem;
        }
        .su-adv summary::before { content: '▶'; font-size: 0.6rem; transition: transform 0.15s; }
        .su-adv[open] summary { color: #64748b; }
        .su-adv[open] summary::before { transform: rotate(90deg); }
        .su-adv-bd { padding: 0.65rem 0 0; border-top: 1px solid rgba(255,255,255,0.05); margin-bottom: 0.5rem; }
        .su-login-msg { text-align: center; padding: 1.5rem 0 0.5rem; color: #4a6080; }
        .su-login-msg p { margin-bottom: 1rem; font-size: 0.875rem; line-height: 1.65; }
        .su-login-lnk {
          display: inline-block; padding: 0.5rem 1.35rem; border-radius: 9999px;
          background: linear-gradient(135deg,#6366f1,#38bdf8);
          color: #fff; font-size: 0.85rem; font-weight: 600; text-decoration: none;
        }
        .su-result-row { display: flex; gap: 0.4rem; margin-bottom: 0.65rem; }
        .su-result-inp {
          flex: 1; background: rgba(0,0,0,0.28); border: 1px solid rgba(56,189,248,0.3);
          border-radius: 10px; color: #7dd3fc; font-size: 0.875rem; font-weight: 600;
          padding: 0.55rem 0.875rem; font-family: inherit; outline: none;
        }
        .su-copy-btn {
          padding: 0.55rem 0.9rem; border-radius: 10px; border: none; cursor: pointer;
          background: rgba(56,189,248,0.15); color: #7dd3fc; font-size: 0.8rem;
          font-weight: 600; transition: background 0.15s; font-family: inherit; flex-shrink: 0;
        }
        .su-copy-btn:hover { background: rgba(56,189,248,0.3); }
        .su-result-acts { display: flex; gap: 0.5rem; }
        .su-stats-lnk {
          flex: 1; display: block; text-align: center; padding: 0.48rem; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.09); color: #64748b; font-size: 0.8rem;
          text-decoration: none; transition: all 0.15s; font-weight: 600;
        }
        .su-stats-lnk:hover { border-color: rgba(56,189,248,0.4); color: #7dd3fc; }
        .su-new-btn {
          flex: 1; padding: 0.48rem; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.09);
          background: none; color: #64748b; font-size: 0.8rem;
          font-family: inherit; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .su-new-btn:hover { background: rgba(255,255,255,0.05); color: #94a3b8; }
      `}</style>

      {/* Speed-dial FAB */}
      <div className="aw-container">
        <button className={`aw-fab${modal === 'fb' ? ' open' : ''}`} onClick={() => (modal === 'fb' ? closeAll() : openModal('fb'))} type="button" aria-label={t('aw.feedback')}>
          <svg className="aw-fab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      <div className={`aw-backdrop${anyOpen ? ' open' : ''}`} onClick={closeAll} />

      {/* ── Feedback modal ── */}
      <div className={`aw-modal${modal === 'fb' ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="aw-mhd">
          <h3>{t('aw.fbTitle')}</h3>
          <button className="aw-mclose" onClick={closeAll} aria-label={t('aw.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {fbSuccess ? (
          <div className="fb-success">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            <h4>{t('aw.sent')}</h4>
            <p>{t('aw.thanks')}</p>
          </div>
        ) : (
          <div className="aw-mbody">
            <div className="fb-types">
              {(['bug', 'feature', 'other'] as FeedbackType[]).map(ty => (
                <button key={ty}
                  className={`fb-type-btn${fbType === ty ? ` act-${ty === 'bug' ? 'bug' : ty === 'feature' ? 'feat' : 'oth'}` : ''}`}
                  onClick={() => setFbType(ty)} type="button">
                  {ty === 'bug' ? t('aw.typeBug') : ty === 'feature' ? t('aw.typeFeature') : t('aw.typeOther')}
                </button>
              ))}
            </div>
            <textarea className="fb-textarea" placeholder={fbPlaceholders[fbType]} maxLength={1000}
              value={fbContent} onChange={e => setFbContent(e.target.value)} />
            <div className="fb-counter">{fbContent.length}/1000</div>
            <div className="fb-img-area">
              <input type="file" ref={fbFileRef} accept="image/*" style={{ display: 'none' }} onChange={fbHandleImage} />
              {!fbImgPrev ? (
                <button className="fb-img-btn" onClick={() => fbFileRef.current?.click()} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {t('aw.attach')}
                </button>
              ) : (
                <div className="fb-img-prev-wrap">
                  <img src={fbImgPrev} alt="" />
                  <button className="fb-img-remove" onClick={fbRemoveImage} title={t('aw.remove')}>✕</button>
                </div>
              )}
            </div>
            <div className="fb-meta">
              <span>📄 {location.href.replace(/^https?:\/\//, '').substring(0, 60)}{location.href.length > 75 ? '…' : ''}</span>
              {session.x_username ? <span>{t('aw.loggedAs', { u: session.x_username })}</span> : <span>{t('aw.anon')}</span>}
            </div>
            <div className="fb-notice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{t('aw.noReplyA')} <a href="https://discord.ohatwikeeper.com" target="_blank" rel="noopener">discord.ohatwikeeper.com</a> {t('aw.noReplyB')}</span>
            </div>
            {fbError && <div className="aw-err">{fbError}</div>}
            <button className="aw-submit" disabled={fbSending} onClick={fbSubmit}>
              {fbSending ? t('aw.sending') : t('aw.send')}
            </button>
          </div>
        )}
      </div>

      {/* ── ShortURL modal ── */}
      <div className={`aw-modal${modal === 'su' ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="aw-mhd">
          <h3>{t('aw.suTitle')}</h3>
          <button className="aw-mclose" onClick={closeAll} aria-label={t('aw.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {!session.logged_in ? (
          <div className="aw-mbody">
            <div className="su-login-msg">
              <p>{t('aw.loginReq')}<br /><span style={{ fontSize: '0.78rem', color: '#3d5270' }}>{t('aw.loginNeed')}</span></p>
              <a href="/login?r=r-links" className="su-login-lnk">{t('aw.loginBtn')}</a>
            </div>
          </div>
        ) : suResult ? (
          <div className="aw-mbody">
            <p style={{ fontSize: '0.8rem', color: '#34d399', marginBottom: '0.65rem' }}>{t('aw.suDone')}</p>
            <div className="su-result-row">
              <input className="su-result-inp" type="text" value={suResult.short_url} readOnly onClick={e => (e.target as HTMLInputElement).select()} />
              <button className="su-copy-btn" onClick={suCopy} type="button">
                {suCopied ? t('aw.copied') : t('cp.copy')}
              </button>
            </div>
            <div className="su-result-acts">
              <a href={`/r-links/${suResult.uuid}/`} target="_blank" rel="noopener" className="su-stats-lnk">{t('aw.stats')}</a>
              <button className="su-new-btn" onClick={suReset} type="button">{t('aw.another')}</button>
            </div>
          </div>
        ) : (
          <div className="aw-mbody">
            <div className="su-tabs">
              <button className={`su-tab${suMode === 'current' ? ' act' : ''}`} onClick={() => setSuMode('current')} type="button">{t('aw.tabCurrent')}</button>
              <button className={`su-tab${suMode === 'custom' ? ' act' : ''}`} onClick={() => setSuMode('custom')} type="button">{t('aw.tabCustom')}</button>
            </div>
            {suMode === 'custom' && (
              <input type="url" className="aw-input" placeholder="https://..." value={suUrl} onChange={e => setSuUrl(e.target.value)} />
            )}
            <details className="su-adv">
              <summary>{t('aw.adv')}</summary>
              <div className="su-adv-bd">
                <label className="aw-lbl">{t('aw.lblTitle')}</label>
                <input type="text" className="aw-input" maxLength={255} placeholder={t('aw.phMemo')} value={suTitle} onChange={e => setSuTitle(e.target.value)} />
                <label className="aw-lbl">{t('aw.lblExpiry')}</label>
                <input type="datetime-local" className="aw-input" value={suExpiry} onChange={e => setSuExpiry(e.target.value)} />
                <label className="aw-lbl">{t('aw.lblMax')}</label>
                <input type="number" className="aw-input" min="1" max="1000000" placeholder={t('aw.phUnlimited')} value={suMaxUses} onChange={e => setSuMaxUses(e.target.value)} />
                <label className="aw-lbl">{t('aw.lblSlug')}</label>
                <input type="text" className="aw-input" maxLength={20} placeholder={t('aw.phSlug')} value={suSlug} onChange={e => setSuSlug(e.target.value)} />
              </div>
            </details>
            {suError && <div className="aw-err">{suError}</div>}
            <button className="aw-submit" disabled={suCreating} onClick={suCreate} type="button">
              {suCreating ? t('aw.creating') : t('aw.create')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
