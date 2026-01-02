'use client'

import { motion } from 'framer-motion'
import { Brain, Calendar, BarChart3, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  index: number
}

function FeatureCard({ icon, title, description, accentColor, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      {/* Card Container */}
      <div
        className={cn(
          'relative rounded-2xl border p-6 sm:p-8 h-full',
          'backdrop-blur-xl bg-white/3',
          'border-purple-500/20 hover:border-purple-500/40',
          'transition-all duration-300'
        )}
      >
        {/* Content */}
        <div className="relative z-10">
          {/* Icon Container */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6',
              'backdrop-blur-md border',
              accentColor
            )}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
            {description}
          </p>

          {/* Learn More Link */}
          <motion.a
            href="#"
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium',
              'text-purple-400 hover:text-purple-300 transition-colors'
            )}
            whileHover={{ x: 4 }}
          >
            Learn more
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'AI-Powered Chat',
      description: 'Add tasks using natural language. Just say what needs to be done and let the AI handle the rest.',
      accentColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
    },
    {
      icon: <Calendar className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Smart Calendar',
      description: 'Visualize your tasks on a beautiful calendar. Drag and drop to reschedule with ease.',
      accentColor: 'bg-purple-500/10 border-purple-500/30 text-purple-300'
    },
    {
      icon: <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Analytics Dashboard',
      description: 'Track your productivity with GitHub-style heatmaps and detailed performance insights.',
      accentColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400'
    },
    {
      icon: <Zap className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: 'Automation',
      description: 'Set up recurring tasks and let the system handle routine work automatically.',
      accentColor: 'bg-purple-500/10 border-purple-500/30 text-purple-300'
    }
  ]

  return (
    <section id="features" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-dark-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />
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
            <span>Powerful Features</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Everything You Need to
            <span className="block text-purple-400 mt-2">
              Stay Organized
            </span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Built with powerful features designed to supercharge your productivity and keep your work organized.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 lg:mt-20 text-center"
        >
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Ready to experience the difference?
          </p>
          <motion.a
            href="/sign-up"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl',
              'bg-white text-dark-background',
              'font-semibold shadow-lg hover:shadow-xl',
              'transition-all duration-300'
            )}
          >
            Explore All Features
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
