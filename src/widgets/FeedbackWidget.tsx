import { useState, useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

type FeedbackType = 'bug' | 'feature' | 'other'

interface FeedbackWidgetProps {
  username?: string | null
}

export default function FeedbackWidget({ username }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('other')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/session_api.php', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCsrfToken(d.csrf_token || ''))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('5MB以下の画像を選択してください')
      return
    }
    setImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) { setError('フィードバックを入力してください'); return }
    if (trimmed.length > 1000) { setError('1000文字以内で入力してください'); return }

    setSending(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('type', type)
      fd.append('content', trimmed)
      fd.append('page_url', location.href)
      fd.append('csrf_token', csrfToken)
      if (image) fd.append('image', image)

      const res = await fetch('/app-api/feedback', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setContent('')
        removeImage()
        setTimeout(() => { setOpen(false); setSuccess(false) }, 2200)
      } else {
        setError(data.error || '送信に失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  const placeholders: Record<FeedbackType, string> = {
    bug: 'どのような問題が発生しましたか？再現手順があれば教えてください。',
    feature: 'どのような機能があると便利ですか？',
    other: 'ご意見・ご感想など何でもどうぞ。',
  }

  const typeButtons: { type: FeedbackType; label: string; activeClass: string }[] = [
    { type: 'bug', label: '🐛 バグ報告', activeClass: 'active-bug' },
    { type: 'feature', label: '✨ 機能要望', activeClass: 'active-feat' },
    { type: 'other', label: '💬 その他', activeClass: 'active-oth' },
  ]

  return (
    <>
      <style>{`
        .fb-widget-btn {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 900;
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 1.2rem; border-radius: 9999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: #fff; font-size: 0.875rem; font-weight: 600;
          box-shadow: 0 4px 24px rgba(99,102,241,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .fb-widget-btn:hover { transform: scale(1.05); box-shadow: 0 6px 32px rgba(99,102,241,0.6); }
        .fb-widget-btn:active { transform: scale(0.97); }
        .fb-widget-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
        .fb-widget-btn .fb-label { display: none; }
        @media (min-width: 480px) { .fb-widget-btn .fb-label { display: inline; } }

        .fb-backdrop {
          position: fixed; inset: 0; z-index: 901;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
          opacity: 0; visibility: hidden;
          transition: opacity 0.25s, visibility 0s linear 0.25s;
        }
        .fb-backdrop.open { opacity: 1; visibility: visible; transition: opacity 0.25s, visibility 0s; }

        .fb-modal {
          position: fixed; z-index: 902;
          bottom: 5.5rem; right: 1.5rem;
          width: min(400px, calc(100vw - 2rem));
          background: #0f172a; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          overflow: hidden; font-family: inherit;
          transform: translateY(12px) scale(0.97);
          opacity: 0; visibility: hidden;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .fb-modal.open {
          transform: translateY(0) scale(1);
          opacity: 1; visibility: visible;
        }

        .fb-header {
          padding: 1.1rem 1.35rem 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
        }
        .fb-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #e2e8f0; }
        .fb-close {
          background: none; border: none; cursor: pointer; padding: 6px;
          color: #64748b; border-radius: 8px; transition: all 0.15s;
          display: flex; align-items: center;
        }
        .fb-close:hover { color: #e2e8f0; background: rgba(255,255,255,0.07); }
        .fb-body { padding: 1.1rem 1.35rem 1.35rem; }

        .fb-types { display: flex; gap: 0.5rem; margin-bottom: 0.9rem; }
        .fb-type-btn {
          flex: 1; padding: 0.5rem 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .fb-type-btn:hover { border-color: rgba(99,102,241,0.4); color: #e2e8f0; }
        .fb-type-btn.active { border-color: #6366f1; background: rgba(99,102,241,0.15); color: #a5b4fc; }
        .fb-type-btn.active-bug  { border-color: #f43f5e; background: rgba(244,63,94,0.15); color: #fca5a5; }
        .fb-type-btn.active-feat { border-color: #8b5cf6; background: rgba(139,92,246,0.15); color: #c4b5fd; }
        .fb-type-btn.active-oth  { border-color: #38bdf8; background: rgba(56,189,248,0.15); color: #7dd3fc; }

        .fb-textarea {
          width: 100%; box-sizing: border-box; resize: vertical; min-height: 100px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #e2e8f0; font-size: 0.875rem; padding: 0.75rem 1rem;
          font-family: inherit; line-height: 1.6; outline: none; transition: border-color 0.2s;
          margin-bottom: 0.5rem;
        }
        .fb-textarea:focus { border-color: rgba(99,102,241,0.5); }
        .fb-textarea::placeholder { color: #475569; }
        .fb-counter { text-align: right; font-size: 0.72rem; color: #475569; margin-bottom: 0.75rem; }

        .fb-img-area { margin-bottom: 0.75rem; }
        .fb-img-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.85rem; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.03); color: #64748b; font-size: 0.8rem; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .fb-img-btn:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
        .fb-img-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
        .fb-img-preview { position: relative; display: inline-block; margin-top: 0.5rem; }
        .fb-img-preview img { max-width: 100%; max-height: 140px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: block; }
        .fb-img-remove {
          position: absolute; top: -6px; right: -6px; width: 22px; height: 22px;
          background: #1e293b; border: 1px solid rgba(255,255,255,0.15); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: #94a3b8; font-size: 12px; transition: all 0.15s;
        }
        .fb-img-remove:hover { color: #f87171; background: #2d1b2e; }

        .fb-meta {
          font-size: 0.72rem; color: #475569; margin-bottom: 0.85rem;
          display: flex; flex-direction: column; gap: 0.2rem;
        }
        .fb-notice {
          display: flex; align-items: flex-start; gap: 0.45rem;
          font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.85rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.55rem 0.85rem; line-height: 1.5;
        }
        .fb-notice a { color: #38bdf8; }
        .fb-error { color: #f87171; font-size: 0.8rem; margin-bottom: 0.75rem; }
        .fb-submit {
          width: 100%; padding: 0.7rem; border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          color: #fff; font-size: 0.9rem; font-weight: 700;
          transition: all 0.2s; font-family: inherit;
        }
        .fb-submit:hover { opacity: 0.9; transform: translateY(-1px); }
        .fb-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .fb-success {
          display: flex; flex-direction: column; align-items: center;
          padding: 2.5rem 1.35rem; text-align: center; color: #e2e8f0;
        }
        .fb-success svg { color: #34d399; margin-bottom: 0.85rem; }
        .fb-success h4 { margin: 0 0 0.3rem; font-size: 1.05rem; }
        .fb-success p { margin: 0; font-size: 0.85rem; color: #64748b; }
      `}</style>

      <button className="fb-widget-btn" onClick={() => setOpen(true)} aria-label="フィードバックを送る" title="フィードバックを送る">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span className="fb-label">フィードバック</span>
      </button>

      <div className={`fb-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <div className={`fb-modal${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="フィードバック">
        <div className="fb-header">
          <h3>💬 フィードバックを送る</h3>
          <button className="fb-close" onClick={() => setOpen(false)} aria-label="閉じる">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {success ? (
          <div className="fb-success">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            <h4>送信しました！</h4>
            <p>フィードバックありがとうございます。</p>
          </div>
        ) : (
          <div className="fb-body">
            <div className="fb-types">
              {typeButtons.map(b => (
                <button key={b.type}
                  className={`fb-type-btn${type === b.type ? ` active ${b.activeClass}` : ''}`}
                  onClick={() => setType(b.type)}>
                  {b.label}
                </button>
              ))}
            </div>
            <textarea className="fb-textarea" placeholder={placeholders[type]} maxLength={1000}
              value={content} onChange={e => setContent(e.target.value)} />
            <div className="fb-counter">{content.length}/1000</div>
            <div className="fb-img-area">
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {!imagePreview ? (
                <button className="fb-img-btn" onClick={() => fileRef.current?.click()} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  画像を添付（任意）
                </button>
              ) : (
                <div className="fb-img-preview">
                  <img src={imagePreview} alt="" />
                  <button className="fb-img-remove" onClick={removeImage} title="削除">✕</button>
                </div>
              )}
            </div>
            <div className="fb-meta">
              <span>📄 {location.href.replace(/^https?:\/\//, '').substring(0, 60)}{location.href.length > 75 ? '…' : ''}</span>
              {username ? <span>👤 @{username} としてログイン中</span> : <span>匿名で送信されます</span>}
            </div>
            <div className="fb-notice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>フィードバックへの個別の返信は原則行っておりません。返信が必要な場合は <a href="https://discord.ohatwikeeper.com" target="_blank" rel="noopener">discord.ohatwikeeper.com</a> からお問い合わせください。</span>
            </div>
            {error && <div className="fb-error">{error}</div>}
            <button className="fb-submit" disabled={sending} onClick={handleSubmit}>
              {sending ? '送信中...' : '送信する'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
