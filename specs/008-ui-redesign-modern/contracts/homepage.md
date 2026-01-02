# Landing Page Contract

**Component**: Landing Page (Multi-Section Modern Design)
**Version**: 1.0.0
**Status**: Implemented
**Date**: 2025-12-31

## Landing Page Sections

### 1. Hero Section
**Component**: `HeroSection`
**Location**: `components/landing/hero-section.tsx`

**Features**:
- Badge with "AI-Powered Task Management" text
- Large gradient heading: "Make Task Management Effortless"
- Subtitle: "AI-powered productivity. Natural language commands. Zero busywork."
- Primary CTA button linking to `/sign-up`
- 3D perspective grid background with pincushion distortion
- Framer Motion staggered animations

**Props**:
```typescript
interface HeroSectionProps {
  // No props - static content
}
```

### 2. Product Mockup Section
**Component**: Inline in `app/page.tsx`

**Features**:
- Product screenshot placeholder with glow effects
- Positioned -mt-12 to overlap with hero
- Purple glow effects around container
- Glassmorphic card with border
- Responsive sizing (300px mobile → 600px desktop height)

### 3. Features Section
**Component**: `FeaturesSection`
**Location**: `components/landing/features-section.tsx`

**Features**:
- Grid layout of feature cards (1 col mobile → 2 col tablet → 3 col desktop)
- Glassmorphism effects on cards
- Icons with gradient backgrounds
- Hover animations (scale 1.02x)
- Each feature has: icon, title, description

**Example Features**:
- AI Task Assistant
- Smart Scheduling
- Analytics Dashboard
- Natural Language
- Collaboration Tools
- Seamless Integration

### 4. How It Works Section
**Component**: `HowItWorksSection`
**Location**: `components/landing/how-it-works-section.tsx`

**Features**:
- 3-step process visualization
- Steps: "Chat & Create" → "Plan & Organize" → "Track & Improve"
- Numbered badges for each step
- Visual showcase grid
- Clear progression indicators

**Step Structure**:
```typescript
interface Step {
  number: number;      // 1, 2, 3
  title: string;       // e.g., "Chat & Create"
  description: string;
  icon?: React.ReactNode;
}
```

### 5. CTA Section
**Component**: `CTASection`
**Location**: `components/landing/cta-section.tsx`

**Features**:
- Benefits list with checkmarks
- Dual CTA buttons:
  - Primary: White background (Get Started Free)
  - Secondary: Purple outline (Learn More)
- Social proof and engagement incentives
- Final conversion push

### 6. Header & Footer
**Components**: `LandingHeader`, `LandingFooter`
**Locations**: `components/layout/landing-header.tsx`, `components/layout/landing-footer.tsx`

**Header Features**:
- Logo/brand name
- Navigation links
- Theme toggle
- Sign In / Sign Up buttons

**Footer Features**:
- Links to important pages
- Social media icons
- Copyright information
- Additional navigation

## Data Contracts

### Landing Page Props
```typescript
interface LandingPageProps {
  theme: "light" | "dark";
}
```

### Feature Card
```typescript
interface FeatureCard {
  icon: React.ReactNode;         // Lucide icon component
  title: string;                 // Feature title (max 50 chars)
  description: string;           // Feature description (max 150 chars)
}
```

### How It Works Step
```typescript
interface HowItWorksStep {
  number: number;                // Step number (1, 2, 3)
  title: string;                 // Step title
  description: string;           // Step description
  badge?: string;                // Optional badge text
}
```

### CTA Button
```typescript
interface CTAButton {
  text: string;                  // Button text
  href: string;                  // Link destination
  variant: "primary" | "secondary";
  icon?: React.ReactNode;        // Optional icon
}
```

## Component Props

### LandingHeaderProps
```typescript
interface LandingHeaderProps {
  // No props - uses theme context
}
```

### HeroSectionProps
```typescript
interface HeroSectionProps {
  // No props - static content with animations
}
```

### FeaturesSectionProps
```typescript
interface FeaturesSectionProps {
  // No props - static feature list
}
```

### HowItWorksSectionProps
```typescript
interface HowItWorksSectionProps {
  // No props - static 3-step process
}
```

### CTASectionProps
```typescript
interface CTASectionProps {
  // No props - static CTA content
}
```

## State Requirements

### Hero Section
1. Badge animates in first (fade + slide from y:20, duration 600ms)
2. Heading follows with 100ms stagger delay
3. Subtitle follows with 200ms stagger delay
4. CTA button appears last with 300ms stagger delay
5. 3D grid background renders on mount with pincushion distortion
6. All animations respect `prefers-reduced-motion` media query

### Product Mockup Section
1. Mockup card animates in with fade + slide from y:60 (duration 800ms, delay 500ms)
2. Purple glow effects visible around container
3. Glassmorphic border and backdrop blur applied
4. Responsive sizing based on viewport

### Features Section
1. Feature cards load with staggered fade-in
2. Each card has hover effect (scale 1.02x with 300ms transition)
3. Glassmorphism effects applied to all cards
4. Icons display with gradient backgrounds
5. Grid layout adapts to viewport (1/2/3 columns)

### How It Works Section
1. Step cards display with numbered badges
2. Process flow shows clear progression
3. Visual showcase grid integrated
4. Responsive layout for mobile/tablet/desktop

### CTA Section
1. Benefits list displays with checkmarks
2. Dual CTA buttons with hover effects
3. Primary button: white background with shadow
4. Secondary button: purple outline
5. All interactive elements accessible via keyboard

### Theme Switching
1. Theme switch completes in <500ms
2. No layout shift during theme transition
3. All colors transition smoothly with CSS transitions
4. Grid background updates color (rgba purple values)

## Events

### Component Events
```typescript
interface LandingPageEvents {
  onCTAClick: (buttonType: "primary" | "secondary") => void;
  onThemeToggle: (theme: "light" | "dark") => void;
  onNavigate: (path: string) => void;
}
```

### System Events
```typescript
type LandingPageEvent =
  | { type: "PAGE_LOADED"; payload: { timestamp: string } }
  | { type: "CTA_CLICKED"; payload: { button: "primary" | "secondary"; href: string } }
  | { type: "THEME_CHANGED"; payload: { theme: "light" | "dark" } }
  | { type: "NAVIGATION_CLICKED"; payload: { path: string } };
```

## Animation Specifications

### Framer Motion Variants
```typescript
// Hero Section - Badge
const badgeVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

// Hero Section - Heading
const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 }
  }
};

// Hero Section - Subtitle
const subtitleVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.2 }
  }
};

// Hero Section - CTA Button
const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.3 }
  }
};

// Product Mockup
const mockupVariants = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.5 }
  }
};

// Hover effect for buttons and cards
const hoverVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.3 }
  },
  tap: {
    scale: 0.98
  }
};
```

## Accessibility Requirements

1. **Keyboard Navigation**: All interactive elements (CTA, widgets) must be keyboard accessible
2. **ARIA Labels**: Dashboard widgets must have descriptive aria-label attributes
3. **Screen Readers**: Stat values must announce with proper context (e.g., "127 total tasks, up 12.5%")
4. **Color Contrast**: All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
5. **Focus States**: All focusable elements must have visible focus rings (2px purple glow)
6. **Motion**: Respect `prefers-reduced-motion` media query (disable animations if set)

## Performance Requirements

1. **Initial Load**: Landing page must load in <3s (all sections)
2. **Section Rendering**: Each section must render in <200ms
3. **Animation FPS**: All animations must maintain 60fps
4. **Theme Switch**: Theme transition must complete in <500ms
5. **Grid Background**: Canvas must render within 100ms of component mount
6. **Image Loading**: Product mockup placeholder should appear immediately
7. **Smooth Scrolling**: Page scroll must be smooth at 60fps

## Validation Rules

### Feature Card
- `title`: 1-50 characters, required
- `description`: 1-150 characters, required
- `icon`: Valid React component, required

### How It Works Step
- `number`: 1, 2, or 3, required
- `title`: 1-50 characters, required
- `description`: 1-200 characters, required

### CTA Button
- `text`: 1-30 characters, required
- `href`: Valid URL path starting with "/" or "http", required
- `variant`: Must be "primary" or "secondary", required
