/**
 * Custom 404 Not Found Page
 *
 * Professional 404 page matching the website's purple theme
 * Features animated background, responsive design, and modern UX
 * Follows industry best practices with clear navigation options
 */

'use client'

import { motion } from 'framer-motion'
import { Home, ArrowRight, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { GridBackground3D } from '@/components/grid-background-3d'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-background relative overflow-hidden flex flex-col">
      {/* 3D Grid Background - same as landing page */}
      <GridBackground3D className="opacity-50" />

      {/* Gradient overlays for visual depth */}
      <div className="absolute inset-0 bg-linear-to-b from-purple-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Top glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* 404 Number - Large and prominent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative mb-8"
            >
              {/* Glow effect behind 404 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[180px] sm:text-[250px] lg:text-[300px] font-bold text-purple-500/10 blur-3xl select-none">
                  404
                </div>
              </div>

              {/* Main 404 text with gradient */}
              <div className="relative">
                <h1 className="text-[120px] sm:text-[180px] lg:text-[220px] font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-br from-purple-400 via-purple-500 to-purple-600 leading-none select-none">
                  404
                </h1>
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
              </p>
            </motion.div>

            {/* Helpful Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl bg-white text-dark-background font-semibold shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto justify-center"
                  >
                    <Home className="h-5 w-5" />
                    <span>Go Home</span>
                  </motion.button>
                </Link>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="group px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl bg-white/5 text-white font-semibold border border-purple-500/30 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto justify-center"
                >
                  <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Refresh Page</span>
                </motion.button>
              </div>

              {/* Secondary Options */}
              <div className="pt-8 border-t border-purple-500/20">
                <p className="text-gray-500 text-sm mb-4">Or try these options:</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500/10 text-purple-300 font-medium border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 text-sm sm:text-base"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/sign-in"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-500/10 text-purple-300 font-medium border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-300 text-sm sm:text-base"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md px-4 py-2 text-xs sm:text-sm text-gray-400 border border-purple-500/10">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                <span>Need help? Check our navigation or search for what you&apos;re looking for</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-dark-background via-dark-background/95 to-transparent pointer-events-none" />
    </div>
  )
}
