import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, PlusCircle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface FacetOption { value: string; label: string; count?: number }
export interface Facet { key: string; label: string; options: FacetOption[]; value: string; defaultValue?: string; onChange: (v: string) => void }

/** ファセット絞り込みバー: 項目ボタン(ポップオーバー) + 有効な条件トークン + 件数 + 全解除 */
export default function FacetedFilterBar({ facets, shown, total }: { facets: Facet[]; shown?: number; total?: number }) {
  const { t: tr } = useTranslation()
  const active = facets.filter(f => f.value !== (f.defaultValue ?? 'all'))
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {facets.map(f => {
          const cur = f.options.find(o => o.value === f.value)
          const on = active.includes(f)
          return (
            <Popover key={f.key}>
              <PopoverTrigger render={<Button variant="outline" size="sm" className="border-dashed cursor-pointer" />}>
                <PlusCircle className="size-4" />{f.label}
                {on && <Badge variant="secondary" className="ml-1">{cur?.label}</Badge>}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1">
                {f.options.map(o => (
                  <button key={o.value} type="button" onClick={() => f.onChange(o.value)}
                    className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm">
                    <Check className={`size-4 ${o.value === f.value ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="flex-1">{o.label}</span>
                    {o.count !== undefined && <span className="text-muted-foreground text-xs tabular-nums">{o.count}</span>}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )
        })}
        {active.length > 0 && (
          <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => active.forEach(f => f.onChange(f.defaultValue ?? 'all'))}>
            {tr('cn.reset')}<X className="size-4" />
          </Button>
        )}
        {shown !== undefined && total !== undefined && (
          <span className="text-d-text3 ml-auto text-xs tabular-nums">{tr('cn.count', { shown: shown.toLocaleString(), total: total.toLocaleString() })}</span>
        )}
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {active.map(f => (
            <Badge key={f.key} variant="secondary" className="gap-1">
              {f.label}: {f.options.find(o => o.value === f.value)?.label}
              <button type="button" aria-label={tr('cn.removeF', { label: f.label })} className="cursor-pointer" onClick={() => f.onChange(f.defaultValue ?? 'all')}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
