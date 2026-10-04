import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Search, SearchX } from 'lucide-react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

// 検索の空状態。initial=検索前の案内、none=該当なし(綴り・条件の見直しを促す)
export default function SearchEmpty({ kind, title, children }: { kind: 'initial' | 'none'; title?: string; children?: ReactNode }) {
  const { t: tr } = useTranslation()
  const none = kind === 'none'
  return (
    <Empty className="border border-dashed border-d-border py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">{none ? <SearchX /> : <Search />}</EmptyMedia>
        <EmptyTitle>{title ?? (none ? tr('cm.se.none') : tr('cm.se.init'))}</EmptyTitle>
        <EmptyDescription>
          {none ? tr('cm.se.noneDesc') : tr('cm.se.initDesc')}
        </EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}
