// 'use client'

// import { useEffect, useState } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import Image from 'next/image'

// export function InitialLoader() {
//   const [isVisible, setIsVisible] = useState(true)

//   useEffect(() => {
//     // Hide loader after 2.5 seconds
//     const timer = setTimeout(() => {
//       setIsVisible(false)
//     }, 2500)

//     return () => clearTimeout(timer)
//   }, [])

//   return (
//     <AnimatePresence>
//       {isVisible && (
//         <motion.div
//           initial={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.5 }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-dark-background"
//         >
//           {/* Animated Grid Background */}
//           <div className="absolute inset-0 grid-background opacity-30" />

//           {/* Pulse Ring Animation */}
//           <div className="relative flex items-center justify-center">
//             {/* Outer Ring (largest pulse) */}
//             <motion.div
//               className="absolute h-48 w-48 rounded-full border-2 border-dark-purpleMedium"
//               animate={{
//                 scale: [1, 1.2],
//                 opacity: [0.6, 0],
//               }}
//               transition={{
//                 duration: 1.5,
//                 repeat: Infinity,
//                 ease: 'easeOut',
//               }}
//             />

//             {/* Middle Ring */}
//             <motion.div
//               className="absolute h-40 w-40 rounded-full border-2 border-dark-purpleLight"
//               animate={{
//                 scale: [1, 1.15],
//                 opacity: [0.7, 0],
//               }}
//               transition={{
//                 duration: 1.5,
//                 repeat: Infinity,
//                 ease: 'easeOut',
//                 delay: 0.2,
//               }}
//             />

//             {/* Inner Ring */}
//             <motion.div
//               className="absolute h-32 w-32 rounded-full border-2 border-dark-purpleDark"
//               animate={{
//                 scale: [1, 1.1],
//                 opacity: [0.8, 0],
//               }}
//               transition={{
//                 duration: 1.5,
//                 repeat: Infinity,
//                 ease: 'easeOut',
//                 delay: 0.4,
//               }}
//             />

//             {/* Logo Container with Reveal Animation */}
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{
//                 duration: 0.6,
//                 ease: 'easeOut',
//                 delay: 0.3,
//               }}
//               className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-dark-purpleLight/20 to-dark-purpleDark/20 backdrop-blur-sm"
//             >
//               <Image
//                 src="/logo.svg"
//                 alt="Taskio"
//                 width={64}
//                 height={64}
//                 className="drop-shadow-2xl"
//                 priority
//               />
//             </motion.div>

//             {/* Brand Name */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{
//                 duration: 0.6,
//                 ease: 'easeOut',
//                 delay: 0.8,
//               }}
//               className="absolute -bottom-16 text-center"
//             >
//               <h1 className="bg-gradient-primary bg-clip-text text-2xl font-bold text-transparent">
//                 Taskio
//               </h1>
//               <p className="mt-1 text-sm text-dark-text-muted">
//                 AI-Powered Task Management
//               </p>
//             </motion.div>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   )
// }
