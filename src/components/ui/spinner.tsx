import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"

/** 汎用ローディング表示。5本のバーが波打つ(色は text-* で指定。既定はアクセント色) */
function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  const { t: tr } = useTranslation()
  return (
    <span role="status" aria-label={tr('cm.loading')} data-slot="spinner" className={cn("inline-flex h-6 items-center gap-[3px] align-middle text-d-accent", className)} {...props}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} aria-hidden className="h-full w-[3px] origin-center rounded-full bg-current" style={{ animation: "spinner-bar 1s ease-in-out infinite", animationDelay: `${i * 0.11}s` }} />
      ))}
    </span>
  )
}

export { Spinner }
