// 'use client'

// /**
//  * Today's Focus Component
//  *
//  * Shows:
//  * - Tasks due today
//  * - Overdue tasks
//  * - High priority pending tasks
//  */

// import * as React from 'react'
// import { AlertCircle, Calendar, Flame, Repeat } from 'lucide-react'
// import { Task } from '@/types/task'
// import { getTodaysFocus } from '@/lib/analytics'
// import { getRecurrencePatternText } from '@/lib/analytics'
// import { cn } from '@/lib/utils'
// import Link from 'next/link'
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip'

// interface TodaysFocusProps {
//   tasks: Task[]
//   className?: string
// }

// export function TodaysFocus({ tasks, className }: TodaysFocusProps) {
//   const { dueToday, overdue, highPriority } = getTodaysFocus(tasks)

//   const focusTasks = [
//     ...overdue.map(t => ({ ...t, category: 'overdue' as const })),
//     ...dueToday.map(t => ({ ...t, category: 'today' as const })),
//     ...highPriority.map(t => ({ ...t, category: 'priority' as const })),
//   ].slice(0, 6) // Limit to 6 items

//   return (
//     <div
//       className={cn(
//         'rounded-2xl border-2 border-[#8b5cf6]/20 bg-card p-6 backdrop-blur-md',
//         'hover:border-[#8b5cf6]/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
//         'transition-all duration-300',
//         className
//       )}
//     >
//       <div className="mb-6">
//         <div className="flex items-center gap-2 mb-2">
//           <Flame className="h-5 w-5 text-[#ec4899]" />
//           <h3 className="text-xl font-bold text-foreground">Today's Focus</h3>
//         </div>
//         <p className="text-sm text-muted-foreground">Prioritized tasks requiring your attention</p>
//       </div>

//       {focusTasks.length === 0 ? (
//         <div className="text-center py-8">
//           <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10 mx-auto mb-3">
//             <Flame className="h-8 w-8 text-green-400" />
//           </div>
//           <p className="text-muted-foreground text-sm">All caught up! No urgent tasks.</p>
//           <p className="text-muted-foreground text-xs mt-1">Great job staying on top of your work!</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {focusTasks.map((task) => {
//             const isOverdue = task.category === 'overdue'
//             const isDueToday = task.category === 'today'
//             const isHighPriority = task.category === 'priority'

//             let icon = <Calendar className="h-4 w-4" />
//             let badge = 'Due Today'
//             let badgeColor = 'bg-blue-400/10 text-blue-400 border-blue-400/30'
//             let tooltipContent: React.ReactNode | null = null

//             if (isOverdue) {
//               icon = <AlertCircle className="h-4 w-4" />
//               badge = 'Overdue'
//               badgeColor = 'bg-red-400/10 text-red-400 border-red-400/30'
//             } else if (isHighPriority) {
//               icon = <Flame className="h-4 w-4" />
//               badge = 'High Priority'
//               badgeColor = 'bg-orange-400/10 text-orange-400 border-orange-400/30'
//             } else if (getRecurrencePatternText(task)) {
//               icon = <Repeat className="h-4 w-4" />
//               badge = ''
//               badgeColor = 'bg-purple-400/10 text-purple-400 border-purple-400/30'
//               tooltipContent = `Recurring: ${getRecurrencePatternText(task)}`
//             }

//             return (
//               <Link
//                 key={task.id}
//                 href="/dashboard/tasks"
//                 className={cn(
//                   'group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
//                   isOverdue && 'border-red-400/20 bg-red-400/5 hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]',
//                   isDueToday && 'border-blue-400/20 bg-blue-400/5 hover:border-blue-400/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]',
//                   isHighPriority && 'border-orange-400/20 bg-orange-400/5 hover:border-orange-400/40 hover:shadow-[0_0_20px_rgba(251,146,60,0.1)]',
//                   'hover:scale-[1.02] cursor-pointer'
//                 )}
//               >
//                 <div className={cn(
//                   'flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center border transition-all',
//                   isOverdue && 'bg-red-400/10 border-red-400/30 text-red-400',
//                   isDueToday && 'bg-blue-400/10 border-blue-400/30 text-blue-400',
//                   isHighPriority && 'bg-orange-400/10 border-orange-400/30 text-orange-400'
//                 )}>
//                   {icon}
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-1.5">
//                     <h4 className="text-sm font-medium text-foreground truncate group-hover:text-[#00d4b8] transition-colors flex-1">
//                       {task.title}
//                     </h4>
//                     {/* Recurring task indicator */}
//                     {getRecurrencePatternText(task) && (
//                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-purple-400/10 text-purple-400 border-purple-400/30 flex-shrink-0">
//                         <Repeat className="h-3 w-3" />
//                         <span className="truncate max-w-[120px]">{getRecurrencePatternText(task)}</span>
//                       </div>
//                     )}
//                   </div>
//                   {task.due_date && (
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Due: {new Date(task.due_date).toLocaleDateString('en-US', {
//                         month: 'short',
//                         day: 'numeric',
//                         year: new Date(task.due_date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
//                       })}
//                     </p>
//                   )}
//                 </div>

//                 <div className={cn(
//                   'px-3 py-1 rounded-full text-xs font-medium border transition-all',
//                   badgeColor
//                 )}>
//                   {badge}
//                 </div>
//               </Link>
//             )
//           })}
//         </div>
//       )}

//       {focusTasks.length > 0 && (
//         <Link
//           href="/dashboard/tasks"
//           className="mt-4 block text-center text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
//         >
//           View all tasks →
//         </Link>
//       )}
//     </div>
//   )
// }
