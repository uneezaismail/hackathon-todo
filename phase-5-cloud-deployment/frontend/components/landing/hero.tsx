// 'use client'

// import * as React from 'react'
// import Link from 'next/link'
// import { ArrowRight, Sparkles } from 'lucide-react'
// import { useSession } from '@/lib/auth-client'
// import { Button } from '@/components/ui/button'
// import { cn } from '@/lib/utils'

// interface HeroProps {
//   className?: string
// }

// export function Hero({ className }: HeroProps) {
//   const { data: session, isPending } = useSession()
//   const isAuthenticated = !isPending && session?.user

//   return (
//     <section className={cn('relative min-h-screen pt-16', className)}>
//       {/* Light purple/magenta glow in bottom-right corner */}
//       <div className="absolute bottom-0 right-0 w-100 h-100 pointer-events-none">
//         <div className="absolute inset-0 bg-linear-to-tl from-[#8b5cf6]/10 via-[#8b5cf6]/5 to-transparent rounded-full blur-3xl" />
//         <div className="absolute inset-0 bg-linear-to-tl from-[#ec4899]/8 via-transparent to-transparent rounded-full blur-3xl" />
//       </div>

//       {/* Hero Content */}
//       <div className="container relative z-10 mx-auto px-4">
//         <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
//           {/* Badge */}
//           <div className="mb-6 animate-fade-in">
//             <div
//               className={cn(
//                 'inline-flex items-center gap-2 rounded-full px-4 py-2',
//                 'border border-[#00d4b8] bg-[#1a3a4a]/60',
//                 'text-sm text-[#00d4b8]',
//                 'backdrop-blur-sm',
//                 'transition-all duration-300'
//               )}
//             >
//               <Sparkles className="h-3.5 w-3.5" />
//               Organize • Prioritize • Accomplish
//             </div>
//           </div>

//           {/* Main Heading */}
//           <h1
//             className={cn(
//               'mb-6 max-w-4xl text-5xl font-bold leading-tight text-white',
//               'md:text-6xl lg:text-7xl',
//               'animate-fade-in',
//               '[animation-delay:100ms]'
//             )}
//             style={{
//               textShadow: '0 0 30px rgba(0, 229, 204, 0.3)',
//             }}
//           >
//             Master Your Tasks,
//             <br />
//             Achieve Your Goals
//           </h1>

//           {/* Subheading */}
//           <p
//             className={cn(
//               'mb-10 max-w-2xl text-lg text-white/70',
//               'md:text-xl',
//               'animate-fade-in',
//               '[animation-delay:200ms]'
//             )}
//           >
//             Take control of your workday with intelligent task management.
//             Organize projects with priorities and tags, track deadlines, and stay focused on what matters most.
//           </p>

//           {/* CTA Buttons */}
//           <div
//             className={cn(
//               'flex flex-col items-center gap-4 sm:flex-row',
//               'animate-fade-in',
//               '[animation-delay:300ms]'
//             )}
//           >
//             <Link href={isAuthenticated ? '/dashboard' : '/sign-up'}>
//               <Button
//                 size="lg"
//                 className={cn(
//                   'group relative h-12 bg-[#00d4b8] px-8 text-base font-semibold text-[#0f1729]',
//                   'hover:bg-[#00e5cc] hover:shadow-[0_0_25px_rgba(0,212,184,0.6)]',
//                   'transition-all duration-300 rounded-lg',
//                   'active:scale-95'
//                 )}
//               >
//                 Get Started Now
//                 <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-[#0f1729]/30">
//                   <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
//                 </div>
//               </Button>
//             </Link>
//             <Link href="#features">
//               <Button
//                 size="lg"
//                 variant="outline"
//                 className={cn(
//                   'h-12 border-2 border-[#00d4b8] bg-transparent px-8 text-base font-semibold text-[#00d4b8]',
//                   'hover:bg-[#00d4b8]/10 hover:shadow-[0_0_15px_rgba(0,212,184,0.3)]',
//                   'transition-all duration-300 rounded-lg',
//                   'active:scale-95'
//                 )}
//               >
//                 See Features
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }
