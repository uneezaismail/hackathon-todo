'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function ProductMockup() {
  return (
    <>
      {/* Product Mockup Section - Half visible in hero - Only show on large screens */}
      <section className="hidden lg:block container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 lg:-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Glow Effects - More at top - Responsive sizing */}
          <div className="absolute -top-8 sm:-top-16 lg:-top-20 left-1/2 -translate-x-1/2 w-[250px] sm:w-[450px] lg:w-[600px] h-[120px] sm:h-[225px] lg:h-[300px] bg-purple-500/20 blur-3xl -z-10" />
          <div className="hidden sm:block absolute top-0 left-[10%] w-[200px] lg:w-[300px] h-[150px] lg:h-[200px] bg-purple-600/10 blur-3xl -z-10" />
          <div className="hidden sm:block absolute top-0 right-[10%] w-[200px] lg:w-[300px] h-[150px] lg:h-[200px] bg-purple-600/10 blur-3xl -z-10" />

          {/* Mockup Container - Responsive sizing and padding */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-0.5 sm:p-1 shadow-2xl shadow-purple-500/20">
            <div className="relative rounded-lg sm:rounded-xl bg-dark-background/90 backdrop-blur-xl overflow-hidden w-full min-h-[350px] sm:min-h-[450px] lg:min-h-[600px]">
              {/* Dashboard Screenshot - Full visible */}
              <Image
                src="/hero-dashboard.png"
                alt="TaskFlow AI Dashboard"
                width={1600}
                height={900}
                className="w-full h-full object-cover object-top"
                quality={95}
                priority
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Extra spacing after mockup - Only on large screens */}
      <div className="hidden lg:block h-28" />
    </>
  )
}
