import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, ExternalLink, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import LoginRequired from '@/components/dashboard-ui/LoginRequired'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ALL_ITEMS, NAV } from './nav'
import { Kbd } from './ui'

type Access = 'checking' | 'ok' | 'login' | 'forbidden'

const isActive = (pathname: string, to: string) => pathname === to

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <nav aria-label="管理メニュー" className="flex flex-col gap-6">
      {NAV.map((g) => (
        <div key={g.group}>
          {!collapsed
            ? <p className="mb-1.5 px-3 text-[11px] text-d-text3">{g.group}</p>
            : <div className="mx-3 mb-2 h-px bg-d-border" />}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((n) => {
              const active = isActive(pathname, n.to)
              return (
                <li key={n.to}>
                  <Link to={n.legacy ? n.legacy : n.to} onClick={onNavigate} title={n.label} aria-current={active ? 'page' : undefined}
                    className={`an-press group relative flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] ${collapsed ? 'justify-center px-0' : ''} ${active ? 'bg-d-light !text-d-text' : '!text-d-text2 hover:bg-d-light/60 hover:!text-d-text'}`}>
                    {active && <span aria-hidden className="absolute top-2 bottom-2 -left-2 w-0.5 rounded-full bg-d-accent" />}
                    <n.icon className={`size-4 shrink-0 transition-colors ${active ? 'text-d-accent' : 'text-d-text3 group-hover:text-d-text2'}`} strokeWidth={1.75} />
                    {!collapsed && <span className="truncate">{n.label}</span>}
                    {!collapsed && n.legacy && <ExternalLink className="ml-auto size-3 text-d-text3" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Palette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const isId = /^req_[0-9a-f]{8,}$/i.test(q.trim())
  const go = (to: string) => { setOpen(false); setQ(''); nav(to) }
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="画面を検索、またはリクエストID(req_…)・ユーザー名を入力" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>該当なし</CommandEmpty>
        {q.trim() && (
          <CommandGroup heading="検索">
            {isId
              ? (<>
                <CommandItem value={`reqid-logs ${q}`} onSelect={() => go(`/admin-new/data/api-logs?q=${encodeURIComponent(q.trim())}`)}>APIログでリクエストIDを検索</CommandItem>
                <CommandItem value={`reqid-err ${q}`} onSelect={() => go(`/admin-new/data/api-errors?q=${encodeURIComponent(q.trim())}`)}>APIエラーログでリクエストIDを検索</CommandItem>
              </>)
              : <CommandItem value={`user ${q}`} onSelect={() => go(`/admin-new/data/users?q=${encodeURIComponent(q.trim())}`)}>ユーザーを「{q.trim()}」で検索</CommandItem>}
          </CommandGroup>
        )}
        <CommandGroup heading="画面">
          {ALL_ITEMS.map((i) => (
            <CommandItem key={i.to} value={`${i.label} ${i.group} ${i.keywords ?? ''}`} onSelect={() => go(i.legacy ?? i.to)}>
              <i.icon />{i.label}<span className="ml-auto text-xs text-d-text3">{i.group}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/admin-new" aria-label="ダッシュボードへ" className="flex min-w-0 items-center gap-2.5 !text-d-text">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-lg bg-d-accent text-[13px] font-medium text-d-accent-fg">お</span>
      {!collapsed && <span className="truncate text-sm font-medium">おはツイKeeper<span className="ml-1.5 text-xs text-d-text3">管理</span></span>}
    </Link>
  )
}

/** /admin-new 共通シェル。管理者(サーバー側判定)以外には中身を出さない */
export default function Shell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { pathname } = useLocation()
  const [access, setAccess] = useState<Access>('checking')
  const [mobile, setMobile] = useState(false)
  const [palette, setPalette] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin-new:collapsed') === '1')
  const group = ALL_ITEMS.find((i) => i.to === pathname)?.group

  useEffect(() => { document.title = `${title} - 管理(新) - おはツイKeeper` }, [title])
  useEffect(() => {
    fetch('/app-api/maintenance', { credentials: 'include', cache: 'no-store' }).then((r) => r.json())
      .then((d) => setAccess(d.is_admin ? 'ok' : d.error ? 'login' : 'forbidden')).catch(() => setAccess('forbidden'))
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const toggle = () => setCollapsed((v) => { localStorage.setItem('admin-new:collapsed', v ? '0' : '1'); return !v })

  if (access === 'checking') return <div className="dash-scope min-h-screen bg-d-bg" />
  if (access === 'login') return <div className="dash-scope min-h-screen bg-d-bg text-d-text"><LoginRequired message="管理画面を表示するにはログインが必要です。" /></div>
  if (access !== 'ok') {
    return (
      <div className="dash-scope min-h-screen bg-d-bg text-d-text"><div className="mx-auto max-w-md px-5 py-28 text-center">
        <div className="text-6xl font-medium tabular-nums text-d-text3">403</div>
        <p className="mt-4 text-d-text2">このページを表示する権限がありません。</p>
        <Link to="/" className="mt-6 inline-block text-sm text-d-text2 hover:text-d-text">トップへ戻る</Link>
      </div></div>
    )
  }
  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text antialiased">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-d-med/60 py-4 shadow-[1px_0_0_rgb(255_255_255/.06)] backdrop-blur transition-[width] duration-200 lg:flex ${collapsed ? 'w-16 px-2' : 'w-64 px-3'}`}>
        <div className={`mb-4 flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between px-1'}`}>
          <Brand collapsed={collapsed} />
          <Button variant="ghost" size="icon-sm" aria-label="サイドバーの開閉" onClick={toggle}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
        </div>
        <button type="button" onClick={() => setPalette(true)} aria-label="検索・移動"
          className={`an-press mb-5 flex h-9 items-center gap-2 rounded-lg bg-d-light/60 text-xs text-d-text3 shadow-[inset_0_0_0_1px_rgb(255_255_255/.06)] hover:bg-d-light hover:text-d-text2 ${collapsed ? 'justify-center' : 'px-3'}`}>
          <Search className="size-3.5" />{!collapsed && <><span>検索・移動</span><span className="ml-auto"><Kbd>⌘K</Kbd></span></>}
        </button>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-2"><NavList collapsed={collapsed} /></div>
        {!collapsed && <Link to="/admin" className="mt-3 flex items-center gap-1.5 px-3 text-xs !text-d-text3 hover:!text-d-text2">旧管理画面へ<ExternalLink className="size-3" /></Link>}
      </aside>

      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="mb-5"><Brand /></SheetTitle>
          <NavList onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 bg-d-bg/80 px-4 shadow-[0_1px_0_rgb(255_255_255/.05)] backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="メニュー" onClick={() => setMobile(true)}><Menu /></Button>
          <nav aria-label="パンくず" className="flex min-w-0 items-center gap-1.5 text-xs text-d-text3">
            <Link to="/admin-new" className="hidden !text-d-text3 hover:!text-d-text2 sm:inline">管理</Link>
            {group && <><ChevronRight className="hidden size-3 sm:inline" /><span className="hidden sm:inline">{group}</span></>}
            <ChevronRight className="hidden size-3 sm:inline" /><span className="truncate text-d-text2">{title}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="検索・移動" onClick={() => setPalette(true)}><Search /></Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
      <Palette open={palette} setOpen={setPalette} />
    </div>
  )
}
