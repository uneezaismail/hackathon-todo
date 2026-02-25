// 'use client'

// /**
//  * Upcoming Deadlines Widget
//  *
//  * Shows next 5 upcoming deadlines sorted by urgency
//  */

// import * as React from 'react'
// import { Clock, AlertTriangle } from 'lucide-react'
// import { Task } from '@/types/task'
// import { getUpcomingDeadlines } from '@/lib/analytics'
// import { cn } from '@/lib/utils'
// import Link from 'next/link'

// interface UpcomingDeadlinesProps {
//   tasks: Task[]
//   limit?: number
//   className?: string
// }

// export function UpcomingDeadlines({ tasks, limit = 5, className }: UpcomingDeadlinesProps) {
//   const deadlines = getUpcomingDeadlines(tasks, limit)

//   const getUrgencyColor = (urgency: string) => {
//     switch (urgency) {
//       case 'critical':
//         return {
//           bg: 'bg-red-400/10',
//           border: 'border-red-400/30',
//           text: 'text-red-400',
//           glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
//         }
//       case 'urgent':
//         return {
//           bg: 'bg-orange-400/10',
//           border: 'border-orange-400/30',
//           text: 'text-orange-400',
//           glow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]'
//         }
//       case 'soon':
//         return {
//           bg: 'bg-yellow-400/10',
//           border: 'border-yellow-400/30',
//           text: 'text-yellow-400',
//           glow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]'
//         }
//       default:
//         return {
//           bg: 'bg-blue-400/10',
//           border: 'border-blue-400/30',
//           text: 'text-blue-400',
//           glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]'
//         }
//     }
//   }

//   const formatDaysUntil = (days: number, isOverdue: boolean) => {
//     if (isOverdue) {
//       const absDays = Math.abs(days)
//       return absDays === 1 ? '1 day overdue' : `${absDays} days overdue`
//     }
//     if (days === 0) return 'Due today'
//     if (days === 1) return 'Due tomorrow'
//     return `Due in ${days} days`
//   }

//   return (
//     <div
//       className={cn(
//         'rounded-2xl border-2 border-[#ec4899]/20 bg-card p-6 backdrop-blur-md',
//         'hover:border-[#ec4899]/40 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]',
//         'transition-all duration-300',
//         className
//       )}
//     >
//       <div className="mb-6">
//         <div className="flex items-center gap-2 mb-2">
//           <Clock className="h-5 w-5 text-[#00d4b8]" />
//           <h3 className="text-xl font-bold text-foreground">Upcoming Deadlines</h3>
//         </div>
//         <p className="text-sm text-muted-foreground">Tasks sorted by urgency</p>
//       </div>

//       {deadlines.length === 0 ? (
//         <div className="text-center py-8">
//           <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10 mx-auto mb-3">
//             <Clock className="h-8 w-8 text-green-400" />
//           </div>
//           <p className="text-muted-foreground text-sm">No upcoming deadlines</p>
//           <p className="text-muted-foreground text-xs mt-1">You're all set!</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {deadlines.map(({ task, daysUntil, isOverdue, urgency }) => {
//             const colors = getUrgencyColor(urgency)

//             return (
//               <Link
//                 key={task.id}
//                 href="/dashboard/tasks"
//                 className={cn(
//                   'group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200',
//                   colors.border,
//                   colors.bg,
//                   colors.glow,
//                   'hover:scale-[1.02] cursor-pointer'
//                 )}
//               >
//                 <div className="flex items-center gap-3 flex-1 min-w-0">
//                   <div className={cn(
//                     'flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center border transition-all',
//                     colors.border,
//                     colors.bg,
//                     colors.text
//                   )}>
//                     {isOverdue || urgency === 'critical' ? (
//                       <AlertTriangle className="h-5 w-5" />
//                     ) : (
//                       <Clock className="h-5 w-5" />
//                     )}
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <h4 className="text-sm font-medium text-foreground truncate group-hover:text-[#00d4b8] transition-colors">
//                       {task.title}
//                     </h4>
//                     <div className="flex items-center gap-2 mt-1">
//                       <span className="text-xs text-muted-foreground">
//                         {task.due_date && new Date(task.due_date).toLocaleDateString('en-US', {
//                           month: 'short',
//                           day: 'numeric'
//                         })}
//                       </span>
//                       {task.priority && (
//                         <>
//                           <span className="text-xs text-white/30">•</span>
//                           <span className={cn(
//                             'text-xs',
//                             task.priority === 'High' && 'text-red-400',
//                             task.priority === 'Medium' && 'text-yellow-400',
//                             task.priority === 'Low' && 'text-blue-400'
//                           )}>
//                             {task.priority}
//                           </span>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className={cn(
//                   'px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all',
//                   colors.border,
//                   colors.text
//                 )}>
//                   {formatDaysUntil(daysUntil, isOverdue)}
//                 </div>
//               </Link>
//             )
//           })}
//         </div>
//       )}

//       {deadlines.length > 0 && (
//         <Link
//           href="/dashboard/tasks"
//           className="mt-4 block text-center text-sm text-[#ec4899] hover:text-[#f472b6] transition-colors"
//         >
//           View all tasks →
//         </Link>
//       )}
//     </div>
//   )
// }
