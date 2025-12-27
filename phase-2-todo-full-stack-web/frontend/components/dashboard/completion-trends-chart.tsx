'use client'

/**
 * Completion Trends Chart
 *
 * Shows tasks completed and created over the last 7 days using Recharts
 */

import * as React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Task } from '@/types/task'
import { calculateCompletionTrends } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface CompletionTrendsChartProps {
  tasks: Task[]
  days?: number
  className?: string
}

export function CompletionTrendsChart({ tasks, days = 7, className }: CompletionTrendsChartProps) {
  const data = calculateCompletionTrends(tasks, days)

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-[#00d4b8]/20 bg-card p-6 backdrop-blur-md',
        'hover:border-[#00d4b8]/40 hover:shadow-[0_0_30px_rgba(0,212,184,0.15)]',
        'transition-all duration-300',
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Activity This Week</h3>
        <p className="text-sm text-muted-foreground">Tasks completed and created over the last {days} days</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2332',
              border: '1px solid rgba(0, 212, 184, 0.3)',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#00d4b8' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              color: '#fff',
            }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Completed"
          />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#00d4b8"
            strokeWidth={2}
            dot={{ fill: '#00d4b8', r: 4 }}
            activeDot={{ r: 6 }}
            name="Created"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
