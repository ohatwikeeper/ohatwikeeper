import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

// チェックボックスの一覧と「すべてオン/オフ」。共有ページの項目と APIキーの権限で使う
export default function FieldPicker({ groups, value, onChange, label }: {
  groups: { title?: string; ids: string[] }[]
  value: string[]
  onChange: (v: string[]) => void
  label: (id: string) => string
}) {
  const { t } = useTranslation()
  const all = groups.flatMap((g) => g.ids)
  const set = new Set(value)
  const toggle = (id: string, on: boolean) => onChange(all.filter((x) => (x === id ? on : set.has(x))))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-d-text3">{t('rs.on', { n: all.filter((x) => set.has(x)).length })} / {all.length}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(all)} disabled={value.length === all.length}>{t('rs.allOn')}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} disabled={!value.length}>{t('rs.allOff')}</Button>
        </div>
      </div>
      {groups.map((g, i) => (
        <fieldset key={g.title ?? i} className="flex flex-col gap-2">
          {g.title && <legend className="mb-2 text-xs font-medium text-d-text3">{g.title}</legend>}
          <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {g.ids.map((id) => <Checkbox key={id} label={label(id)} checked={set.has(id)} onCheckedChange={(v) => toggle(id, !!v)} />)}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
