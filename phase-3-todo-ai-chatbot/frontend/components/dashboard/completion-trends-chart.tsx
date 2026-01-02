// 'use client'

// /**
//  * Completion Trends Chart
//  *
//  * Shows tasks completed and created over the last 7 days using Recharts
//  */

// import * as React from 'react'
// import { useTheme } from 'next-themes'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// import { Task } from '@/types/task'
// import { calculateCompletionTrends } from '@/lib/analytics'
// import { cn } from '@/lib/utils'

// interface CompletionTrendsChartProps {
//   tasks: Task[]
//   days?: number
//   className?: string
// }

// export function CompletionTrendsChart({ tasks, days = 7, className }: CompletionTrendsChartProps) {
//   const { theme, systemTheme } = useTheme()
//   const currentTheme = theme === 'system' ? systemTheme : theme
//   const isDark = currentTheme === 'dark'

//   const data = calculateCompletionTrends(tasks, days)

//   // Theme-aware colors
//   const colors = {
//     grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
//     axis: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
//     text: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
//     tooltipBg: isDark ? '#1a2332' : '#ffffff',
//     tooltipBorder: isDark ? 'rgba(0, 212, 184, 0.3)' : 'rgba(0, 128, 128, 0.3)',
//     tooltipText: isDark ? '#fff' : '#000',
//     labelColor: isDark ? '#00d4b8' : '#008080',
//     completed: isDark ? '#10b981' : '#059669',
//     created: isDark ? '#00d4b8' : '#0d9488',
//   }

//   return (
//     <div
//       className={cn(
//         'rounded-2xl border-2 bg-card p-6 backdrop-blur-md shadow-sm',
//         'border-primary/20 hover:border-primary/40',
//         'dark:hover:shadow-[0_0_30px_rgba(0,212,184,0.15)]',
//         'transition-all duration-300',
//         className
//       )}
//     >
//       <div className="mb-6">
//         <h3 className="text-xl font-bold text-foreground mb-2">Activity This Week</h3>
//         <p className="text-sm text-muted-foreground">Tasks completed and created over the last {days} days</p>
//       </div>

//       <ResponsiveContainer width="100%" height={300}>
//         <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
//           <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
//           <XAxis
//             dataKey="date"
//             stroke={colors.axis}
//             tick={{ fill: colors.text, fontSize: 12 }}
//           />
//           <YAxis
//             stroke={colors.axis}
//             tick={{ fill: colors.text, fontSize: 12 }}
//             allowDecimals={false}
//           />
//           <Tooltip
//             contentStyle={{
//               backgroundColor: colors.tooltipBg,
//               border: `1px solid ${colors.tooltipBorder}`,
//               borderRadius: '8px',
//               color: colors.tooltipText,
//             }}
//             labelStyle={{ color: colors.labelColor }}
//           />
//           <Legend
//             wrapperStyle={{
//               paddingTop: '20px',
//               color: colors.text,
//             }}
//             iconType="line"
//           />
//           <Line
//             type="monotone"
//             dataKey="completed"
//             stroke={colors.completed}
//             strokeWidth={2}
//             dot={{ fill: colors.completed, r: 4 }}
//             activeDot={{ r: 6 }}
//             name="Completed"
//           />
//           <Line
//             type="monotone"
//             dataKey="created"
//             stroke={colors.created}
//             strokeWidth={2}
//             dot={{ fill: colors.created, r: 4 }}
//             activeDot={{ r: 6 }}
//             name="Created"
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   )
// }
