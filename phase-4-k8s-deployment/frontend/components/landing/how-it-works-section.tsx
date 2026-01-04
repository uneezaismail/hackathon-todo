'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepProps {
  number: number
  icon: React.ReactNode
  title: string
  description: string
  steps: string[]
  index: number
}

function StepCard({ number, icon, title, description, steps, index }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Connection Line to Next Step (hidden on mobile) */}
      {index < 2 && (
        <div className="hidden lg:block absolute top-1/4 -right-16 w-32 h-1">
          <svg className="w-full h-full" viewBox="0 0 128 4" fill="none">
            <motion.line
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: index * 0.3 + 0.3 }}
              viewport={{ once: true }}
              x1="0"
              y1="2"
              x2="128"
              y2="2"
              stroke="url(#gradient-line)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <defs>
              <linearGradient id="gradient-line" x1="0" y1="0" x2="128" y2="0">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      <div className="relative z-10">
        {/* Step Number Badge */}
        <motion.div
          whileHover={{ scale: 1.2 }}
          className={cn(
            'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 sm:mb-8',
            'backdrop-blur-xl border-2 font-bold text-xl sm:text-2xl',
            'bg-purple-500/10',
            'border-purple-500/40 text-purple-400'
          )}
        >
          {number}
        </motion.div>

        {/* Icon Container */}
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={cn(
            'w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6',
            'backdrop-blur-md border-2',
            'bg-purple-500/10 border-purple-500/40 text-purple-400'
          )}
        >
          {icon}
        </motion.div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
          {description}
        </p>

        {/* Steps List */}
        <div className="space-y-2 sm:space-y-3">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 + 0.3 + idx * 0.1 }}
              viewport={{ once: true }}
              className="flex items-start gap-3"
            >
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-gray-300 text-sm sm:text-base">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Chat & Create',
      description: 'Simply tell the AI what you need to do using natural language. No complicated forms or confusing menus.',
      steps: [
        'Open the AI chat interface',
        'Describe your task in plain English',
        'AI automatically sets priority and details'
      ]
    },
    {
      number: 2,
      icon: <Zap className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Plan & Organize',
      description: 'Visualize your tasks on the calendar and let AI help you prioritize what matters most.',
      steps: [
        'View tasks on interactive calendar',
        'Set due dates and recurring patterns',
        'Get AI-powered scheduling suggestions'
      ]
    },
    {
      number: 3,
      icon: <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: 'Track & Improve',
      description: 'Monitor your productivity with beautiful analytics and insights to optimize your workflow.',
      steps: [
        'Track completion with visual heatmaps',
        'Analyze productivity patterns',
        'Get personalized recommendations'
      ]
    }
  ]

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-dark-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-300 border border-purple-500/20 mb-4 sm:mb-6">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Simple Process</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            How It
            <span className="block text-purple-400 mt-2">
              Actually Works
            </span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            From capturing ideas to tracking progress, TaskFlow makes productivity feel natural and effortless.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              {...step}
              index={index}
            />
          ))}
        </div>

        {/* Feature Showcase Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-20 lg:mt-28"
        >
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent p-0.5 sm:p-1">
            <div className="rounded-xl sm:rounded-2xl bg-dark-background/90 backdrop-blur-xl p-6 sm:p-8 lg:p-12">
              {/* Interactive Features Showcase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { label: 'Natural Language', value: 'Say what you need' },
                  { label: 'Smart Calendar', value: 'Visualize & reschedule' },
                  { label: 'Auto Priority', value: 'AI learns patterns' },
                  { label: 'Recurring Tasks', value: 'Set it once, forget it' },
                  { label: 'Analytics Ready', value: 'Track everything' },
                  { label: 'Collaboration', value: 'Share & sync' }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + idx * 0.1 }}
                    viewport={{ once: true }}
                    className="p-4 sm:p-6 rounded-xl border border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
                  >
                    <h4 className="text-sm font-semibold text-purple-400 mb-1">{feature.label}</h4>
                    <p className="text-gray-400 text-sm">{feature.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
