import { cn } from "@/lib/utils"

/** シマー(光が流れる)付きプレースホルダー */
function Skeleton({ className, children, shimmer = true, ...props }: React.ComponentProps<"div"> & { shimmer?: boolean }) {
  return (
    <div data-slot="skeleton" className={cn("relative overflow-hidden rounded-md bg-muted", className)} {...props}>
      {children}
      {shimmer && <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" style={{ animation: "skeleton-shimmer 1.6s ease-in-out infinite" }} />}
    </div>
  )
}

export { Skeleton }
