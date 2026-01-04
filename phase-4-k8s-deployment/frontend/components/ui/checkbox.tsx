"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded border-2 shadow transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Unchecked state
      "dark:border-gray-600 light:border-gray-300",
      "dark:bg-transparent light:bg-white",
      // Checked state - purple
      "data-[state=checked]:dark:bg-purple-500 data-[state=checked]:dark:border-purple-500",
      "data-[state=checked]:light:bg-purple-600 data-[state=checked]:light:border-purple-600",
      "data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-3.5 w-3.5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
