import SetupBanner from '@/features/onboard/SetupBanner'
import { SetupLock } from '@/features/onboard/OnboardGate'
import { useTranslation } from 'react-i18next'
import { Children, createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PanelLeft } from 'lucide-react'
import { motion } from 'motion/react'
import Breadcrumbs from './Breadcrumbs'
import { ScrollArea } from '@/components/arc/scroll-area/scroll-area'
import { TooltipProvider } from '@/components/ui/tooltip'

const SlotCtx = createContext<((n: ReactNode) => void) | null>(null)

/**
 * サイドメニューのある全ページ共通の外枠。サイドバーの枠・スクロール領域はページ間移動でも作り直さず、
 * 各レイアウトが SidebarSlot でサイドバーの中身だけを差し込む(リロード感なし)。
 */
export default function AppShell() {
  const { t: tr } = useTranslation()
  const { pathname, hash } = useLocation()
  const [side, setSide] = useState<ReactNode>(null)
  // ページ移動で新しく現れる項目は、先にスケルトンを出して少し後に中身へ置き換える(レイアウトがガクつかないように)
  // サイドメニューの開閉(PC幅のみ)。選択は端末に保存
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('ohax_side_open') !== '0' } catch { return true } })
  const toggle = () => setOpen((o) => { try { localStorage.setItem('ohax_side_open', o ? '0' : '1') } catch { /* 保存不可は無視 */ } return !o })
  const [wide, setWide] = useState(() => matchMedia('(min-width: 1024px)').matches)
  useEffect(() => { const m = matchMedia('(min-width: 1024px)'); const f = () => setWide(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  const mainRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  // ページ移動時は右側(モバイルは全体)のスクロールを先頭に戻す
  useEffect(() => {
    if (hash) return
    mainRef.current?.scrollTo(0, 0)
    shellRef.current?.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <TooltipProvider>
      <div ref={shellRef} className="dash-scope dash-shell max-lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-8 max-[640px]:px-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <div className="relative grid min-h-0 grid-cols-[var(--side-w)_minmax(0,1fr)] gap-x-[var(--side-gap)] transition-[grid-template-columns,column-gap] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-lg:grid-cols-1 lg:flex-1"
            style={{ '--side-w': open ? '320px' : '0px', '--side-gap': open ? '48px' : '0px' } as React.CSSProperties}>
            <aside className={`min-h-0 min-w-0 overflow-hidden transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? '' : 'lg:pointer-events-none lg:-translate-x-6 lg:opacity-0'}`} inert={(!open && wide) || undefined}>
              <ScrollArea fade={0} className="h-full lg:w-[320px]" viewportClassName="pt-6 pb-8 lg:pr-4">
                <div className="flex flex-col gap-8">
                  {Children.toArray(side).map((c) => (
                    // 上のブロックの高さが変わっても、下のブロックが跳ばずに滑って追従する
                    <motion.div key={String((c as { key?: string }).key)} className="empty:hidden" layout="position" transition={{ duration: 0.25, ease: 'easeOut' }}>{c}</motion.div>
                  ))}
                </div>
              </ScrollArea>
            </aside>
            <main className="relative flex min-h-0 min-w-0 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-d-border/60 lg:pr-3">
            <button type="button" onClick={toggle} aria-label={open ? tr('cn.sideClose') : tr('cn.sideOpen')} aria-expanded={open}
              className="hidden size-8 place-items-center rounded-md text-d-text2 transition-colors hover:bg-d-light hover:text-d-text lg:grid">
              <PanelLeft className="size-4" />
            </button>
            <span className="hidden h-5 w-px bg-d-border lg:block" />
            <Breadcrumbs />
          </div>
              <ScrollArea fade={0} className="min-h-0 flex-1" viewportClassName="pb-8 lg:pr-3" viewportRef={mainRef}>
                <SlotCtx.Provider value={setSide}>
                  <SetupBanner />
                  <Outlet />
                </SlotCtx.Provider>
              </ScrollArea>
            <SetupLock />
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/** サイドバーの中身を AppShell の常設枠へ渡す。key が同じ要素は作り直さず、増減した要素だけフェードする */
export function SidebarSlot({ children }: { children: ReactNode }) {
  const set = useContext(SlotCtx)
  useLayoutEffect(() => { set?.(children) })
  return null
}
