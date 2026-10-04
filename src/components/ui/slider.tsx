"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({ className, ...props }: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="flex h-5 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="relative h-1.5 w-full rounded-full bg-d-light">
          <SliderPrimitive.Indicator className="rounded-full bg-d-accent" />
          <SliderPrimitive.Thumb className="block size-4 rounded-full border border-d-accent bg-white shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
