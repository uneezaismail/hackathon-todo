'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  href: string
  popular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Up to 50 tasks',
      'Basic task management',
      'Mobile app access',
      'Email support',
      'Standard dashboard',
    ],
    cta: 'Get Started',
    href: '/sign-up',
  },
  {
    name: 'Pro',
    price: '$9',
    description: 'Best for individuals and teams',
    features: [
      'Unlimited tasks',
      'AI-powered task suggestions',
      'Recurring tasks & calendar',
      'Priority email & chat support',
      'Advanced analytics & insights',
      'Task automation',
      'Custom tags and priorities',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced security',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/sign-up',
  },
]

export function PricingSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section id="pricing" className="relative py-16 sm:py-20 lg:py-28 bg-dark-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan for your productivity needs. All plans include our core task management features.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 sm:gap-8"
        >
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={`relative group ${tier.popular ? 'md:scale-105' : ''}`}
            >
              {/* Glow effect for popular card */}
              {tier.popular && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-300 -z-10" />
              )}

              {/* Card */}
              <div
                className={`relative h-full rounded-2xl border transition-all duration-300 p-8 flex flex-col ${
                  tier.popular
                    ? 'bg-gradient-to-b from-purple-500/10 to-transparent border-purple-500/40'
                    : 'bg-white/5 border-purple-500/10 hover:border-purple-500/20'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-400 shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.price !== 'Free' && tier.price !== 'Custom' && (
                    <span className="text-gray-400 ml-2">/month</span>
                  )}
                </div>

                {/* CTA Button */}
                <Link href={tier.href} className="mb-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      tier.popular
                        ? 'bg-white text-dark-background hover:shadow-xl hover:shadow-purple-500/20'
                        : 'bg-purple-500/20 text-white border border-purple-500/30 hover:bg-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    {tier.cta}
                  </motion.button>
                </Link>

                {/* Features List */}
                <div className="space-y-4 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-gray-500 text-sm mt-12 sm:mt-16"
        >
          All plans include a 7-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  )
}
