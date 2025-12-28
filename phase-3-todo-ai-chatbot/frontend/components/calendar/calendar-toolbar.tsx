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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate('TODAY')}
          className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('PREV')}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('NEXT')}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current date label */}
      <h2 className="text-lg font-semibold text-white order-first sm:order-none">
        {label}
      </h2>

      {/* View switcher */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        {viewArray.map((viewOption) => (
          <Button
            key={viewOption}
            variant="ghost"
            size="sm"
            onClick={() => handleViewChange(viewOption)}
            className={cn(
              'h-7 px-3 text-xs font-medium transition-all',
              view === viewOption
                ? 'bg-[#00d4b8] text-[#0b1121] hover:bg-[#00d4b8]/90'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            {viewLabels[viewOption] || viewOption}
          </Button>
        ))}
      </div>
    </div>
  )
}
