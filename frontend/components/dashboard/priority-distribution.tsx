'use client'

/**
 * Priority Distribution Chart
 *
 * Shows distribution of tasks by priority using a donut chart
 */

import * as React from 'react'
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

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-[#8b5cf6]/20 bg-card p-6 backdrop-blur-md',
        'hover:border-[#8b5cf6]/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
        'transition-all duration-300',
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Priority Distribution</h3>
        <p className="text-sm text-muted-foreground">Breakdown of active tasks by priority</p>
      </div>

      {!hasData ? (
        <div className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10 mx-auto mb-3">
            <AlertCircle className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-muted-foreground text-sm">No active tasks</p>
          <p className="text-muted-foreground text-xs mt-1">Create some tasks to see distribution</p>
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
                  backgroundColor: '#1a2332',
                  border: '1px solid rgba(0, 212, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value, name, props: any) => [
                  `${value || 0} tasks (${props.payload.percentage}%)`,
                  props.payload.priority
                ] as [string, string]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            {distribution.map((item) => (
              <div
                key={item.priority}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary hover:bg-secondary transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${item.color}20`,
                      border: `1px solid ${item.color}50`,
                      color: item.color
                    }}
                  >
                    {getIcon(item.priority)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.priority}</p>
                    <p className="text-xs text-muted-foreground">{item.count} tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-16 rounded-full bg-secondary overflow-hidden"
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
                    className="text-sm font-semibold w-12 text-right"
                    style={{ color: item.color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-secondary border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{activeTasks.length}</span> total active tasks
            </p>
          </div>
        </>
      )}
    </div>
  )
}
