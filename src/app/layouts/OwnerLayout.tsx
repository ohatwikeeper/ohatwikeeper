import { ScrollArea } from '@/components/arc/scroll-area/scroll-area'
import SiteFooter from '@/components/dashboard-ui/SiteFooter'
import { Outlet, useLocation } from 'react-router-dom'
import SiteLinks, { OWNER_LINKS } from '@/components/dashboard-ui/SiteLinks'

// マイページ系(フォルダ/リキャップ/通知/設定など)共通: 左サイドバー固定・右側のみページ切替
export default function OwnerLayout() {
  const { pathname } = useLocation()
  const activeTo = OWNER_LINKS.find((l) => pathname === l.to || pathname.startsWith(`${l.to}/`) || pathname.startsWith(`${l.to}_`) || pathname.startsWith(`${l.to}.`))?.to
  return (
    <div className="dash-scope dash-shell max-lg:overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-8 max-[640px]:px-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className="grid min-h-0 grid-cols-[320px_minmax(0,1fr)] gap-12 max-lg:grid-cols-1 lg:flex-1">
          <aside className="min-h-0">
            <ScrollArea fade={0} className="h-full" viewportClassName="flex flex-col gap-8 pt-6 pb-8 lg:pr-4">
            <SiteLinks activeTo={activeTo} />
            <SiteFooter />
                      </ScrollArea>
          </aside>
          <main className="min-w-0 pb-8 lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
