'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'completed' | 'created' | 'updated' | 'overdue'
  title: string
  timestamp: Date
}

interface ActivityFeedProps {
  activities: Activity[]
  delay?: number
}

const activityConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-purple-500 dark:text-purple-400 light:text-purple-600',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50',
  },
  created: {
    icon: Plus,
    color: 'text-purple-500 dark:text-purple-400 light:text-purple-600',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50',
  },
  updated: {
    icon: Clock,
    color: 'text-purple-500 dark:text-purple-400 light:text-purple-600',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-purple-500 dark:text-purple-400 light:text-purple-600',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50',
  },
}

export function ActivityFeed({ activities, delay = 0 }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card className={cn(
        "border transition-all duration-300 h-full",
        "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
        "light:bg-white light:border-[#e5e5ea]",
        "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
      )}>
        <CardHeader className={cn(
          "border-b",
          "dark:border-[#2a2a3e]",
          "light:border-[#e5e5ea]"
        )}>
          <CardTitle className="dark:text-white light:text-gray-900">Recent Activity</CardTitle>
          <CardDescription className="dark:text-gray-400 light:text-gray-600">
            Your latest task updates
          </CardDescription>
        </CardHeader>
       <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 overflow-x-hidden">
          <div className="space-y-3 sm:space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm dark:text-gray-400 light:text-gray-600 text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity, index) => {
                const config = activityConfig[activity.type]
                const Icon = config.icon

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: delay + index * 0.05 }}
                    className="flex items-start gap-2 sm:gap-3 group hover:bg-purple-500/5 p-2 sm:p-3 -mx-2 sm:-mx-3 rounded-xl transition-colors"
                  >
                    <div className={cn("flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl shrink-0", config.bgColor)}>
                      <Icon className={cn("h-4 sm:h-5 w-4 sm:w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs sm:text-sm font-medium dark:text-white light:text-gray-900 leading-tight truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs dark:text-gray-400 light:text-gray-600 truncate">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
