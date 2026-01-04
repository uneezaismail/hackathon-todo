// 'use client'

// import * as React from 'react'
// import { Rocket, CheckCircle2, TrendingUp } from 'lucide-react'
// import { cn } from '@/lib/utils'

// interface Step {
//   icon: React.ComponentType<{ className?: string }>
//   title: string
//   description: string
//   iconColor: string
//   iconBg: string
// }

// const steps: Step[] = [
//   {
//     icon: Rocket,
//     title: '1. Create Account',
//     description: 'Sign up in seconds with secure authentication. Your personal workspace is ready instantly.',
//     iconColor: 'text-brand-cyan',
//     iconBg: 'bg-brand-cyan/20',
//   },
//   {
//     icon: CheckCircle2,
//     title: '2. Add Your Tasks',
//     description: 'Create tasks with titles, descriptions, priorities, tags, and due dates. Organize your way.',
//     iconColor: 'text-brand-purple',
//     iconBg: 'bg-brand-purple/20',
//   },
//   {
//     icon: TrendingUp,
//     title: '3. Stay Productive',
//     description: 'Filter by status, search by keyword, sort by priority or deadline. Complete more, stress less.',
//     iconColor: 'text-brand-magenta',
//     iconBg: 'bg-brand-magenta/20',
//   },
// ]

// interface HowItWorksProps {
//   className?: string
// }

// export function HowItWorks({ className }: HowItWorksProps) {
//   return (
//     <section
//       id="how-it-works"
//       className={cn(
//         'relative py-20 md:py-32',
//         'bg-[#0b1121] border-t border-white/5',
//         className
//       )}
//     >
//       {/* Decorative top accent line */}
//       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-linear-to-r from-transparent via-[#00d4b8] to-transparent" />

//       <div className="container mx-auto px-4">
//         {/* Section Header */}
//         <div className="mb-16 text-center">
//           <h2
//             className="mb-4 text-4xl font-bold text-white md:text-5xl"
//             style={{
//               textShadow: '0 0 30px rgba(0, 229, 204, 0.3)',
//             }}
//           >
//             How It Works
//           </h2>
//         </div>

//         {/* Steps Grid */}
//         <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
//           {steps.map((step, index) => {
//             const Icon = step.icon
//             const borderColors = [
//               { base: 'border-[#00d4b8]/30', hover: 'hover:border-[#00d4b8]/80', glow: 'bg-[#00d4b8]' },
//               { base: 'border-[#8b5cf6]/30', hover: 'hover:border-[#8b5cf6]/80', glow: 'bg-[#8b5cf6]' },
//               { base: 'border-[#ec4899]/30', hover: 'hover:border-[#ec4899]/80', glow: 'bg-[#ec4899]' }
//             ]
//             const colors = borderColors[index]

//             return (
//               <div
//                 key={index}
//                 className={cn(
//                   'group relative rounded-2xl p-10',
//                   'border-2 bg-[#131929]/90',
//                   'backdrop-blur-md transition-all duration-500',
//                   'hover:bg-[#1a2332]/95',
//                   'hover:shadow-[0_0_50px_rgba(0,212,184,0.3)]',
//                   'hover:-translate-y-2',
//                   'text-center',
//                   'overflow-hidden',
//                   colors.base,
//                   colors.hover
//                 )}
//               >
//                 {/* Animated gradient border on hover */}
//                 <div className={cn(
//                   'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100',
//                   'bg-linear-to-br p-0.5',
//                   index === 0 && 'from-[#00d4b8] via-[#00d4b8]/50 to-transparent',
//                   index === 1 && 'from-[#8b5cf6] via-[#8b5cf6]/50 to-transparent',
//                   index === 2 && 'from-[#ec4899] via-[#ec4899]/50 to-transparent'
//                 )}>
//                   <div className="h-full w-full rounded-2xl bg-[#1a2332]/95" />
//                 </div>

//                 {/* Top corner decorative gradient */}
//                 {/* <div className="absolute top-0 left-0 w-24 h-24 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
//                   <div className={cn(
//                     'absolute top-0 left-0 w-full h-full',
//                     'bg-gradient-to-br rounded-2xl to-transparent',
//                     index === 0 && 'from-[#00d4b8]/30',
//                     index === 1 && 'from-[#8b5cf6]/30',
//                     index === 2 && 'from-[#ec4899]/30'
//                   )} />
//                 </div> */}

//                 {/* Step number badge */}
//                 <div className="absolute top-4 right-4 z-10">
//                   <div className={cn(
//                     'flex h-10 w-10 items-center justify-center rounded-full',
//                     'border transition-all duration-500',
//                     'text-sm font-bold',
//                     'group-hover:scale-110',
//                     index === 0 && 'border-[#00d4b8]/30 bg-[#00d4b8]/10 text-[#00d4b8] group-hover:border-[#00d4b8]/60 group-hover:shadow-[0_0_15px_rgba(0,212,184,0.4)]',
//                     index === 1 && 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#8b5cf6] group-hover:border-[#8b5cf6]/60 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]',
//                     index === 2 && 'border-[#ec4899]/30 bg-[#ec4899]/10 text-[#ec4899] group-hover:border-[#ec4899]/60 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]'
//                   )}>
//                     {index + 1}
//                   </div>
//                 </div>

//                 {/* Subtle inner glow on hover */}
//                 <div className={cn(
//                   'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100',
//                   'bg-linear-to-br to-transparent',
//                   index === 0 && 'from-[#00d4b8]/10 via-[#00d4b8]/5',
//                   index === 1 && 'from-[#8b5cf6]/10 via-[#8b5cf6]/5',
//                   index === 2 && 'from-[#ec4899]/10 via-[#ec4899]/5'
//                 )} />

//                 {/* Icon with enhanced design */}
//                 <div className="relative z-10 mb-6 flex justify-center">
//                   <div className="relative inline-block">
//                     {/* Icon outer glow */}
//                     <div className={cn(
//                       'absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-all duration-500',
//                       index === 0 && 'bg-[#00d4b8]/50',
//                       index === 1 && 'bg-[#8b5cf6]/50',
//                       index === 2 && 'bg-[#ec4899]/50'
//                     )} />

//                     {/* Rotating border ring */}
//                     <div className={cn(
//                       'absolute inset-0 rounded-full opacity-0 group-hover:opacity-100',
//                       'transition-all duration-700',
//                       'animate-rotate-slow'
//                     )}>
//                       <div className={cn(
//                         'h-full w-full rounded-full border-2 border-dashed',
//                         index === 0 && 'border-[#00d4b8]/40',
//                         index === 1 && 'border-[#8b5cf6]/40',
//                         index === 2 && 'border-[#ec4899]/40'
//                       )} />
//                     </div>

//                     <div
//                       className={cn(
//                         'relative flex h-24 w-24 items-center justify-center rounded-full',
//                         'border-2 transition-all duration-500',
//                         'shadow-lg group-hover:shadow-2xl',
//                         'group-hover:scale-110',
//                         step.iconBg,
//                         index === 0 && 'border-[#00d4b8]/20 group-hover:border-[#00d4b8]/60',
//                         index === 1 && 'border-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/60',
//                         index === 2 && 'border-[#ec4899]/20 group-hover:border-[#ec4899]/60'
//                       )}
//                     >
//                       {/* Inner gradient pulse */}
//                       <div className={cn(
//                         'absolute inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500',
//                         'bg-linear-to-br',
//                         index === 0 && 'from-[#00d4b8]/30',
//                         index === 1 && 'from-[#8b5cf6]/30',
//                         index === 2 && 'from-[#ec4899]/30',
//                         'to-transparent'
//                       )} />

//                       <Icon className={cn(
//                         'h-12 w-12 relative z-10 transition-all duration-500',
//                         'group-hover:scale-110',
//                         step.iconColor
//                       )} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="relative z-10">
//                   <h3 className="mb-3 text-xl font-semibold text-white transition-colors duration-300 group-hover:text-white">
//                     {step.title}
//                   </h3>
//                   <p className="text-white/70 leading-relaxed group-hover:text-white/80 transition-colors duration-300">
//                     {step.description}
//                   </p>
//                 </div>

//                 {/* Step connector line (enhanced) */}
//                 {index < steps.length - 1 && (
//                   <div className="absolute right-0 top-1/2 hidden w-8 -translate-y-1/2 translate-x-full md:block z-20">
//                     <div className={cn(
//                       'h-0.5 w-full bg-linear-to-r to-transparent transition-all duration-500',
//                       'group-hover:h-1',
//                       index === 0 && 'from-[#00d4b8]/40 group-hover:from-[#00d4b8]/80 group-hover:shadow-[0_0_10px_rgba(0,212,184,0.6)]',
//                       index === 1 && 'from-[#8b5cf6]/40 group-hover:from-[#8b5cf6]/80 group-hover:shadow-[0_0_10px_rgba(139,92,246,0.6)]'
//                     )} />
//                   </div>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     </section>
//   )
// }
