'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, CheckCircle2, Users, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
}

function StatCard({ icon, label, value }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={cn(
          'w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4',
          'bg-purple-500/10',
          'border border-purple-500/30 text-purple-400'
        )}
      >
        {icon}
      </motion.div>
      <p className="text-gray-400 text-xs sm:text-sm mb-1">{label}</p>
      <h4 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{value}</h4>
    </motion.div>
  )
}

interface BenefitProps {
  text: string
  index: number
}

function BenefitItem({ text, index }: BenefitProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex items-center gap-3"
    >
      <motion.div whileHover={{ scale: 1.2 }} className="flex-shrink-0">
        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
      </motion.div>
      <span className="text-gray-300 text-sm sm:text-base">{text}</span>
    </motion.div>
  )
}

export function CTASection() {
  const benefits = [
    'Zero setup time - start immediately',
    'AI learns your task patterns',
    'Seamless calendar & chat integration',
    'Real-time productivity insights',
    'Recurring task automation',
    'Analytics dashboard included'
  ]

  const stats = [
    {
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8" />,
      label: 'Users Staying Productive',
      value: '10,000+'
    },
    {
      icon: <Zap className="h-6 w-6 sm:h-8 sm:w-8" />,
      label: 'Tasks Managed Daily',
      value: '500K+'
    },
    {
      icon: <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />,
      label: 'Productivity Increase',
      value: '3.5x'
    }
  ]

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-dark-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={cn(
            'relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16',
            'backdrop-blur-xl border border-purple-500/20',
            'bg-gradient-to-b from-purple-500/5 to-transparent'
          )}
        >
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md px-4 py-2 text-sm font-medium text-purple-300 border border-purple-500/20 mb-6 sm:mb-8"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Join the Productivity Revolution</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Ready to
              <span className="block text-purple-400 mt-2">
                reclaim your time?
              </span>
            </h2>

            <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12 max-w-2xl leading-relaxed">
              Stop wasting time on task management. TaskFlow uses AI to automate scheduling, prioritization, and reminders - so you can focus on what actually matters.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">
                  Why Choose TaskFlow
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {benefits.map((benefit, idx) => (
                    <BenefitItem key={idx} text={benefit} index={idx} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-4 sm:gap-6"
              >
                {stats.map((stat, idx) => (
                  <StatCard key={idx} {...stat} />
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6"
            >
              <Link href="/sign-up" className="flex-1 sm:flex-none">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'w-full sm:w-auto px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl',
                    'bg-white text-dark-background',
                    'font-bold text-base sm:text-lg',
                    'shadow-lg hover:shadow-xl',
                    'transition-all duration-300',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  <span>Start Free Today</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl',
                  'border-2 border-purple-500/30 hover:border-purple-500/60',
                  'bg-white/5 hover:bg-white/10 backdrop-blur-md',
                  'text-purple-300 hover:text-purple-200 font-bold text-base sm:text-lg',
                  'transition-all duration-300'
                )}
              >
                Schedule a Demo
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-purple-500/20"
            >
              <p className="text-gray-400 text-xs sm:text-sm text-center mb-4 sm:mb-6">
                Trusted by teams and individuals worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs sm:text-sm">4.9/5 Rating</span>
                </div>
                <span className="text-gray-500 text-xs hidden sm:block">|</span>
                <span className="text-gray-400 text-xs sm:text-sm">50k+ downloads</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
