import { useTranslation } from 'react-i18next'
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/** animate-ui.com のコピーボタンを、内部プリミティブ依存なしで移植したもの。
 *  クリックでコピーし、アイコンが Copy→Check にスケール/ブラーで切り替わる。 */
const copyButtonVariants = cva(
  "flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-d-border bg-d-med text-d-text',
        ghost: 'text-d-text2 hover:text-d-text',
      },
      size: { default: 'size-9', sm: 'size-8 rounded-md', lg: 'size-11 rounded-xl' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type CopyButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> &
  VariantProps<typeof copyButtonVariants> & {
    content: string
    copied?: boolean
    onCopiedChange?: (copied: boolean, content?: string) => void
    delay?: number
    hoverScale?: number
    tapScale?: number
  }

function CopyButton({
  className,
  content,
  copied,
  onCopiedChange,
  onClick,
  variant,
  size,
  delay = 2000,
  hoverScale = 1.05,
  tapScale = 0.95,
  ...props
}: CopyButtonProps) {
  const { t: tr } = useTranslation()
  const [internal, setInternal] = React.useState(false)
  const isCopied = copied ?? internal

  const handleCopy = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (isCopied || !content) return
      navigator.clipboard.writeText(content).then(() => {
        setInternal(true)
        onCopiedChange?.(true, content)
        setTimeout(() => { setInternal(false); onCopiedChange?.(false) }, delay)
      }).catch((err) => console.error('copy failed', err))
    },
    [onClick, isCopied, content, onCopiedChange, delay],
  )

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <motion.button
      type="button"
      data-slot="copy-button"
      aria-label={isCopied ? tr('cm.copied') : tr('cm.copy')}
      className={cn(copyButtonVariants({ variant, size }), className)}
      onClick={handleCopy}
      whileHover={undefined}
      whileTap={{ scale: tapScale }}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isCopied ? 'check' : 'copy'}
          data-slot="copy-button-icon"
          initial={{ scale: 0, opacity: 0.4, filter: 'blur(4px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0, opacity: 0.4, filter: 'blur(4px)' }}
          transition={{ duration: 0.25 }}
          className={cn(isCopied && 'text-d-accent')}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

export { CopyButton, copyButtonVariants, type CopyButtonProps }
