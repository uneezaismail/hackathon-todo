# Tasks: Frontend Redesign For Todo App

**Input**: Design documents from `/specs/005-frontend-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as per the implementation plan check.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a **monorepo** with:
- **Backend**: `backend/src/` (Pre-implemented)
- **Frontend**: `frontend/app/`, `frontend/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification for the redesign

- [x] T001 Verify Next.js 16 environment and Shadcn UI installation in frontend/
- [x] T002 Verify Tailwind CSS configuration in frontend/tailwind.config.ts for Cyberpunk theme colors (Cyan #00d4b8, Purple #8b5cf6, Navy #020617)
- [x] T003 [P] Verify Global CSS in frontend/app/globals.css for glassmorphism and neon text utility classes
- [x] T004 [P] Verify Lucide React icons installation for UI components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core frontend infrastructure that must be ready before specific pages

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create ThemeProvider in frontend/components/providers/theme-provider.tsx
- [x] T006 [P] Create Layout components (Header, Sidebar) in frontend/components/layout/
- [x] T007 [P] Create API Client utility in frontend/lib/api-client.ts (if not already present)
- [x] T008 [P] Create Auth Client utility in frontend/lib/auth-client.ts (if not already present)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Landing Page (Priority: P1) 🎯 MVP

**Goal**: Create a responsive, futuristic landing page with scroll navigation

**Independent Test**: Navigate to root `/` and verify all sections (Hero, Features, HowItWorks, CTA) display correctly and navigation works.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create Hero component in frontend/components/landing/hero.tsx
- [x] T010 [P] [US1] Create Features component in frontend/components/landing/features.tsx
- [x] T011 [P] [US1] Create HowItWorks component in frontend/components/landing/how-it-works.tsx
- [x] T012 [P] [US1] Create CTASection component in frontend/components/landing/cta-section.tsx
- [x] T013 [P] [US1] Create GeometricBackground component in frontend/components/landing/geometric-background.tsx
- [x] T014 [P] [US1] Create Footer component in frontend/components/landing/footer.tsx
- [x] T015 [US1] Assemble Landing Page in frontend/app/page.tsx importing all landing components

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Enhanced Dashboard (Priority: P1)

**Goal**: Display comprehensive task statistics and productivity metrics

**Independent Test**: Log in and verify dashboard shows correct counts, charts, and "Today's Focus" items.

### Implementation for User Story 2

- [x] T016 [P] [US2] Create StatCard component in frontend/components/dashboard/stat-card.tsx
- [x] T017 [P] [US2] Create DashboardStats component in frontend/components/dashboard/dashboard-stats.tsx
- [x] T018 [P] [US2] Create CompletionTrendsChart component in frontend/components/dashboard/completion-trends-chart.tsx
- [x] T019 [P] [US2] Create ProductivityMetrics component in frontend/components/dashboard/productivity-metrics.tsx
- [x] T020 [P] [US2] Create PriorityDistribution component in frontend/components/dashboard/priority-distribution.tsx
- [x] T021 [P] [US2] Create TodaysFocus component in frontend/components/dashboard/todays-focus.tsx
- [x] T022 [P] [US2] Create UpcomingDeadlines component in frontend/components/dashboard/upcoming-deadlines.tsx
- [x] T023 [P] [US2] Create DashboardHomeEnhanced component in frontend/components/dashboard/dashboard-home-enhanced.tsx
- [x] T024 [US2] Implement Dashboard Page in frontend/app/dashboard/page.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Task Management (Priority: P1)

**Goal**: Full CRUD capabilities with futuristic UI (Glassmorphism modals, Neon buttons)

**Independent Test**: Create, Edit, Delete, and Complete tasks using the new UI components.

### Implementation for User Story 3

- [x] T025 [P] [US3] Create TaskItem (Card) component in frontend/components/tasks/task-item.tsx
- [x] T026 [P] [US3] Create TaskList component (virtualized) in frontend/components/tasks/task-list.tsx
- [x] T027 [P] [US3] Create TaskForm (Create/Edit) component in frontend/components/tasks/task-form.tsx
- [x] T028 [P] [US3] Create TaskFormDialog (Modal wrapper) in frontend/components/tasks/task-form-dialog.tsx
- [x] T029 [P] [US3] Create DeleteConfirmationDialog in frontend/components/tasks/task-details-dialog.tsx (reuse or separate)
- [x] T030 [P] [US3] Create PrioritySelector component in frontend/components/tasks/priority-selector.tsx
- [x] T031 [P] [US3] Create DueDatePicker component in frontend/components/tasks/due-date-picker.tsx
- [x] T032 [P] [US3] Create TagInput component in frontend/components/tasks/tag-input.tsx
- [x] T033 [US3] Implement Tasks Page in frontend/app/dashboard/tasks/page.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Filtering & Sorting (Priority: P2)

**Goal**: Advanced search and organization

**Independent Test**: Use filter controls to narrow down task list and sort by different criteria.

### Implementation for User Story 4

- [x] T034 [P] [US4] Create TaskSearch component in frontend/components/tasks/task-search.tsx
- [x] T035 [P] [US4] Create TaskFilters component in frontend/components/tasks/task-filters.tsx
- [x] T036 [P] [US4] Create TaskSort component in frontend/components/tasks/task-sort.tsx
- [x] T037 [US4] Integrate Search/Filter/Sort into TaskList and Tasks Page

---

## Phase 7: User Story 5 - Settings & Profile (Priority: P3)

**Goal**: User profile management and theme settings

**Independent Test**: Navigate to settings, change theme, view profile details.

### Implementation for User Story 5

- [x] T038 [P] [US5] Create ProfileSettings component in frontend/components/settings/profile-settings.tsx
- [x] T039 [P] [US5] Create AppearanceSettings component in frontend/components/settings/appearance-settings.tsx
- [x] T040 [P] [US5] Create NotificationSettings component in frontend/components/settings/notification-settings.tsx
- [x] T041 [P] [US5] Create SecuritySettings component in frontend/components/settings/security-settings.tsx
- [x] T042 [US5] Implement Settings Page in frontend/app/dashboard/settings/page.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T043 [P] Add Skeleton loading states in frontend/components/dashboard/dashboard-skeleton.tsx
- [x] T044 [P] Add Empty State components in frontend/components/tasks/empty-state.tsx
- [x] T045 [P] Create Error Boundary in frontend/app/dashboard/error.tsx
- [x] T046 [P] Create Not Found page in frontend/app/not-found.tsx
- [x] T047 [P] Verify responsive design on mobile/tablet breakpoints
- [x] T048 Run final type check `npm run type-check`
- [x] T049 Run final lint check `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (Landing)**: Independent of Dashboard/Tasks
- **User Story 2 (Dashboard)**: Independent (uses mock or fetched data)
- **User Story 3 (Tasks)**: Independent
- **User Story 4 (Filters)**: Depends on User Story 3 (Tasks)
- **User Story 5 (Settings)**: Independent

### Parallel Opportunities

- Landing page (US1) can be built completely in parallel with Dashboard (US2) and Tasks (US3).
- Different components within the same story (e.g., Hero vs Features) can be built in parallel.

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 & 2 (Setup/Foundation)
2. Complete Phase 3 (Landing Page) -> Deployable public face
3. Complete Phase 4 (Dashboard) -> Deployable internal home
4. Complete Phase 5 (Tasks) -> Core functionality
5. Add Phase 6 & 7 (Filters/Settings) -> Enhanced features

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Landing Page)
   - Developer B: User Story 2 (Dashboard)
   - Developer C: User Story 3 (Task CRUD)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing (if TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
