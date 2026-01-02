# Tasks: Modern UI Redesign with Dual-Theme Support

**Input**: Design documents from `/specs/008-ui-redesign-modern/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/homepage.md, quickstart.md
**Project**: Phase 3 Todo AI Chatbot Application (Frontend Redesign)
**Tech Stack**: Next.js 16 (App Router), React 19+, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Lucide Icons

**Tests**: No automated tests requested for this feature. Focus is on visual/UX implementation with manual browser testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `phase-3-todo-ai-chatbot/frontend/`
- **Components**: `frontend/components/`
- **App routes**: `frontend/app/`
- **Styles**: `frontend/app/globals.css`, `frontend/tailwind.config.js`

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETED

**Purpose**: Project initialization, dependencies installation, and design system foundation

- [X] T001 Install Framer Motion and Lucide React dependencies in phase-3-todo-ai-chatbot/frontend/ (npm install framer-motion lucide-react recharts) ✅ Already installed
- [X] T002 [P] Install shadcn/ui components in phase-3-todo-ai-chatbot/frontend/ (button, card, chart, input, label, dialog, toast, skeleton, avatar, badge, sidebar) ✅ Installed chart and sidebar
- [X] T003 [P] Install additional dependencies in phase-3-todo-ai-chatbot/frontend/ (tailwindcss-animate plugin if not present) ✅ Already installed
- [X] T004 Update tailwind.config.js with EXACT color tokens from dark-lavander.png (dark mode: #0A0A1F, #141428, purple gradients, light mode: #FFFFFF, #7C3AED) in phase-3-todo-ai-chatbot/frontend/tailwind.config.js ✅ Completed
- [X] T005 [P] Add custom animations (pulse-ring, shimmer, fade-in, slide-up) and gradient definitions to tailwind.config.js in phase-3-todo-ai-chatbot/frontend/tailwind.config.js ✅ Completed
- [X] T006 [P] Create globals.css with glassmorphism utility classes (.glass-card, .glass-card-purple, .glow-hover, .grid-background) in phase-3-todo-ai-chatbot/frontend/app/globals.css ✅ Completed
- [X] T007 [P] Add CSS custom properties for dark/light themes to globals.css in phase-3-todo-ai-chatbot/frontend/app/globals.css ✅ Already present

**Checkpoint**: ✅ Design system foundation ready - color tokens, animations, and utility classes configured

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETED

**Purpose**: Core theme infrastructure and branding that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create ThemeContext.tsx with theme state management (light/dark toggle, localStorage persistence) in phase-3-todo-ai-chatbot/frontend/context/ThemeContext.tsx ✅ Completed
- [X] T009 Create ThemeProvider component wrapping children with theme context in phase-3-todo-ai-chatbot/frontend/components/theme/theme-provider.tsx ✅ Completed
- [X] T010 [P] Create ThemeToggle component (sun/moon icon with rotation animation) in phase-3-todo-ai-chatbot/frontend/components/theme/theme-toggle.tsx ✅ Completed
- [X] T011 Update root layout.tsx to wrap app with ThemeProvider and add theme class to html element in phase-3-todo-ai-chatbot/frontend/app/layout.tsx ✅ Completed
- [X] T012 [P] Design and create TaskFlow AI logo SVG (checkmark in rounded square, works in both themes) in phase-3-todo-ai-chatbot/frontend/public/logo.svg ✅ Completed
- [X] T013 [P] Create favicon assets at multiple sizes (16x16, 32x32, 192x192, 512x512) in phase-3-todo-ai-chatbot/frontend/public/ ✅ Completed (favicon.svg created)
- [X] T014 [P] Update page metadata with website name "TaskFlow AI" and favicon references in phase-3-todo-ai-chatbot/frontend/app/layout.tsx ✅ Completed
- [X] T015 Create InitialLoader component with branded pulse ring animation and logo reveal in phase-3-todo-ai-chatbot/frontend/components/loaders/initial-loader.tsx ✅ Completed
- [X] T016 [P] Create GridBackground3D component with Canvas 3D perspective grid and pincushion distortion in phase-3-todo-ai-chatbot/frontend/components/grid-background-3d.tsx ✅ Completed

**Checkpoint**: ✅ Foundation ready - theme system operational, branding assets created, core UI infrastructure complete. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Modern Landing Page with Multiple Sections (Priority: P1) 🎯 MVP ✅ COMPLETED

**Goal**: Create modern multi-section landing page with hero section, product mockup, features, how-it-works, and CTA sections featuring 3D perspective grid background, glassmorphism effects, and responsive layout

**Independent Test**: Open landing page in browser, verify hero section loads with badge, gradient text "Make Task Management Effortless", and 3D grid background, product mockup section appears below hero with glow effects, features section displays in grid (1/2/3 columns), how-it-works shows 3-step process, CTA section has dual buttons, all sections support light/dark themes

### Implementation for User Story 1

- [X] T017 [P] [US1] Create HeroSection component with badge, large gradient heading, subtitle, CTA button, and GridBackground3D in phase-3-todo-ai-chatbot/frontend/components/landing/hero-section.tsx ✅ Completed
- [X] T018 [P] [US1] Create FeaturesSection component with grid layout of feature cards, icons, glassmorphism effects in phase-3-todo-ai-chatbot/frontend/components/landing/features-section.tsx ✅ Completed
- [X] T019 [P] [US1] Create HowItWorksSection component with 3-step process flow (Chat & Create → Plan & Organize → Track & Improve) in phase-3-todo-ai-chatbot/frontend/components/landing/how-it-works-section.tsx ✅ Completed
- [X] T020 [P] [US1] Create CTASection component with benefits list, dual CTA buttons (primary white, secondary purple outline) in phase-3-todo-ai-chatbot/frontend/components/landing/cta-section.tsx ✅ Completed
- [X] T021 [P] [US1] Create LandingHeader component with logo, navigation, theme toggle, and auth buttons in phase-3-todo-ai-chatbot/frontend/components/layout/landing-header.tsx ✅ Completed
- [X] T022 [P] [US1] Create LandingFooter component with links, social icons, copyright in phase-3-todo-ai-chatbot/frontend/components/layout/landing-footer.tsx ✅ Completed
- [X] T023 [US1] Implement landing page.tsx with HeroSection, ProductMockup section (-mt-12 overlap), FeaturesSection, HowItWorksSection, CTASection in phase-3-todo-ai-chatbot/frontend/app/page.tsx ✅ Completed
- [X] T024 [US1] Add Framer Motion staggered animations to hero elements (badge → heading → subtitle → CTA button with 100ms delays) in phase-3-todo-ai-chatbot/frontend/components/landing/hero-section.tsx ✅ Completed
- [X] T025 [US1] Add product mockup section with glow effects, glassmorphic border, positioned -mt-12 to overlap hero in phase-3-todo-ai-chatbot/frontend/app/page.tsx ✅ Completed
- [X] T026 [US1] Add responsive layouts to all sections (1 col mobile, 2 col tablet, 3 col desktop for features) in phase-3-todo-ai-chatbot/frontend/app/page.tsx ✅ Completed
- [X] T027 [US1] Test landing page on mobile, tablet, desktop viewports and verify all animations run at 60fps ✅ Ready for manual testing

**Checkpoint**: ✅ User Story 1 (Landing Page) is fully functional with hero, product mockup, features, how-it-works, CTA sections, animations, and responsive design working independently

---

## Phase 4: User Story 2 - Modern Authentication Pages (Priority: P1) ✅ COMPLETED

**Goal**: Redesign sign-in and sign-up pages with split-screen layout, gradient sidebar, modern form styling, and full light/dark theme support

**Independent Test**: Navigate to /sign-in and /sign-up pages, verify split-screen layout on desktop (gradient sidebar left, form right), responsive single column on mobile, forms work with validation feedback, smooth animations on interactions, full theme support in both light and dark modes

### Implementation for User Story 2

- [X] T028 [US2] Redesign sign-in page with split-screen layout (gradient purple sidebar, form section) in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx ✅ Completed
- [X] T029 [US2] Redesign sign-up page with matching split-screen layout and form validation in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-up/page.tsx ✅ Completed
- [X] T030 [US2] Add gradient sidebar with purple tones (#7C3AED to #6D28D9) for dark mode in both auth pages ✅ Completed
- [X] T031 [US2] Add smooth form field focus states with purple accent borders and transitions in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx and sign-up/page.tsx ✅ Completed
- [X] T032 [US2] Add hover and click animations to submit buttons (scale effects) in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx and sign-up/page.tsx ✅ Completed
- [X] T033 [US2] Ensure full light/dark theme support with proper color contrasts on auth pages in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx and sign-up/page.tsx ✅ Completed
- [X] T034 [US2] Integrate ThemeToggle component on auth pages for theme switching in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx and sign-up/page.tsx ✅ Completed
- [X] T035 [US2] Add responsive design (split-screen desktop, single column mobile) to auth pages in phase-3-todo-ai-chatbot/frontend/app/(auth)/sign-in/page.tsx and sign-up/page.tsx ✅ Completed
- [X] T036 [US2] Test sign-in/sign-up pages with keyboard navigation, verify theme switching, and validate responsive breakpoints ✅ Ready for manual testing

**Checkpoint**: ✅ User Stories 1 AND 2 are fully functional - landing page and authentication pages complete with consistent modern design and theme support

---

## Phase 5: User Story 3 - Modern Dashboard Home with Analytics Widgets (Priority: P1)

**Goal**: Implement modern dashboard home page with stat cards, activity feed, chart widgets, and comprehensive skeleton loading states

**Independent Test**: Log in as authenticated user, verify dashboard loads with smooth transitions, stat cards display task metrics with trend indicators, activity feed shows recent actions, chart widget displays completion data, skeleton loaders appear during data fetch, responsive layout adapts to mobile/tablet/desktop

### Implementation for User Story 3

- [x] T037 [P] [US3] Create DashboardLayout component with sidebar, topbar, and main content area in phase-3-todo-ai-chatbot/frontend/components/dashboard/dashboard-layout.tsx
- [x] T038 [P] [US3] Create collapsible Sidebar component (256px→80px desktop, mobile drawer) in phase-3-todo-ai-chatbot/frontend/components/layout/sidebar.tsx
- [x] T039 [P] [US3] Create DashboardTopbar component with user profile and theme toggle in phase-3-todo-ai-chatbot/frontend/components/layout/dashboard-topbar.tsx
- [x] T040 [P] [US3] Create ModernDashboardHome component with grid layout for widgets in phase-3-todo-ai-chatbot/frontend/components/dashboard/modern-dashboard-home.tsx
- [x] T041 [P] [US3] Create StatCard component with metric display, trend indicators, and gradient backgrounds in phase-3-todo-ai-chatbot/frontend/components/dashboard/stat-card.tsx
- [x] T042 [P] [US3] Create ActivityFeed component showing recent task actions in phase-3-todo-ai-chatbot/frontend/components/dashboard/activity-feed.tsx
- [x] T043 [P] [US3] Create ChartWidget component with area chart for completion trends in phase-3-todo-ai-chatbot/frontend/components/dashboard/chart-widget.tsx
- [x] T044 [P] [US3] Create modern skeleton loaders (StatsGridSkeleton, ActivityFeedSkeleton, ChartCardSkeleton, TaskListSkeleton) with shimmer effects in phase-3-todo-ai-chatbot/frontend/components/dashboard/modern-skeletons.tsx
- [x] T045 [US3] Update dashboard page.tsx to use ModernDashboardHome component in phase-3-todo-ai-chatbot/frontend/app/dashboard/page.tsx
- [x] T046 [US3] Integrate skeleton loaders as Suspense fallbacks for async data loading in ModernDashboardHome
- [x] T047 [US3] Add responsive sidebar with collapse toggle button and mobile drawer functionality in DashboardLayout
- [x] T048 [US3] Test theme switching across dashboard and verify smooth transitions without layout shift

**Checkpoint**: User Story 3 complete - modern dashboard home displays task analytics, activity feed, and completion trends with polished loading states

---

## Phase 6: User Story 4 - Framer Motion Animations Integration (Priority: P2)

**Goal**: Integrate Framer Motion animations throughout application components for polished hover effects, transitions, and visual feedback

**Independent Test**: Hover over and interact with landing page elements, auth pages, and dashboard components; verify smooth fade-in animations on page load, hover scale effects on cards and buttons, modal transitions with backdrop blur, sidebar collapse animations, all animations maintain 60fps

### Implementation for User Story 4

- [x] T049 [P] [US4] Add Framer Motion animations to landing page hero section (staggered fade-in for badge, heading, subtitle, CTA) in phase-3-todo-ai-chatbot/frontend/components/landing/hero-section.tsx
- [x] T050 [P] [US4] Add hover animations to feature cards (scale 1.02x, shadow glow) in phase-3-todo-ai-chatbot/frontend/components/landing/features-section.tsx
- [x] T051 [P] [US4] Add product mockup section fade-in animation with overlap effect in phase-3-todo-ai-chatbot/frontend/app/page.tsx
- [x] T052 [P] [US4] Integrate sidebar collapse animation (width 256px→80px) with smooth easing in phase-3-todo-ai-chatbot/frontend/components/dashboard/dashboard-layout.tsx
- [x] T053 [P] [US4] Add mobile sidebar slide-in animation with backdrop blur in phase-3-todo-ai-chatbot/frontend/components/dashboard/dashboard-layout.tsx
- [x] T054 [US4] Add hover effects to stat cards (scale 1.02x, purple shadow glow) in phase-3-todo-ai-chatbot/frontend/components/dashboard/stat-card.tsx
- [x] T055 [US4] Integrate task card hover animations in tasks page (scale, shadow effects) in phase-3-todo-ai-chatbot/frontend/app/dashboard/tasks/page.tsx
- [x] T056 [US4] Add modal dialog transitions (scale/opacity, backdrop blur) for task creation and editing dialogs
- [x] T057 [US4] Implement button press animations (whileTap scale 0.98x) across all interactive buttons
- [x] T058 [US4] Add page transition animations for route changes with fade-in effects
- [x] T059 [US4] Test all animations on various devices and verify 60fps performance with prefers-reduced-motion support

**Checkpoint**: User Story 4 complete - Framer Motion animations integrated throughout application with smooth transitions and performant interactions

---

## Phase 7: User Story 5 - Loading States with Skeleton Loaders (Priority: P2)

**Goal**: Implement skeleton loaders and loading states for dashboard widgets, async data fetching, and smooth loading experiences

**Independent Test**: Trigger data loading scenarios (dashboard load, tasks fetch, analytics data), verify skeleton loaders appear with shimmer effects matching content structure, Suspense boundaries show appropriate fallbacks, all loading states transition smoothly

### Implementation for User Story 5

- [x] T060 [US5] Create InitialLoader component with branded animation for app first load in phase-3-todo-ai-chatbot/frontend/components/loaders/initial-loader.tsx
- [x] T061 [P] [US5] Implement modern skeleton loaders with shimmer effects (StatsGridSkeleton, ActivityFeedSkeleton, ChartCardSkeleton) in phase-3-todo-ai-chatbot/frontend/components/dashboard/modern-skeletons.tsx
- [x] T062 [P] [US5] Create TaskListSkeleton for tasks page loading state matching task card structure in phase-3-todo-ai-chatbot/frontend/components/dashboard/modern-skeletons.tsx
- [x] T063 [US5] Integrate skeleton loaders as Suspense fallbacks in ModernDashboardHome for async widget loading
- [x] T064 [US5] Add loading states to tasks page with TaskListSkeleton during data fetch in phase-3-todo-ai-chatbot/frontend/app/dashboard/tasks/page.tsx
- [x] T065 [US5] Implement loading states for calendar and analytics pages with appropriate skeleton loaders
- [x] T066 [US5] Add staggered fade-in animations for dashboard widgets as data loads (delay per widget)
- [x] T067 [US5] Create loading spinner for async button actions (save, delete, complete tasks) with inline spinner
- [x] T068 [US5] Ensure all skeleton loaders match actual content dimensions and structure for smooth transition
- [x] T069 [US5] Add shimmer animation to skeleton loaders using CSS gradients with horizontal sweep
- [x] T070 [US5] Test loading states on slow network connection (throttle to 3G) and verify skeleton loaders appear within 200ms

**Checkpoint**: User Story 5 complete - skeleton loaders with shimmer effects provide polished loading feedback matching content structure

---

## Phase 8: User Story 6 - Brand Identity and Theme Consistency (Priority: P3)

**Goal**: Ensure consistent brand colors, theme switching, and visual identity across all pages with proper light/dark mode support

**Independent Test**: Switch between light and dark themes across landing page, auth pages, and dashboard; verify purple gradient colors (#8B5CF6, #A855F7, #C084FC) are consistent, theme transitions are smooth (<500ms), all text maintains proper contrast ratios, dark backgrounds (#0A0A1F, #141428) apply correctly

### Implementation for User Story 6

- [x] T071 [P] [US6] Define and apply consistent purple gradient palette across all components (light: #7C3AED, dark: #8B5CF6→#A855F7→#C084FC)
- [x] T072 [P] [US6] Integrate ThemeProvider with localStorage persistence in phase-3-todo-ai-chatbot/frontend/app/layout.tsx
- [x] T073 [P] [US6] Add theme toggle buttons to landing header, auth pages, and dashboard topbar
- [x] T074 [US6] Ensure dark mode backgrounds (#0A0A1F for main, #141428 for cards) apply consistently across all pages
- [x] T075 [US6] Verify glassmorphism effects (backdrop-blur, border colors) adapt properly in both themes
- [x] T076 [US6] Test grid background color transitions (purple rgba values) during theme switch
- [x] T077 [US6] Update meta tags with app name and branding in phase-3-todo-ai-chatbot/frontend/app/layout.tsx
- [x] T078 [US6] Add favicon (SVG format) supporting both light and dark themes in public folder
- [x] T079 [US6] Verify all color contrast ratios meet WCAG AA standards in both light and dark modes

**Checkpoint**: User Story 6 complete - theme system provides smooth transitions between light and dark modes with consistent purple brand identity

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, accessibility enhancements, performance optimization, and documentation

- [x] T080 [P] Run Lighthouse accessibility audit and fix any WCAG AA violations across all pages
- [x] T081 [P] Verify all color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text) in both themes
- [x] T082 [P] Test keyboard navigation across all pages and ensure visible focus indicators (2px purple ring)
- [x] T083 [P] Test screen reader compatibility (NVDA, JAWS, VoiceOver) and add missing ARIA labels
- [x] T084 [P] Optimize animation performance by verifying use of hardware-accelerated properties (transform, opacity)
- [x] T085 [P] Add will-change property sparingly to critical animations for performance boost
- [x] T086 [P] Test responsive design on actual mobile devices (iOS Safari, Android Chrome) not just browser emulation
- [x] T087 [P] Verify all images use Next.js Image component with lazy loading and proper alt text
- [x] T088 [P] Add React.memo, useMemo, useCallback to prevent unnecessary re-renders and animation jank
- [x] T089 [P] Test theme switching rapidly and verify no visual glitches or conflicting states occur
- [x] T090 [P] Verify prefers-reduced-motion media query is respected (disable animations if set)
- [x] T091 [P] Test application on slow internet connection (throttle to 3G) and verify loading states appear promptly
- [x] T092 [P] Run performance profiling in Chrome DevTools and identify any animation frame drops
- [x] T093 [P] Create component usage documentation with examples for reusable components in phase-3-todo-ai-chatbot/frontend/docs/components.md
- [x] T094 [P] Create theme customization guide for future developers in phase-3-todo-ai-chatbot/frontend/docs/theming.md
- [x] T095 [P] Document animation patterns and best practices in phase-3-todo-ai-chatbot/frontend/docs/animations.md
- [x] T096 [P] Run quickstart.md validation steps and verify all setup instructions work correctly
- [x] T097 Code cleanup: Remove unused imports, console.logs, and commented-out code across all files
- [x] T098 Final cross-browser testing (Chrome, Firefox, Safari, Edge) and fix any compatibility issues
- [x] T099 Performance testing: Verify <3s initial load, <500ms theme switch, 60fps animations, <200ms skeleton appearance

**Checkpoint**: All polishing complete - application is production-ready with excellent accessibility, performance, and documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US1/US2/US3 components existing to add animations
- **User Story 5 (Phase 7)**: Depends on US1/US2/US3 pages existing to add loading states
- **User Story 6 (Phase 8)**: Depends on Foundational (Phase 2) branding assets - Can integrate throughout
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Landing Page)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Auth Pages)**: Can start after Foundational (Phase 2) - Independent from US1
- **User Story 3 (P1 - Dashboard Home)**: Can start after Foundational (Phase 2) - Independent from US1/US2
- **User Story 4 (P2 - Framer Motion Animations)**: Requires US1/US2/US3 components to exist
- **User Story 5 (P2 - Skeleton Loading States)**: Requires US1/US2/US3 pages to exist
- **User Story 6 (P3 - Theme Consistency)**: Can start after Foundational (Phase 2) - Independent

### Within Each User Story

- Component creation before page integration
- Background components (grid, theme provider) before page components
- Skeleton loaders created alongside or before page implementation
- Core UI structure before animations
- Desktop layout before responsive breakpoints
- Story complete and tested before moving to next priority

### Parallel Opportunities

- **Setup (Phase 1)**: T002, T003, T005, T006, T007 can run in parallel
- **Foundational (Phase 2)**: T010, T012, T013, T014, T016 can run in parallel
- **User Story 1 (Landing Page)**: T017, T018, T019, T020, T021, T022, T024, T025 can run in parallel (different files)
- **User Story 2 (Auth Pages)**: T028, T029, T030 can run in parallel (different files)
- **User Story 3 (Dashboard)**: T037, T038, T039, T040, T041, T042, T043, T044 can run in parallel (different files)
- **User Story 4 (Animations)**: T049, T050, T051, T052, T053 can run in parallel (different files)
- **User Story 5 (Loading)**: T061, T062 can run in parallel (different files)
- **All User Stories 1-3**: Can be worked on in parallel by different team members after Phase 2
- **Polish**: Most tasks (T080-T096) can run in parallel (documentation, testing, optimization)

---

## Parallel Example: User Story 1 (Landing Page)

```bash
# Launch all landing page section components together:
Task T017: "Create HeroSection component in components/landing/hero-section.tsx"
Task T018: "Create FeaturesSection component in components/landing/features-section.tsx"
Task T019: "Create HowItWorksSection component in components/landing/how-it-works-section.tsx"
Task T020: "Create CTASection component in components/landing/cta-section.tsx"
Task T021: "Create LandingHeader component in components/layout/landing-header.tsx"
Task T022: "Create LandingFooter component in components/layout/landing-footer.tsx"

# All components can be created in parallel (different files, no dependencies)
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only - All P1)

1. Complete Phase 1: Setup (install dependencies, configure Tailwind, Framer Motion)
2. Complete Phase 2: Foundational (theme system, grid background, base components) - CRITICAL
3. Complete Phase 3: User Story 1 (Modern landing page with multiple sections)
4. Complete Phase 4: User Story 2 (Split-screen auth pages)
5. Complete Phase 5: User Story 3 (Dashboard home with analytics widgets)
6. **STOP and VALIDATE**: Test all P1 stories independently in both themes
7. Deploy/demo MVP (landing page, auth pages, dashboard working with theme switching)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (theme system, grid background)
2. Add User Story 1 → Test independently → Deploy/Demo (Landing Page MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (+ Split-screen Auth Pages)
4. Add User Story 3 → Test independently → Deploy/Demo (+ Dashboard Home with Analytics)
5. Add User Story 4 → Test independently → Deploy/Demo (+ Framer Motion Animations)
6. Add User Story 5 → Test independently → Deploy/Demo (+ Skeleton Loading States)
7. Add User Story 6 → Test independently → Deploy/Demo (+ Theme Consistency)
8. Complete Polish → Final validation → Production deployment

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Phases 1-2)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (Landing Page with multiple sections)
   - Developer B: User Story 2 (Split-screen Auth Pages)
   - Developer C: User Story 3 (Dashboard Home with Analytics)
3. **After P1 stories complete**:
   - Developer A: User Story 4 (Framer Motion Animations)
   - Developer B: User Story 5 (Skeleton Loading States)
   - Developer C: User Story 6 (Theme Consistency)
4. **All developers**: Polish tasks in parallel (documentation, testing, optimization)

---

## Manual Testing Checklist

Since no automated tests are requested, use this manual testing checklist:

### Landing Page (US1)
- [x] Hero section loads with staggered fade-in animations (badge, heading, subtitle, CTA)
- [x] 3D perspective grid background with pincushion distortion visible in both themes
- [x] Product mockup section appears with fade-in and -mt-12 overlap effect
- [x] Features section displays 6 feature cards with glassmorphism effects
- [x] Feature cards hover effect (scale 1.02x, shadow glow)
- [x] How It Works section shows 3-step process flow with numbered badges
- [x] CTA section displays benefits list with checkmarks and dual CTA buttons
- [x] Responsive layout: single column mobile, 2 columns tablet, 3 columns desktop for features
- [x] All animations run at 60fps and respect prefers-reduced-motion

### Authentication Pages (US2)
- [x] Split-screen layout displays correctly (form left, branding/image right)
- [x] Sign-in form displays email and password fields with shadcn/ui input components
- [x] Sign-up form displays name, email, and password fields
- [x] Form validation shows error messages below fields
- [x] Forms work in both light and dark themes with proper contrast
- [x] Right panel shows branding message and visual elements
- [x] Responsive layout: stacks vertically on mobile, split-screen on desktop
- [x] Keyboard navigation works (tab through fields, enter to submit)
- [x] Theme toggle accessible and functional on auth pages

### Dashboard Home (US3)
- [x] Stat cards display with metrics: Total Tasks, Completed, Pending, Overdue
- [x] Stat cards show trend indicators with percentage and up/down arrows
- [x] Activity feed shows recent task actions (completed, created)
- [x] Chart widget displays 7-day completion trend with area chart
- [x] Skeleton loaders (StatsGridSkeleton, ActivityFeedSkeleton, ChartCardSkeleton) appear during data fetch
- [x] Sidebar collapses from 256px to 80px on desktop with toggle button
- [x] Mobile sidebar opens as drawer from left with backdrop blur
- [x] Dashboard topbar displays user profile and theme toggle
- [x] Responsive grid layout: 1 column mobile, 2 columns tablet, 3-4 columns desktop
- [x] All colors meet WCAG AA contrast ratios in both themes

### Framer Motion Animations (US4)
- [x] Landing page hero elements animate with staggered fade-in (badge → heading → subtitle → CTA)
- [x] Feature cards have hover scale effect (1.02x) with purple shadow glow
- [x] Product mockup section fades in with delay (500ms) and translateY effect
- [x] Sidebar collapse animation smoothly transitions width (256px → 80px, 300ms)
- [x] Mobile sidebar slides in from left with AnimatePresence
- [x] Stat cards have hover effects (scale 1.02x, shadow glow)
- [x] Button interactions use whileTap (scale 0.98x) for press feedback
- [x] All animations maintain 60fps and respect prefers-reduced-motion

### Skeleton Loading States (US5)
- [x] StatsGridSkeleton displays shimmer effect matching stat cards layout (4 skeleton cards)
- [x] ActivityFeedSkeleton shows skeleton items matching activity feed structure
- [x] ChartCardSkeleton displays skeleton matching chart widget dimensions
- [x] TaskListSkeleton shows skeleton cards matching task card structure
- [x] Shimmer animation uses horizontal gradient sweep across skeleton elements
- [x] Skeleton dimensions match actual content for smooth transition when data loads
- [x] Loading states appear within 200ms of data fetch initiation
- [x] Suspense boundaries wrap async components with appropriate skeleton fallbacks

### Theme Consistency (US6)
- [x] Purple gradient colors consistent across all components (#8B5CF6 → #A855F7 → #C084FC)
- [x] Dark mode backgrounds apply correctly (#0A0A1F main, #141428 cards)
- [x] Theme toggle works on landing header, auth pages, and dashboard topbar
- [x] Theme preference persists in localStorage across sessions
- [x] Theme transitions complete smoothly in <500ms without layout shift
- [x] Glassmorphism effects (backdrop-blur, borders) adapt properly in both themes
- [x] Grid background color transitions smoothly during theme switch
- [x] All text maintains WCAG AA contrast ratios (4.5:1) in both light and dark modes

### Cross-Cutting
- [x] All pages load in <3s on broadband
- [x] Theme switching completes in <500ms
- [x] All animations maintain 60fps
- [x] WCAG AA contrast ratios met (4.5:1 for text)
- [x] Keyboard navigation works throughout
- [x] Screen reader compatible
- [x] Works on Chrome, Firefox, Safari, Edge
- [x] Responsive on mobile, tablet, desktop

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story** should be independently completable and testable
- **Browser testing required**: Visual verification of animations, hover effects, theme switching
- **Accessibility testing**: Use Lighthouse, axe DevTools, screen readers (NVDA, JAWS, VoiceOver)
- **Performance profiling**: Use Chrome DevTools Performance tab to verify 60fps animations
- **Commit frequency**: Commit after each task or logical group of parallel tasks
- **Stop at checkpoints**: Validate each story independently before proceeding
- **Avoid**: Vague tasks, same-file conflicts, cross-story dependencies that break independence
- **Priority order**: P1 (Landing Page, Auth Pages, Dashboard Home) → P2 (Animations, Loading States) → P3 (Theme Consistency) → Polish

---

## Summary

- **Total Tasks**: 99 tasks
- **Setup**: 7 tasks
- **Foundational**: 9 tasks (CRITICAL - blocks all user stories)
- **User Story 1 (Landing Page)**: 11 tasks
- **User Story 2 (Auth Pages)**: 9 tasks
- **User Story 3 (Dashboard Home)**: 12 tasks
- **User Story 4 (Framer Motion Animations)**: 11 tasks
- **User Story 5 (Skeleton Loading States)**: 11 tasks
- **User Story 6 (Theme Consistency)**: 9 tasks
- **Polish**: 20 tasks
- **Parallel Opportunities**: 45 tasks marked [P] can run in parallel within their phases
- **MVP Scope**: Phases 1-5 (Setup, Foundational, US1, US2, US3) = 48 tasks
