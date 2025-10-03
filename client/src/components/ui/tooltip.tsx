"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // Container styling (stronger visual contrast)
      "relative z-50 overflow-hidden rounded-xl bg-white/95 dark:bg-neutral-900/90 px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 shadow-2xl border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/5",
      // Entry/exit animations
      "animate-in fade-in-0 zoom-in-95 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      // Directional slide
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      // Transform origin for better scaling from trigger
      "origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  >
    {/* Decorative gradient accent */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent dark:via-blue-300/20" />
    {/* Content */}
    <div className="relative">
      {children}
    </div>
    {/* Arrow */}
    <TooltipPrimitive.Arrow className="drop-shadow-sm fill-white dark:fill-neutral-900" width={10} height={6} />
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
