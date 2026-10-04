import { useTranslation } from 'react-i18next'
import { type ReactNode, useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

// ページ移動でレイアウトが作り直されても開閉状態を保つ(スマホで項目を押すたびに閉じるのを防ぐ)
let lastOpen: string[] = []

/** リンク集用の折りたたみ(shadcn Accordion)。lg未満はカード型のトリガーで開閉、lg以上は常に展開 */
export default function MobileMenu({ label, children }: { label?: string; children: ReactNode }) {
  const { t: tr } = useTranslation()
  // PC幅(lg以上)は常に展開。狭い画面のみ開閉する
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  const [open, setOpen] = useState<string[]>(lastOpen)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return (
    <Accordion className="lg:contents" value={wide ? ['links'] : open} onValueChange={(v) => { lastOpen = v as string[]; setOpen(lastOpen) }}>
      <AccordionItem id="site-links-box" value="links" className="overflow-hidden rounded-2xl border border-d-border bg-d-med/50 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
        <AccordionTrigger className="px-4 py-3.5 text-sm text-d-text lg:hidden">
          <span className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-d-accent/15 text-d-accent"><Compass className="size-4" /></span>
            {label ?? tr('cm.pageList')}
          </span>
        </AccordionTrigger>
        <AccordionContent keepMounted className="px-3 pb-3 text-d-text lg:p-0">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
