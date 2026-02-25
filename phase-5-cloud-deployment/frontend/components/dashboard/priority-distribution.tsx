'use client'

/**
 * Priority Distribution Chart
 *
 * Shows distribution of tasks by priority using a donut chart
 */

import * as React from 'react'
import { useTheme } from 'next-themes'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Task } from '@/types/task'
import { calculatePriorityDistribution } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface PriorityDistributionProps {
  tasks: Task[]
  className?: string
}

export function PriorityDistribution({ tasks, className }: PriorityDistributionProps) {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  const distribution = calculatePriorityDistribution(tasks)

  const getIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return <AlertCircle className="h-4 w-4" />
      case 'Medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'Low':
        return <Info className="h-4 w-4" />
      default:
        return null
    }
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const hasData = activeTasks.length > 0

  // Theme-aware tooltip colors
  const tooltipBg = isDark ? '#1a2332' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(0, 212, 184, 0.3)' : 'rgba(0, 128, 128, 0.3)'
  const tooltipText = isDark ? '#fff' : '#000'

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all duration-300',
        'dark:bg-[#1a1a2e] dark:border-[#2a2a3e]',
        'light:bg-white light:border-[#e5e5ea]',
        'hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5',
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold dark:text-white light:text-gray-900 mb-2">Priority Distribution</h3>
        <p className="text-sm dark:text-gray-400 light:text-gray-600">Breakdown of active tasks by priority</p>
      </div>

      {!hasData ? (
        <div className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-purple-500 dark:text-purple-400 light:text-purple-600 opacity-50" />
          </div>
          <p className="text-sm dark:text-gray-300 light:text-gray-700 font-medium mb-2">No active tasks</p>
          <p className="text-xs dark:text-gray-500 light:text-gray-500">Create some tasks to see distribution</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipText,
                }}
                formatter={(value: number, name: string, props: any) => {
                  const percentage = props?.payload?.percentage || 0
                  const priority = props?.payload?.priority || name
                  return [`${value || 0} tasks (${percentage}%)`, priority]
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            {distribution.map((item) => (
              <div
                key={item.priority}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all",
                  "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                  "hover:bg-purple-500/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${item.color}20`,
                      border: `1px solid ${item.color}50`,
                      color: item.color
                    }}
                  >
                    {getIcon(item.priority)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white light:text-gray-900">{item.priority}</p>
                    <p className="text-xs dark:text-gray-400 light:text-gray-600">{item.count} tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-2 w-20 rounded-full overflow-hidden",
                      "dark:bg-gray-800 light:bg-gray-200"
                    )}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold w-12 text-right"
                    style={{ color: item.color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={cn(
            "mt-4 p-4 rounded-xl border",
            "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
            "dark:bg-purple-500/5 light:bg-purple-50/50"
          )}>
            <p className="text-sm dark:text-gray-300 light:text-gray-700">
              <span className="font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">{activeTasks.length}</span> total active tasks
            </p>
          </div>
        </>
      )}
    </div>
  )
}
