'use client'

import { motion } from 'framer-motion'
import { GridBackground3D } from '@/components/grid-background-3d'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden bg-dark-background pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 lg:pb-24">
      {/* Grid Background - stays behind all content */}
      <GridBackground3D />

      {/* Hero Content - positioned above grid */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-purple-300 border border-purple-500/20 mb-4 sm:mb-6"
        >
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
          <span className="whitespace-nowrap">AI-Powered Task Management</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight px-2 text-white"
        >
          <span className="block mb-1 sm:mb-2">
            Make Task
          </span>
          <span className="block">
            Management Effortless
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-gray-400 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4"
        >
          AI-powered productivity. Natural language commands. Zero busywork.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center"
        >
          <Link href="/sign-up">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl bg-white text-dark-background font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 text-base sm:text-lg"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
