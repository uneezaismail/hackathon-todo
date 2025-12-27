# Phase 0: Research & Technology Decisions

**Feature**: Frontend Redesign For Todo App
**Date**: 2025-12-16
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Areas

### 1. Virtual Scrolling Implementation

**Decision**: Use `react-window` library for virtual scrolling

**Rationale**:
- **Performance**: Industry-standard solution proven to handle 10,000+ items at 60fps
- **React 19 Compatibility**: Fully compatible with Next.js 16 and React 19
- **Lightweight**: 6KB gzipped, minimal bundle impact
- **Flexibility**: Supports dynamic item heights (needed for variable-length task descriptions)
- **Maintenance**: Actively maintained by Brian Vaughn (React core team member)

**Alternatives Considered**:
1. `react-virtualized` - Older, heavier library (27KB), more features than needed
2. `@tanstack/react-virtual` - Modern alternative, but less proven in production at scale
3. Custom implementation - Would require significant development time and testing

**Implementation Notes**:
- Use `VariableSizeList` component to handle truncated vs. expanded task descriptions
- Integrate with filter state to re-render only visible filtered items
- Add loading skeleton for smooth UX during data fetch

**References**:
- react-window docs: https://react-window.vercel.app/
- Performance benchmark: https://github.com/bvaughn/react-window#how-is-react-window-different-from-react-virtualized

---

### 2. Glassmorphism Effect Implementation

**Decision**: Pure CSS implementation with Tailwind CSS utilities and custom classes

**Rationale**:
- **Performance**: CSS-only approach avoids JavaScript overhead, runs on GPU
- **Maintainability**: Tailwind utilities make it easy to adjust transparency, blur, and glow
- **Fallback Support**: Can detect `backdrop-filter` support via CSS `@supports` and provide solid background fallback
- **Bundle Size**: Zero additional JavaScript dependencies
- **Customization**: Easy to adjust blur radius, opacity, and border glow for cyberpunk aesthetic

**Alternatives Considered**:
1. React component library (e.g., `react-glassmorphism`) - Adds unnecessary dependency for simple CSS effect
2. Canvas-based implementation - Overkill, poor performance on mobile
3. SVG filters - Browser compatibility issues, harder to maintain

**Implementation Approach**:
```css
/* In globals.css or glassmorphism.css */
.glass-card {
  background: rgba(10, 14, 39, 0.15); /* midnight blue with 15% opacity */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* Safari support */
  border: 1px solid rgba(0, 255, 255, 0.2); /* neon cyan glow */
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.1), /* outer glow */
    inset 0 0 20px rgba(0, 255, 255, 0.05); /* inner glow */
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(12px)) {
  .glass-card {
    background: rgba(10, 14, 39, 0.95); /* nearly solid background */
  }
}
```

**Tailwind CSS Integration**:
- Use Tailwind's `backdrop-blur-lg` utility
- Custom `glass-card` component in `components/shared/glass-card.tsx`
- CSS variables for easy theme adjustments

**References**:
- Glassmorphism best practices: https://css-tricks.com/glassmorphism-css/
- Browser support: https://caniuse.com/css-backdrop-filter (96%+ modern browsers)

---

### 3. Landing Page Scroll Navigation Pattern

**Decision**: Intersection Observer API with smooth scroll behavior

**Rationale**:
- **Native**: Built into modern browsers, no dependencies required
- **Performance**: Runs on separate thread, doesn't block main thread
- **Accessibility**: Works with keyboard navigation and screen readers
- **SEO**: Preserves semantic HTML with anchor links
- **Smooth UX**: Native `scroll-behavior: smooth` CSS property for animations

**Alternatives Considered**:
1. `react-scroll` library - Unnecessary dependency for native browser capability
2. Manual scroll event listeners - Performance issues, deprecated approach
3. Framer Motion scroll animations - Overkill for basic navigation, adds bundle size

**Implementation Pattern**:
```typescript
// In scroll-navigation.tsx
const sections = ['hero', 'how-it-works', 'features', 'cta'];
const [activeSection, setActiveSection] = useState('hero');

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    { threshold: 0.5, rootMargin: '-50px 0px -50px 0px' }
  );

  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  });

  return () => observer.disconnect();
}, []);
```

**UX Enhancements**:
- Highlight active section in navigation
- Smooth scroll on navigation click: `element.scrollIntoView({ behavior: 'smooth' })`
- Mobile: Hamburger menu with same scroll behavior

**References**:
- MDN Intersection Observer: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- Smooth scroll polyfill (if needed): https://github.com/iamdustan/smoothscroll

---

### 4. Modal Dialog Implementation (Edit & Delete Confirmation)

**Decision**: Use Shadcn UI Dialog component with custom styling

**Rationale**:
- **Accessibility**: Built on Radix UI primitives with ARIA attributes, keyboard navigation
- **Consistency**: Matches existing Shadcn UI component library in project
- **Customization**: Easily styled with Tailwind CSS for futuristic theme
- **Focus Management**: Auto-focuses first input, traps focus within modal, returns focus on close
- **Zero Dependencies**: Shadcn UI copies component code into project (no runtime dependency)

**Alternatives Considered**:
1. `react-modal` - Requires additional dependency, less modern styling API
2. Custom implementation - Accessibility is hard to get right (ARIA, focus trap, ESC key handling)
3. Headless UI - Similar to Radix but Shadcn provides better integration with Tailwind

**Implementation Notes**:
- Two modal variants: `TaskFormDialog` (edit) and `DeleteConfirmationDialog`
- Apply glassmorphism effect to modal backdrop and content
- Neon cyan "Save"/"Delete" buttons, deep purple "Cancel" button
- Modal animations: fade-in backdrop, slide-up content (using Tailwind transitions)

**Shadcn CLI Command**:
```bash
npx shadcn@latest add dialog
```

**References**:
- Shadcn Dialog: https://ui.shadcn.com/docs/components/dialog
- Radix UI Dialog: https://www.radix-ui.com/primitives/docs/components/dialog

---

### 5. Responsive Design Breakpoints

**Decision**: Use Tailwind CSS default breakpoints with mobile-first approach

**Rationale**:
- **Industry Standard**: Tailwind breakpoints align with common device widths
- **Mobile-First**: Easier to enhance for larger screens than constrain for smaller
- **Flexibility**: Can override with custom breakpoints in `tailwind.config.ts` if needed
- **Consistency**: Matches existing project configuration

**Breakpoints**:
```javascript
// Tailwind CSS default breakpoints (defined in tailwind.config.ts)
{
  'sm': '640px',   // Tablet portrait
  'md': '768px',   // Tablet landscape
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px'  // Extra large desktop
}
```

**Application**:
- **320px-639px (Mobile)**: Stacked layout, single column, hamburger menu
- **640px-767px (Small Tablet)**: 2-column grid for task cards, collapsible nav
- **768px-1023px (Tablet)**: 3-column grid, side navigation appears
- **1024px+ (Desktop)**: 4-column grid, full side navigation, larger card sizes

**Component Strategy**:
- Use `hidden md:block` for desktop-only elements
- Use `md:hidden` for mobile-only elements
- Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` for responsive grids

**References**:
- Tailwind responsive design: https://tailwindcss.com/docs/responsive-design
- Mobile-first methodology: https://www.smashingmagazine.com/2020/06/mobile-first-typography/

---

### 6. Neon Glow Text Effect

**Decision**: CSS `text-shadow` with multiple shadows for layered glow

**Rationale**:
- **Performance**: Pure CSS, hardware-accelerated
- **Customizable**: Easy to adjust glow intensity, color, and spread
- **Accessibility**: Text remains readable, doesn't interfere with screen readers
- **No Dependencies**: Native CSS feature, works across all modern browsers

**Implementation**:
```css
/* In globals.css or neon-heading component */
.neon-text {
  color: #00ffff; /* neon cyan base color */
  text-shadow:
    0 0 5px #00ffff,      /* inner glow */
    0 0 10px #00ffff,     /* mid glow */
    0 0 20px #00ffff,     /* outer glow */
    0 0 40px #00ffff,     /* far glow */
    0 0 80px #00ffff;     /* extra far glow for intensity */
  font-weight: 700; /* Bold for better glow visibility */
  letter-spacing: 0.05em; /* Slight letter spacing for cyberpunk feel */
}

/* Subtle animation (optional) */
@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

.neon-text-animated {
  animation: neon-flicker 1.5s ease-in-out infinite;
}
```

**Alternatives Considered**:
1. SVG filters - More complex, harder to maintain
2. Canvas-based rendering - Overkill, performance issues
3. WebGL shaders - Way too complex for simple text effect

**Accessibility Considerations**:
- Ensure sufficient contrast ratio (WCAG 2.1 Level AA: 4.5:1 for normal text)
- Allow users to disable animations via `prefers-reduced-motion` media query

**References**:
- CSS text-shadow: https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow
- Neon text effects tutorial: https://css-tricks.com/how-to-create-neon-text-with-css/

---

### 7. FastAPI JWT Validation Pattern

**Decision**: FastAPI dependency injection with JWT verification middleware

**Rationale**:
- **Reusability**: Single dependency can be injected into all protected endpoints
- **Security**: Validates JWT signature with shared secret, extracts user_id, verifies match with URL parameter
- **Error Handling**: Automatic 401 Unauthorized for invalid/missing tokens
- **Type Safety**: Returns validated user_id as typed dependency

**Implementation Pattern**:
```python
# In src/api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import jwt, JWTError
from typing import Annotated

security = HTTPBearer()

async def get_current_user_id(
    credentials: Annotated[HTTPAuthCredentials, Depends(security)],
    user_id: int  # from path parameter
) -> int:
    """
    Validates JWT token and ensures token user_id matches URL user_id.
    Returns validated user_id for use in endpoint logic.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        token_user_id = payload.get("sub")  # Better Auth uses 'sub' claim

        if token_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token user_id does not match requested user_id"
            )

        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# In src/api/tasks.py
@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    """Get all tasks for authenticated user."""
    # user_id is already validated at this point
    return await task_service.get_user_tasks(db, user_id)
```

**Security Considerations**:
- Shared secret (`BETTER_AUTH_SECRET`) must match frontend Better Auth config
- Use HTTPS in production to prevent token interception
- Consider token expiration (Better Auth handles this automatically)

**References**:
- FastAPI security: https://fastapi.tiangolo.com/tutorial/security/
- python-jose library: https://python-jose.readthedocs.io/

---

## Technology Stack Summary

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend Framework** | Next.js | 16+ | App Router, React Server Components, existing project standard |
| **Frontend UI** | Shadcn UI + Tailwind CSS | Latest | Accessibility, customization, existing project standard |
| **Virtual Scrolling** | react-window | 1.8.10 | Performance, React 19 compatibility, lightweight |
| **Backend Framework** | FastAPI | 0.115+ | Async support, automatic OpenAPI, existing project standard |
| **ORM** | SQLModel | 0.0.22+ | Pydantic V2, type safety, existing project standard |
| **Database** | Neon PostgreSQL | N/A | Serverless, existing project infrastructure |
| **Authentication** | Better Auth + python-jose | Latest | JWT shared secret, existing project standard |
| **Testing (Frontend)** | Vitest + Playwright | Latest | Fast unit tests, reliable E2E |
| **Testing (Backend)** | pytest + pytest-asyncio | Latest | Async support, existing project standard |

## ADRs Required

Based on this research, the following ADRs should be created during implementation:

1. **ADR-001**: Virtual Scrolling with react-window
2. **ADR-002**: Glassmorphism Implementation Strategy
3. **ADR-003**: Landing Page Scroll Navigation Pattern

These will document the decision-making process and serve as reference for future features.

---

**Research Status**: ✅ COMPLETE
**Next Phase**: Phase 1 (Design - Data Model & API Contracts)