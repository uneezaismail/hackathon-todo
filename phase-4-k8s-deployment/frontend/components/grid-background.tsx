// 'use client'

// interface GridBackgroundProps {
//   className?: string
//   gridSize?: number
//   lineColor?: string
//   lineOpacity?: number
// }

// export function GridBackground({
//   className = '',
//   gridSize = 40,
//   lineColor = '#A855F7',
//   lineOpacity = 0.15,
// }: GridBackgroundProps) {
//   return (
//     <div className={`absolute inset-0 ${className}`}>
//       <svg
//         className="h-full w-full"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <defs>
//           <pattern
//             id="grid-pattern"
//             width={gridSize}
//             height={gridSize}
//             patternUnits="userSpaceOnUse"
//           >
//             {/* Vertical line */}
//             <path
//               d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
//               fill="none"
//               stroke={lineColor}
//               strokeOpacity={lineOpacity}
//               strokeWidth="1"
//             />
//           </pattern>
//         </defs>
//         <rect width="100%" height="100%" fill="url(#grid-pattern)" />
//       </svg>
//     </div>
//   )
// }
