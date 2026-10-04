import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** shadcn/ui の InputGroup(入力欄 + 前後のアドオン/ボタンを1つの枠にまとめる) */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group" role="group"
      className={cn(
        "group/input-group relative flex h-11 w-full min-w-0 items-center rounded-xl border border-d-border bg-d-med transition-[color,box-shadow] outline-none",
        "has-[>[data-align=inline-start]]:[&>input]:pl-2 has-[>[data-align=inline-end]]:[&>input]:pr-2",
        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none [&>svg:not([class*='size-'])]:size-4",
  {
    variants: { align: { "inline-start": "order-first pl-3", "inline-end": "order-last pr-1.5" } },
    defaultVariants: { align: "inline-start" },
  },
)

function InputGroupAddon({ className, align = "inline-start", ...props }: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group" data-slot="input-group-addon" data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

function InputGroupButton({ className, size = "sm", variant = "default", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="input-group-button" size={size} variant={variant} className={cn("h-8 rounded-lg px-3 text-sm shadow-none", className)} {...props} />
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn("h-full flex-1 rounded-none border-0 bg-transparent px-3 shadow-none ring-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 dark:bg-transparent dark:aria-invalid:ring-0", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput }
