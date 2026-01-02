# Data Model: Modern UI Redesign with Dual-Theme Support

**Feature**: Modern UI Redesign with Dual-Theme Support (008-ui-redesign-modern)
**Date**: 2025-12-31
**Phase**: 1 - Design System Definition
**Updated**: 2025-12-31 (Added Dashboard Widget entities)

---

## Core Entities

### Theme

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Unique theme identifier ("light", "dark") | Must be "light" or "dark" |
| userId | string | User's theme preference | Required |
| createdAt | timestamp | When theme was last set | Auto-generated |
| colorPalette | json | Theme-specific colors (backgrounds, purples, borders, text) | Required |

**State Transitions**: `light` ↔ `dark` via smooth 300ms transition

**Color Palettes**:
- Light: { background: "#FFFFFF", card: "#FFFFFF", primary: "#7C3AED", ... }
- Dark: { background: "#0A0A1F", card: "#141428", purpleLight: "#8B5CF6", purpleMedium: "#A855F7", purpleDark: "#C084FC", borderGlass: "rgba(168, 85, 247, 0.2)", ... }

---

### Dashboard Widget

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Unique widget identifier | Auto-generated UUID |
| type | enum | "stat" | "chart" | "activity" | "list" | Required |
| title | string | Widget title | Max 50 chars |
| data | json | Widget-specific data | Required |
| position | object | Grid position {row, col, width, height} | Optional |
| refreshRate | number | Auto-refresh interval (seconds) | Min 30s, optional |

**Widget Types**:
- `stat`: Stat card with number, label, trend indicator
- `chart`: Interactive chart (area, bar, line, pie)
- `activity`: Recent activity feed
- `list`: Task list or data table

**Example Data Structures**:

```typescript
// Stat Widget
{
  type: "stat",
  data: {
    value: 127,
    label: "Total Tasks",
    trend: { direction: "up", value: "+12.5%" },
    icon: "CheckCircle"
  }
}

// Chart Widget
{
  type: "chart",
  data: {
    chartType: "area",
    dataset: [
      { month: "Jan", tasks: 45 },
      { month: "Feb", tasks: 62 },
      ...
    ],
    gradientColors: ["#8B5CF6", "#A855F7", "#C084FC"]
  }
}

// Activity Widget
{
  type: "activity",
  data: {
    items: [
      { user: "John", action: "completed", task: "Design mockups", timestamp: "2025-12-31T10:30:00Z" },
      ...
    ]
  }
}
```

---

### Landing Page Content

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Content identifier ("hero", "features", "how-it-works", "cta") | Required |
| heroText | string | Large gradient text | Max 100 chars |
| heroSubtitle | string | Supporting text below hero | Max 200 chars |
| ctaText | string | Call-to-action button text | Max 30 chars |
| ctaLink | string | CTA button destination | Valid URL path |
| features | array | Array of feature card objects | Min 3, max 6 |
| steps | array | Array of how-it-works step objects | Fixed: 3 |

**Hero Section**:
- Gradient text animation on load (fade+slide from y:20)
- 3D perspective grid background with pincushion distortion
- Animated subtitle with staggered delays
- CTA button with hover scale and shadow effects
- Product mockup card with glow effects positioned below hero

**Features Section**:
- Grid layout with feature cards
- Glassmorphism effects on cards
- Icons with gradient backgrounds
- Hover animations (scale 1.02x)

**How It Works Section**:
- 3-step process flow (Chat & Create → Plan & Organize → Track & Improve)
- Numbered step badges
- Visual showcase grid
- Clear progression indicators

**CTA Section**:
- Benefits list with checkmarks
- Dual CTA buttons (primary white, secondary purple outline)
- Social proof and engagement incentives

---

### Loading State

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Unique loading state identifier | Required |
| type | enum | "initial" | "skeleton" | "spinner" | "progress" | "error" | Required |
| percentage | number | Progress 0-100 | Range: 0-100 |
| contentTarget | string | What is being loaded (e.g., "dashboard", "tasks") | Optional |
| timestamp | timestamp | Last update time | Auto-generated |

**Types**:
- `initial`: App first load (2-3s branded loader)
- `skeleton`: Content area waiting for data
- `spinner`: Async operation in progress
- `progress`: Multi-step operation (e.g., saving)
- `error`: Failed operation with retry option

---

### UI Component State

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Component identifier | Required |
| componentType | enum | "button" | "card" | "modal" | "toast" | "input" | "nav" | Required |
| state | enum | "idle" | "hover" | "active" | "focus" | "disabled" | "loading" | Required |
| props | json | Component-specific data (variant, size, etc.) | Optional |

**Component Types**:
- `button`: Primary, secondary, outline, destructive
- `card`: Task card, analytics card, feature card
- `modal`: Login dialog, delete confirmation
- `toast`: Success, error, info notifications
- `input`: Text input, email, password
- `nav`: Dashboard, tasks, analytics, calendar
- `loading`: Skeleton, spinner overlay

**State Transitions**:
- Idle → Hover: Scale 1.02 over 300ms
- Hover → Active: Shadow-xl with purple-500/25 tint
- Active → Disabled: Scale 0.95 with reduced opacity
- Idle → Focus: Outline glow with 0.5s ease (2px ring)

---

### Brand Identity

| Property | Type | Description | Validation |
|-----------|------|-------------|------------|
| id | string | Brand identifier ("app-brand") | Auto-generated |
| name | string | Website/app name (e.g., "TaskFlow AI") | Max 50 chars, no spaces |
| logoPath | string | Path to logo file | Must be valid SVG |
| faviconPath | string | Path to favicon file | Must be valid SVG/PNG |
| primaryColor | string | Brand primary color (hex) | Valid hex (e.g., "#7C3AED") |
| accentColor | string | Brand accent color (hex) | Valid hex (e.g., "#A855F7") |

**Logo Requirements**:
- Scalable SVG format
- Works in both light and dark modes
- Minimum 16x16px, preferred 24x24px
- Maximum 512x512px

---

## Entity Relationships

```
┌──────────────┐
│   User (1:N)   │
└───────────────────┘
       │
       │ prefers
       ▼
┌──────────────┐
│    Theme (1:1)  │
└───────────────┘

┌─────────────────────────────────────┐
│         Theme                  │
└─────────────────────────────────────┘
         │
    applies to
         ▼
┌─────────────────────────────────────┐
│    UI Components (N:M)          │
└─────────────────────────────────────┘
         │
         have
         ▼
┌─────────────────────────────────────┐
│  Component State (N:1)          │
└─────────────────────────────────────┘
```

---

## Data Model Constraints

1. **Theme Performance**: All components must re-render theme changes within 300ms
2. **Animation Budget**: Total animations per page must not exceed 2 seconds
3. **Component Isolation**: Each component state must be independent
4. **Accessibility**: All states must support keyboard navigation and screen readers
5. **Responsive**: Components must adapt to mobile (<640px), tablet (640-1024px), desktop (1024px+)
