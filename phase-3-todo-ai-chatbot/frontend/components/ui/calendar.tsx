"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar",
        // Responsive padding - smaller on mobile
        "p-2 sm:p-3 md:p-4",
        // Responsive cell sizes - smaller on mobile
        "[--cell-size:2.25rem] sm:[--cell-size:2.5rem] md:[--cell-size:2.75rem]",
        // Default styling for calendar - will be overridden in popover context
        "bg-white dark:bg-[#1a1a2e]",
        "border-[#E5E7EB] dark:border-[#2a2a3e]",
        "rounded-xl border shadow-lg",
        // Override styling when inside popover - prevent double layer
        "[[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:border-0 [[data-slot=popover-content]_&]:shadow-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: cn("w-full border-collapse min-w-[240px] sm:min-w-[280px]"),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 min-w-[2rem] sm:min-w-[2.5rem] select-none rounded-md text-xs sm:text-sm font-medium uppercase",
          "text-gray-600 dark:text-gray-400 py-1 sm:py-2 text-center",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-purple-100 dark:bg-purple-500/20",
          "border-purple-600 dark:border-purple-500",
          "border-2 rounded-md",
          "data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-gray-400 dark:text-gray-500",
          "aria-selected:text-gray-400 aria-selected:dark:text-gray-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "opacity-40 cursor-not-allowed",
          "text-gray-400 dark:text-gray-600",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square h-[--cell-size] w-[--cell-size] min-w-[2rem] sm:min-w-[2.5rem] flex-col gap-1 leading-none items-center justify-center",
        "text-xs sm:text-sm md:text-base font-normal",
        "transition-colors duration-150",
        // Normal state
        "text-gray-900 dark:text-white",
        "hover:bg-gray-100 dark:hover:bg-[#2a2a3e]",
        // Selected single state
        "data-[selected-single=true]:bg-purple-600 data-[selected-single=true]:dark:bg-purple-500",
        "data-[selected-single=true]:text-white font-semibold",
        "data-[selected-single=true]:hover:bg-purple-700 data-[selected-single=true]:hover:dark:bg-purple-600",
        // Range states
        "data-[range-start=true]:rounded-l-lg data-[range-start=true]:rounded-r-none",
        "data-[range-start=true]:bg-purple-600 data-[range-start=true]:dark:bg-purple-500",
        "data-[range-start=true]:text-white",
        "data-[range-middle=true]:rounded-none",
        "data-[range-middle=true]:bg-purple-100 data-[range-middle=true]:dark:bg-purple-500/30",
        "data-[range-middle=true]:text-purple-900 data-[range-middle=true]:dark:text-white",
        "data-[range-end=true]:rounded-r-lg data-[range-end=true]:rounded-l-none",
        "data-[range-end=true]:bg-purple-600 data-[range-end=true]:dark:bg-purple-500",
        "data-[range-end=true]:text-white",
        // Focus state
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-purple-500/50",
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
