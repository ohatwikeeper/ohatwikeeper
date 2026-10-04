import type { ComponentProps } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DVariant = 'default' | 'primary' | 'danger' | 'icon'
const map = { default: 'outline', primary: 'default', danger: 'ghost', icon: 'ghost' } as const
const extra: Record<DVariant, string> = {
  default: 'rounded-full',
  primary: 'rounded-full font-semibold',
  danger: 'rounded-full text-muted-foreground hover:text-destructive',
  icon: 'rounded-full text-muted-foreground',
}

/** <a> など Button 以外にも同じ見た目を当てるためのクラス生成 */
export const dbtn = (variant: DVariant = 'default', className?: string) =>
  cn(buttonVariants({ variant: map[variant], size: variant === 'danger' || variant === 'icon' ? 'icon' : 'lg' }), 'h-auto gap-2 px-4 py-2 [&_i]:text-lg', extra[variant], variant !== 'default' && variant !== 'primary' && 'size-9 p-0', className)

export function DButton({ variant = 'default', className, ...props }: Omit<ComponentProps<typeof Button>, 'variant' | 'className'> & { variant?: DVariant; className?: string }) {
  return <Button variant={map[variant]} size={variant === 'danger' || variant === 'icon' ? 'icon' : 'lg'} className={cn('h-auto gap-2 px-4 py-2 [&_i]:text-lg', extra[variant], variant !== 'default' && variant !== 'primary' && 'size-9 p-0', className)} {...props} />
}
