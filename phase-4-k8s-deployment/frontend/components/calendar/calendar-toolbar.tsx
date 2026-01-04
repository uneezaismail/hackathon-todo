'use client'

import { ToolbarProps, View, NavigateAction } from 'react-big-calendar'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarEventData } from './task-calendar'

const viewLabels: Record<View, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
  agenda: 'Agenda',
  work_week: 'Work Week',
}

export function CalendarToolbar({
  label,
  onNavigate,
  onView,
  view,
  views,
}: ToolbarProps<CalendarEventData, object>) {
  const handleNavigate = (action: NavigateAction) => {
    onNavigate(action)
  }

  const handleViewChange = (newView: View) => {
    onView(newView)
  }

  const viewArray = Array.isArray(views) ? views : Object.keys(views) as View[]

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-6">
      {/* Current date label - Mobile first */}
      <div className="flex items-center justify-between sm:justify-center">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          {label}
        </h2>
      </div>

      {/* Navigation and View Switcher - Responsive layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('TODAY')}
            className={cn(
              "h-9 px-3 sm:px-4 gap-2 rounded-lg font-medium transition-all duration-200",
              "bg-purple-50 dark:bg-purple-500/10",
              "border-purple-200 dark:border-purple-500/20",
              "text-purple-700 dark:text-purple-300",
              "hover:bg-purple-100 dark:hover:bg-purple-500/20",
              "hover:border-purple-300 dark:hover:border-purple-500/30"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden xs:inline">Today</span>
          </Button>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('PREV')}
              className={cn(
                "h-8 w-8 rounded-md transition-all duration-200",
                "text-gray-600 dark:text-white/60",
                "hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('NEXT')}
              className={cn(
                "h-8 w-8 rounded-md transition-all duration-200",
                "text-gray-600 dark:text-white/60",
                "hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* View switcher - Responsive */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {viewArray.map((viewOption) => (
            <Button
              key={viewOption}
              variant="ghost"
              size="sm"
              onClick={() => handleViewChange(viewOption)}
              className={cn(
                'h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-md transition-all duration-200',
                view === viewOption
                  ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
              )}
            >
              {viewLabels[viewOption] || viewOption}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
