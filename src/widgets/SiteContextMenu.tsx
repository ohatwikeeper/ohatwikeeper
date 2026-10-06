import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ArrowUpToLine, ArrowDownToLine, Command, Copy, Check, Download, Eye, Trash2, ExternalLink, FileText, Image as ImageIcon, Link2, RotateCw, Search, Share2, Table2, TableProperties, TextCursorInput, Columns3, Send } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { toast } from '@/lib/toast'

// サイト全体の右クリックメニュー。クリック位置の要素で内容を切り替える(リンク/画像/表のセル・行/選択テキスト/それ以外)。
// 入力欄・編集可能領域・Shift+右クリックはブラウザ標準のメニューを残す。専用の対象は data-ctx-native を付けると標準メニューにできる。
type Ctx =
  | { kind: 'page' }
  | { kind: 'text'; text: string }
  | { kind: 'link'; href: string; text: string }
  | { kind: 'image'; src: string }
  | { kind: 'record'; id: string; url: string; detail: string; sel: number }
  | { kind: 'cell'; cell: string; row: string; col: string; table: string }

const NATIVE = 'input,textarea,select,[contenteditable=""],[contenteditable="true"],[data-ctx-native]'

function detect(t: Element): Ctx {
  const sel = window.getSelection()?.toString().trim()
  if (sel) return { kind: 'text', text: sel }
  const a = t.closest<HTMLAnchorElement>('a[href]')
  if (a) return { kind: 'link', href: a.href, text: a.textContent?.trim() ?? '' }
  const img = t.closest<HTMLImageElement>('img[src]')
  if (img) return { kind: 'image', src: img.currentSrc || img.src }
  const rec = t.closest<HTMLElement>('[data-ctx-record]')
  if (rec) return { kind: 'record', id: rec.dataset.ctxRecord!, url: rec.dataset.ctxUrl ?? '', detail: rec.dataset.ctxDetail ?? '', sel: Number(document.querySelector<HTMLElement>('[data-ctx-sel]')?.dataset.ctxSel ?? 0) }
  const cell = t.closest<HTMLElement>('td,th')
  const row = t.closest<HTMLTableRowElement>('tr')
  if (cell && row) {
    const table = t.closest('table')
    const rows = table ? Array.from(table.rows) : [row]
    const idx = (cell as HTMLTableCellElement).cellIndex
    const txt = (c: Element) => (c as HTMLElement).innerText.trim()
    return {
      kind: 'cell', cell: txt(cell),
      row: Array.from(row.cells).map(txt).join('\t'),
      col: rows.map((r) => r.cells[idx]).filter(Boolean).map(txt).join('\n'),
      table: rows.map((r) => Array.from(r.cells).map(txt).join('\t')).join('\n'),
    }
  }
  return { kind: 'page' }
}

export default function SiteContextMenu({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [ctx, setCtx] = useState<Ctx>({ kind: 'page' })

  const copy = async (s: string, msg: string) => {
    try { await navigator.clipboard.writeText(s); toast.success(msg) } catch { toast.error(t('ctx.copyFail', 'コピーできませんでした')) }
  }
  const imgBlob = async (src: string) => (await fetch(src)).blob()
  const saveImg = async (src: string) => {
    try {
      const url = URL.createObjectURL(await imgBlob(src))
      const a = document.createElement('a'); a.href = url; a.download = src.split('?')[0].split('/').pop() || 'image'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { window.open(src, '_blank', 'noopener,noreferrer') }
  }
  const copyImg = async (src: string) => {
    try {
      const bmp = await createImageBitmap(await imgBlob(src))
      const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height
      cv.getContext('2d')!.drawImage(bmp, 0, 0)
      const png = await new Promise<Blob>((ok, ng) => cv.toBlob((b) => (b ? ok(b) : ng()), 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      toast.success(t('ctx.copiedImgOk', '画像をコピーしました'))
    } catch { toast.error(t('ctx.copyFail', 'コピーできませんでした')) }
  }
  const palette = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
  const open = (u: string) => window.open(u, '_blank', 'noopener,noreferrer')
  const nav = (window as unknown as { navigation?: { canGoBack: boolean; canGoForward: boolean } }).navigation
  const canBack = nav ? nav.canGoBack : history.length > 1
  const canFwd = nav ? nav.canGoForward : true
  const Item = ({ icon: I, label, onSelect, disabled }: { icon: typeof Copy; label: string; onSelect: () => void; disabled?: boolean }) => (
    <ContextMenuItem onClick={onSelect} disabled={disabled}><I />{label}</ContextMenuItem>
  )
  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="contents select-text"
        onContextMenuCapture={(e) => {
          const el = e.target instanceof Element ? e.target : null
          if (!el || e.shiftKey || el.closest(NATIVE)) { e.stopPropagation(); return }
          setCtx(detect(el))
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-52">
        {ctx.kind === 'text' && (
          <ContextMenuGroup>
            <Item icon={Copy} label={t('ctx.copySel', '選択範囲をコピー')} onSelect={() => copy(ctx.text, t('ctx.copied', 'コピーしました'))} />
            <Item icon={Search} label={t('ctx.search', '「{{s}}」を検索', { s: ctx.text.slice(0, 16) })} onSelect={() => open(`https://www.google.com/search?q=${encodeURIComponent(ctx.text)}`)} />
            <Item icon={Send} label={t('ctx.postX', '選択範囲をXに投稿')} onSelect={() => open(`https://x.com/intent/post?text=${encodeURIComponent(ctx.text)}`)} />
            <ContextMenuSeparator />
          </ContextMenuGroup>
        )}
        {ctx.kind === 'link' && (
          <ContextMenuGroup>
            <Item icon={ExternalLink} label={t('ctx.openLink', 'リンクを開く')} onSelect={() => location.assign(ctx.href)} />
            <Item icon={ExternalLink} label={t('ctx.openTab', '新しいタブで開く')} onSelect={() => open(ctx.href)} />
            <Item icon={Link2} label={t('ctx.copyLink', 'リンクをコピー')} onSelect={() => copy(ctx.href, t('ctx.copiedLink', 'リンクをコピーしました'))} />
            {ctx.text && <Item icon={FileText} label={t('ctx.copyMd', 'Markdownリンクとしてコピー')} onSelect={() => copy(`[${ctx.text}](${ctx.href})`, t('ctx.copied', 'コピーしました'))} />}
            {ctx.text && <Item icon={TextCursorInput} label={t('ctx.copyLabel', 'リンクの文字をコピー')} onSelect={() => copy(ctx.text, t('ctx.copied', 'コピーしました'))} />}
            <ContextMenuSeparator />
          </ContextMenuGroup>
        )}
        {ctx.kind === 'image' && (
          <ContextMenuGroup>
            <Item icon={ImageIcon} label={t('ctx.openImg', '画像を新しいタブで開く')} onSelect={() => open(ctx.src)} />
            <Item icon={Download} label={t('ctx.saveImg', '画像を保存')} onSelect={() => saveImg(ctx.src)} />
            <Item icon={Copy} label={t('ctx.copyImgData', '画像をコピー')} onSelect={() => copyImg(ctx.src)} />
            <Item icon={Link2} label={t('ctx.copyImg', '画像のURLをコピー')} onSelect={() => copy(ctx.src, t('ctx.copiedUrl', 'URLをコピーしました'))} />
            <ContextMenuSeparator />
          </ContextMenuGroup>
        )}
        {ctx.kind === 'record' && (
          <ContextMenuGroup>
            {typeof document !== 'undefined' && document.querySelector('[data-ctx-bulk]') && <Item icon={Check} label={t('ctx.recSel', 'この行を選択 / 解除')} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'toggle', id: ctx.id } }))} />}
            {ctx.sel > 0 && <Item icon={Table2} label={t('ctx.recCsv', '選択した{{n}}件をCSVでコピー', { n: ctx.sel })} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'bulk-csv', id: ctx.id } }))} />}
            {ctx.sel > 0 && <Item icon={Link2} label={t('ctx.recUrls', '選択した{{n}}件のURLをコピー', { n: ctx.sel })} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'bulk-url', id: ctx.id } }))} />}
            {ctx.sel > 0 && <Item icon={Trash2} label={t('ctx.recDelSel', '選択した{{n}}件を削除', { n: ctx.sel })} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'bulk-delete', id: ctx.id } }))} />}
            <Item icon={Eye} label={t('ctx.recDetail', 'ツイートの詳細を見る')} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'tweet', id: ctx.id } }))} />
            {ctx.detail && <Item icon={ExternalLink} label={t('ctx.recDetailPage', '詳細ページを開く')} onSelect={() => open(`/details/${ctx.detail}`)} />}
            {ctx.url && <Item icon={ExternalLink} label={t('ctx.recOrig', '元のツイートを開く')} onSelect={() => open(ctx.url)} />}
            {ctx.url && <Item icon={Link2} label={t('ctx.recCopy', 'ツイートURLをコピー')} onSelect={() => copy(ctx.url, t('ctx.copiedUrl', 'URLをコピーしました'))} />}
            <Item icon={Trash2} label={t('ctx.recDelete', 'このおはツイを削除')} onSelect={() => document.dispatchEvent(new CustomEvent('ctx-record', { detail: { action: 'delete', id: ctx.id } }))} />
            <ContextMenuSeparator />
          </ContextMenuGroup>
        )}
        {ctx.kind === 'cell' && (
          <ContextMenuGroup>
            <Item icon={TextCursorInput} label={t('ctx.copyCell', 'セルをコピー')} onSelect={() => copy(ctx.cell, t('ctx.copied', 'コピーしました'))} />
            <Item icon={TableProperties} label={t('ctx.copyRow', '行をコピー(タブ区切り)')} onSelect={() => copy(ctx.row, t('ctx.copiedRow', '行をコピーしました'))} />
            <Item icon={Columns3} label={t('ctx.copyCol', '列をコピー')} onSelect={() => copy(ctx.col, t('ctx.copiedCol', '列をコピーしました'))} />
            <Item icon={Table2} label={t('ctx.copyTable', '表全体をコピー(Excel・スプレッドシート向け)')} onSelect={() => copy(ctx.table, t('ctx.copiedTable', '表をコピーしました'))} />
            <ContextMenuSeparator />
          </ContextMenuGroup>
        )}
        <ContextMenuGroup>
          <Item icon={ArrowLeft} label={t('ctx.back', '戻る')} disabled={!canBack} onSelect={() => history.back()} />
          <Item icon={ArrowRight} label={t('ctx.forward', '進む')} disabled={!canFwd} onSelect={() => history.forward()} />
          <Item icon={RotateCw} label={t('ctx.reload', '再読み込み')} onSelect={() => location.reload()} />
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <Item icon={Command} label={t('ctx.palette', 'コマンドパレットを開く')} onSelect={palette} />
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <Item icon={Link2} label={t('ctx.copyUrl', 'このページのURLをコピー')} onSelect={() => copy(location.href, t('ctx.copiedUrl', 'URLをコピーしました'))} />
          {typeof navigator.share === 'function' && <Item icon={Share2} label={t('ctx.share', 'このページを共有')} onSelect={() => navigator.share({ title: document.title, url: location.href }).catch(() => {})} />}
          <Item icon={ArrowUpToLine} label={t('ctx.top', 'ページの先頭へ')} onSelect={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <Item icon={ArrowDownToLine} label={t('ctx.bottom', 'ページの末尾へ')} onSelect={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} />
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
