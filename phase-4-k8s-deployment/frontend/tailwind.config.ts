import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Design system colors from template
        brand: {
          navy: '#0A0A1F',
          'navy-light': '#141428',
          'navy-lighter': '#1A1A32',
          purple: '#A855F7',
          'purple-light': '#C084FC',
          'purple-dark': '#8B5CF6',
          magenta: '#ec4899',
          'magenta-light': '#f472b6',
        },
        // Modern UI Redesign - EXACT colors from dark-lavander.png
        light: {
          background: '#FFFFFF',
          foreground: '#1F2937',
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E5E7EB',
          primary: '#7C3AED',
          secondary: '#C4B5FD',
          accent: '#A855F7',
          text: {
            primary: '#1F2937',
            secondary: '#475569',
            muted: '#64748B',
          },
        },
        // Dark Mode (Regulatis AI Dashboard 2025) - EXACT from dark-lavander.png
        dark: {
          background: '#0A0A1F',      // Main background (dark navy/purple)
          card: '#141428',            // Card/widget backgrounds (dark blue-grey)
          elevated: '#1A1A32',        // Elevated elements
          muted: '#1E293B',           // Muted backgrounds
          border: 'rgba(168, 85, 247, 0.2)',  // Semi-transparent purple borders
          borderSubtle: 'rgba(255, 255, 255, 0.05)',  // Very subtle white borders
          purpleLight: '#8B5CF6',     // Light purple for accents
          purpleMedium: '#A855F7',    // Medium purple (primary)
          purpleDark: '#C084FC',      // Darker purple for highlights
          primary: '#A855F7',
          secondary: '#C4B5FD',
          accent: '#A855F7',
          text: {
            primary: '#FFFFFF',
            secondary: '#E0E7FF',     // Light purple tint
            muted: '#94A3B8',
          },
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #0A0A1F 0%, #141428 30%, #1A1A32 60%, #2d1b4e 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #A855F7 0%, #ec4899 100%)',
        // Modern UI Redesign gradients (Regulatis style)
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)',
        'gradient-hero': 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        // Modern UI Redesign animations
        'pulse-ring': {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '50%': { transform: 'scale(1.1)', opacity: '0.3' },
          '100%': { transform: 'scale(1.2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.6s ease-out',
        'slide-in-left': 'slide-in-left 0.6s ease-out',
        // Modern UI Redesign animations
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
