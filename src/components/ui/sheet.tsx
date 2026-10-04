import { useTranslation } from 'react-i18next'
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

function SheetContent({ className, children, side = "right", ...props }: SheetPrimitive.Popup.Props & { side?: "right" | "left" }) {
  const { t: tr } = useTranslation()
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "dash-scope fixed inset-y-0 z-50 flex w-full max-w-xl flex-col gap-4 bg-popover p-5 text-sm text-popover-foreground shadow-xl outline-none duration-200 data-open:animate-in data-closed:animate-out",
          side === "right" ? "right-0 border-l border-d-border data-open:slide-in-from-right data-closed:slide-out-to-right" : "left-0 border-r border-d-border data-open:slide-in-from-left data-closed:slide-out-to-left",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-d-med" aria-label={tr('aw.close')}>
          <XIcon className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 pr-8", className)} {...props} />
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-base font-bold", className)} {...props} />
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return <SheetPrimitive.Description className={cn("text-xs text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }
