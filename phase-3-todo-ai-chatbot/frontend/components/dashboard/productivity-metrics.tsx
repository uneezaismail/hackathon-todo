// 'use client'

// /**
//  * Productivity Metrics Component
//  *
//  * Shows key productivity statistics:
//  * - Current streak
//  * - Completion rate
//  * - Average completion time
//  * - Tasks completed today/this week
//  */

// import * as React from 'react'
// import { TrendingUp, TrendingDown, Flame, Target, Clock, CheckCircle2 } from 'lucide-react'
// import { Task } from '@/types/task'
// import { calculateProductivityMetrics } from '@/lib/analytics'
// import { cn } from '@/lib/utils'

// interface ProductivityMetricsProps {
//   tasks: Task[]
//   className?: string
// }

// export function ProductivityMetrics({ tasks, className }: ProductivityMetricsProps) {
//   const metrics = calculateProductivityMetrics(tasks)

//   const metricItems = [
//     {
//       label: 'Current Streak',
//       value: `${metrics.currentStreak}d`,
//       icon: Flame,
//       color: 'text-orange-400',
//       bgColor: 'bg-orange-400/10',
//       borderColor: 'border-orange-400/30',
//     },
//     {
//       label: 'Completion Rate',
//       value: `${metrics.completionRate}%`,
//       icon: Target,
//       color: 'text-green-400',
//       bgColor: 'bg-green-400/10',
//       borderColor: 'border-green-400/30',
//       trend: metrics.completionRateTrend !== 0 ? {
//         value: Math.abs(metrics.completionRateTrend),
//         isPositive: metrics.completionRateTrend > 0
//       } : undefined
//     },
//     {
//       label: 'Avg. Completion',
//       value: metrics.avgCompletionTime > 0 ? `${metrics.avgCompletionTime}d` : 'N/A',
//       icon: Clock,
//       color: 'text-blue-400',
//       bgColor: 'bg-blue-400/10',
//       borderColor: 'border-blue-400/30',
//     },
//     {
//       label: 'Done Today',
//       value: metrics.tasksCompletedToday.toString(),
//       icon: CheckCircle2,
//       color: 'text-[#00d4b8]',
//       bgColor: 'bg-[#00d4b8]/10',
//       borderColor: 'border-[#00d4b8]/30',
//     },
//     {
//       label: 'This Week',
//       value: metrics.tasksCompletedThisWeek.toString(),
//       icon: TrendingUp,
//       color: 'text-purple-400',
//       bgColor: 'bg-purple-400/10',
//       borderColor: 'border-purple-400/30',
//     },
//     {
//       label: 'Longest Streak',
//       value: `${metrics.longestStreak}d`,
//       icon: Flame,
//       color: 'text-yellow-400',
//       bgColor: 'bg-yellow-400/10',
//       borderColor: 'border-yellow-400/30',
//     },
//   ]

//   return (
//     <div
//       className={cn(
//         'rounded-2xl border-2 border-[#00d4b8]/20 bg-card p-6 backdrop-blur-md',
//         'hover:border-[#00d4b8]/40 hover:shadow-[0_0_30px_rgba(0,212,184,0.15)]',
//         'transition-all duration-300',
//         className
//       )}
//     >
//       <div className="mb-6">
//         <div className="flex items-center gap-2 mb-2">
//           <TrendingUp className="h-5 w-5 text-[#00d4b8]" />
//           <h3 className="text-xl font-bold text-foreground">Productivity</h3>
//         </div>
//         <p className="text-sm text-muted-foreground">Your performance metrics</p>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         {metricItems.map((item) => {
//           const Icon = item.icon
//           return (
//             <div
//               key={item.label}
//               className={cn(
//                 'p-4 rounded-xl border transition-all duration-200',
//                 item.borderColor,
//                 item.bgColor,
//                 'hover:scale-105 hover:shadow-lg'
//               )}
//             >
//               <div className="flex items-center justify-between mb-2">
//                 <div className={cn(
//                   'flex h-8 w-8 items-center justify-center rounded-lg border',
//                   item.borderColor,
//                   item.bgColor
//                 )}>
//                   <Icon className={cn('h-4 w-4', item.color)} />
//                 </div>
//                 {item.trend && (
//                   <div className={cn(
//                     'flex items-center gap-1 text-xs font-medium',
//                     item.trend.isPositive ? 'text-green-400' : 'text-red-400'
//                   )}>
//                     {item.trend.isPositive ? (
//                       <TrendingUp className="h-3 w-3" />
//                     ) : (
//                       <TrendingDown className="h-3 w-3" />
//                     )}
//                     {item.trend.value}%
//                   </div>
//                 )}
//               </div>
//               <div className="text-2xl font-bold text-foreground mb-1">
//                 {item.value}
//               </div>
//               <div className="text-xs text-muted-foreground">
//                 {item.label}
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       {metrics.currentStreak >= 3 && (
//         <div className="mt-4 p-3 rounded-lg bg-orange-400/10 border border-orange-400/30">
//           <div className="flex items-center gap-2">
//             <Flame className="h-4 w-4 text-orange-400" />
//             <p className="text-xs text-orange-400 font-medium">
//               {metrics.currentStreak}-day streak! Keep it going! 🔥
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
