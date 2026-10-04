import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Languages } from 'lucide-react'
import Tip from '@/components/dashboard-ui/Tip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// shadcn-space/dropdown-menu-11 をベースにした言語選択。選択は i18next と localStorage('lang') に保存される
type Language = { code: string; name: string; native: string; rtl?: boolean }

const LANGUAGES: Language[] = [
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
]

const SPRING = { type: "spring", bounce: 0.25, duration: 0.5 } as const;

const itemClass = "cursor-pointer gap-3 rounded-lg p-2 text-sm";

const LanguageItem = ({
  item,
  index,
}: {
  item: Language;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ ...SPRING, delay: 0.04 + index * 0.045 }}
  >
    <DropdownMenuRadioItem value={item.code} className={itemClass}>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{item.native}</span>
        <span className="truncate text-xs text-muted-foreground">
          {item.name}
        </span>
      </span>
      {item.rtl && (
        <Badge variant="outline" className="mr-5 shrink-0">
          RTL
        </Badge>
      )}
    </DropdownMenuRadioItem>
  </motion.div>
);

export default function LanguageSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = i18n.language.split('-')[0]
  const current = LANGUAGES.find((l) => l.code === selected) ?? LANGUAGES[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {compact ? <Tip label={t('lang.label')}>
      <DropdownMenuTrigger
        render={compact
          ? <button type="button" aria-label={t('lang.label')} data-cuelume-skip className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text" />
          : <Button variant="outline" aria-label={t('lang.label')} className={`h-9 min-w-40 cursor-pointer justify-between gap-3 rounded-full ${className ?? ''}`} />}
      >
        {compact ? <Languages className="size-[18px]" /> : (<>
        <span className="flex items-center gap-2">
          <motion.span animate={{ rotate: open ? 360 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }} className="flex">
            <Languages className="size-4 text-muted-foreground" />
          </motion.span>
          <span className="text-sm font-medium">{current.native}</span>
          <Badge variant="secondary">{current.code.toUpperCase()}</Badge>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
        </>)}
      </DropdownMenuTrigger>
      </Tip> : (
      <DropdownMenuTrigger
        render={compact
          ? <button type="button" aria-label={t('lang.label')} data-cuelume-skip className="flex size-9 items-center justify-center rounded-full text-d-text2 transition-colors duration-200 hover:text-d-text" />
          : <Button variant="outline" aria-label={t('lang.label')} className={`h-9 min-w-40 cursor-pointer justify-between gap-3 rounded-full ${className ?? ''}`} />}
      >
        {compact ? <Languages className="size-[18px]" /> : (<>
        <span className="flex items-center gap-2">
          <motion.span animate={{ rotate: open ? 360 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }} className="flex">
            <Languages className="size-4 text-muted-foreground" />
          </motion.span>
          <span className="text-sm font-medium">{current.native}</span>
          <Badge variant="secondary">{current.code.toUpperCase()}</Badge>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
        </>)}
      </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2">
        <DropdownMenuRadioGroup value={selected} onValueChange={(v) => { void i18n.changeLanguage(v) }}>
          {LANGUAGES.map((l, i) => (
            <LanguageItem key={l.code} item={l} index={i} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
