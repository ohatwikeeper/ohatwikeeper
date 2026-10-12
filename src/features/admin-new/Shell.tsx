import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, ExternalLink, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import LoginRequired from '@/components/dashboard-ui/LoginRequired'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ALL_ITEMS, NAV } from './nav'

type Access = 'checking' | 'ok' | 'login' | 'forbidden'

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <nav className="flex flex-col gap-5">
      {NAV.map((g) => (
        <div key={g.group}>
          {!collapsed && <p className="mb-1.5 px-2.5 text-xs font-medium text-d-text3">{g.group}</p>}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((n) => {
              const active = pathname === n.to
              return (
                <li key={n.to}>
                  <Link to={n.legacy ? n.legacy : n.to} onClick={onNavigate} title={n.label} aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${active ? 'bg-d-accent/15 !text-d-text' : '!text-d-text2 hover:bg-d-med/70'}`}>
                    <n.icon className={`size-4 shrink-0 ${active ? 'text-d-accent' : ''}`} />
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

  if (access === 'checking') return <div className="dash-scope min-h-screen" />
  if (access === 'login') return <div className="dash-scope min-h-screen bg-d-bg text-d-text"><LoginRequired message="管理画面を表示するにはログインが必要です。" /></div>
  if (access !== 'ok') {
    return (
      <div className="dash-scope min-h-screen bg-d-bg text-d-text"><div className="mx-auto max-w-md px-5 py-28 text-center">
        <div className="text-6xl font-extrabold text-d-text3">403</div>
        <p className="mt-4 text-d-text2">このページを表示する権限がありません。</p>
        <Link to="/" className="mt-6 inline-block text-sm text-d-text2 hover:text-d-text">トップへ戻る</Link>
      </div></div>
    )
  }
  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-d-border bg-d-bg py-4 transition-[width] lg:flex ${collapsed ? 'w-16 px-2' : 'w-60 px-3'}`}>
        <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!collapsed && <Link to="/admin-new" className="text-sm font-bold !text-d-text">おはツイKeeper 管理</Link>}
          <Button variant="ghost" size="icon-sm" aria-label="サイドバーの開閉" onClick={toggle}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto"><NavList collapsed={collapsed} /></div>
        {!collapsed && <Link to="/admin" className="mt-3 px-2.5 text-xs !text-d-text3">旧管理画面へ</Link>}
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 overflow-y-auto p-4">
          <SheetTitle className="mb-4 text-sm">管理メニュー</SheetTitle>
          <NavList onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
      <div className={`transition-[padding] ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-d-border bg-d-bg/85 px-4 backdrop-blur">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="メニュー" onClick={() => setMobile(true)}><Menu /></Button>
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-d-text2">
            {group && <><span className="hidden sm:inline">{group}</span><ChevronRight className="hidden size-3.5 sm:inline" /></>}
            <span className="truncate font-semibold text-d-text">{title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <Button variant="outline" size="sm" onClick={() => setPalette(true)} className="!text-d-text2">
              <Search className="size-3.5" /><span className="hidden sm:inline">検索・移動</span><kbd className="hidden rounded border border-d-border px-1 text-[10px] sm:inline">⌘K</kbd>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">{children}</main>
      </div>
      <Palette open={palette} setOpen={setPalette} />
    </div>
  )
}
