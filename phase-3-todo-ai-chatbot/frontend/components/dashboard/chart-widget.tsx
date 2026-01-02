'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

interface ChartWidgetProps {
  title: string
  description?: string
  data: Array<{
    name: string
    value: number
  }>
  delay?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        "rounded-xl border p-3 shadow-lg",
        "bg-[#1a1a2e] border-[#2a2a3e]",
        "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
        "light:bg-white light:border-[#e5e5ea]"
      )}>
        <p className="text-sm font-medium text-white dark:text-white light:text-gray-900 mb-1">
          {label}
        </p>
        <p className="text-sm text-purple-400">
          {payload[0].value} tasks
        </p>
      </div>
    )
  }
  return null
}

export function ChartWidget({ title, description, data, delay = 0 }: ChartWidgetProps) {
  const chartConfig = {
    value: {
      label: 'Tasks',
      color: '#A855F7',
    },
  }

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
          <CardTitle className="dark:text-white light:text-gray-900">{title}</CardTitle>
          {description && (
            <CardDescription className="dark:text-gray-400 light:text-gray-600">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <ChartContainer config={chartConfig} className="h-70 w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="transparent"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={25}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#A855F7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
