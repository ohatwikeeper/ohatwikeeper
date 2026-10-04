import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/** shadcn data-table (tanstack): 列ヘッダーでソート、「列」メニューで表示切替 */
export default function DataTable<T>({ columns, data, className = 'max-h-[28rem]' }: { columns: ColumnDef<T, any>[]; data: T[]; className?: string }) {
  const { t: tr } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const [visibility, setVisibility] = useState<VisibilityState>({})
  const table = useReactTable({
    data, columns, state: { sorting, columnVisibility: visibility },
    onSortingChange: setSorting, onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })
  return (
    <div>
      <div className="flex justify-end px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="cursor-pointer" />}>
            <Columns3 className="size-4" />{tr('cm.cols')}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dash-scope !min-h-0">
            {table.getAllColumns().filter(c => c.getCanHide()).map(c => (
              <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>
                {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={`${className} overflow-y-auto border-t border-d-border`}>
        <Table>
          <TableHeader className="bg-d-med sticky top-0">
            {table.getHeaderGroups().map(g => (
              <TableRow key={g.id}>
                {g.headers.map(h => {
                  const dir = h.column.getIsSorted()
                  const right = (h.column.columnDef.meta as any)?.align === 'right'
                  return (
                    <TableHead key={h.id} className={right ? 'text-right' : ''}>
                      <button type="button" onClick={h.column.getToggleSortingHandler()} className={`inline-flex cursor-pointer items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {dir === 'asc' ? <ArrowUp className="size-3.5" /> : dir === 'desc' ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(r => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map(c => (
                  <TableCell key={c.id} className={`tabular-nums ${(c.column.columnDef.meta as any)?.align === 'right' ? 'text-right' : ''}`}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
