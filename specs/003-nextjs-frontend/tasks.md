# Tasks: Production-Ready Next.js 16 Frontend for Todo App

**Input**: Design documents from `/specs/003-nextjs-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Testing infrastructure is included as per spec.md requirement. Component tests (Vitest), integration tests, and E2E tests (Playwright) are specified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `frontend/` directory in the monorepo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 16 project with TypeScript in frontend/ directory
- [X] T002 Install core dependencies: next@16, react@19, react-dom@19, typescript@5
- [X] T003 [P] Install Better Auth dependencies: better-auth@1.x with JWT plugin
- [X] T004 [P] Install Drizzle ORM dependencies: drizzle-orm, drizzle-kit, @neondatabase/serverless
- [X] T005 [P] Install shadcn/ui dependencies: tailwindcss@3.x, class-variance-authority, clsx, tailwind-merge
- [X] T006 [P] Install testing dependencies: vitest, @testing-library/react, @testing-library/jest-dom, @playwright/test
- [X] T007 Configure TypeScript with strict mode in frontend/tsconfig.json
- [X] T008 [P] Configure Tailwind CSS in frontend/tailwind.config.ts
- [X] T009 [P] Configure shadcn/ui in frontend/components.json
- [X] T010 [P] Configure Drizzle in frontend/drizzle.config.ts
- [X] T011 [P] Configure Vitest in frontend/vitest.config.ts
- [X] T012 [P] Setup ESLint with Next.js 16 rules in frontend/.eslintrc.json
- [X] T013 Create frontend/app/layout.tsx with root HTML structure
- [X] T014 Create frontend/app/globals.css with Tailwind directives
- [X] T015 Create frontend/.env.example with required environment variables
- [X] T016 Create frontend/.gitignore with Next.js ignore patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T017 Create Drizzle schema for auth tables (User, Session, Account) in frontend/db/schema.ts
- [X] T018 Generate initial Drizzle migration files in frontend/db/migrations/
- [X] T019 Create Drizzle client instance in frontend/lib/db.ts
- [X] T020 Configure Better Auth server with JWT plugin in frontend/lib/auth.ts
- [X] T021 Configure Better Auth client in frontend/lib/auth-client.ts
- [X] T022 Create API client with JWT interceptor in frontend/lib/api-client.ts
- [X] T023 Create Zod validation schemas for auth in frontend/lib/validation.ts
- [X] T024 Create type definitions for auth in frontend/types/auth.ts
- [X] T025 Create type definitions for tasks in frontend/types/task.ts
- [X] T026 Create type definitions for API responses in frontend/types/api.ts
- [X] T027 Create Better Auth API route handler in frontend/app/api/auth/[...all]/route.ts
- [X] T028 Create proxy.ts for route protection in frontend/proxy.ts
- [X] T029 Configure proxy matcher for /dashboard protection in frontend/proxy.ts
- [X] T030 Install shadcn/ui button component in frontend/components/ui/button.tsx
- [X] T031 [P] Install shadcn/ui input component in frontend/components/ui/input.tsx
- [X] T032 [P] Install shadcn/ui avatar component in frontend/components/ui/avatar.tsx
- [X] T033 [P] Install shadcn/ui dropdown-menu component in frontend/components/ui/dropdown-menu.tsx
- [X] T034 [P] Install shadcn/ui dialog component in frontend/components/ui/dialog.tsx
- [X] T035 [P] Install shadcn/ui sonner component (replaces toast) in frontend/components/ui/sonner.tsx
- [X] T036 [P] Install shadcn/ui checkbox component in frontend/components/ui/checkbox.tsx
- [X] T037 Create error boundary component in frontend/app/error.tsx
- [X] T038 Create 404 page in frontend/app/not-found.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Public Landing Page Experience (Priority: P1) 🎯 MVP Candidate

**Goal**: Create responsive landing page with marketing content and clear CTAs to drive sign-ups

**Independent Test**: Navigate to http://localhost:3000 and verify landing page displays marketing content, feature sections, responsive header with "Sign In" and "Get Started" buttons, and footer - all without authentication

### E2E Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T039 [P] [US1] Create E2E test for landing page load and content visibility in frontend/__tests__/e2e/landing-page.spec.ts
- [X] T040 [P] [US1] Create E2E test for responsive layout (mobile/tablet/desktop) in frontend/__tests__/e2e/landing-page-responsive.spec.ts

### Implementation for User Story 1

- [X] T041 [P] [US1] Create Header component (Server Component) in frontend/components/layout/header.tsx
- [X] T042 [P] [US1] Create Footer component (Server Component) in frontend/components/layout/footer.tsx
- [X] T043 [US1] Implement landing page with feature sections in frontend/app/page.tsx
- [X] T044 [US1] Add responsive styles for landing page in frontend/app/page.tsx
- [X] T045 [US1] Update root layout to include Header and Footer in frontend/app/layout.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - landing page loads with marketing content and responsive design

---

## Phase 4: User Story 2 - Authentication Flow (Priority: P1) 🎯 MVP Required

**Goal**: Enable users to sign up and sign in with Better Auth using JWT tokens, with automatic session management

**Independent Test**: Navigate to /sign-up, create account with name/email/password, verify redirect to /dashboard. Navigate to /sign-in, log in with credentials, verify redirect to /dashboard. Verify invalid credentials show error messages.

### Integration Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T046 [P] [US2] Create integration test for sign-up flow in frontend/__tests__/integration/auth-signup.test.tsx
- [X] T047 [P] [US2] Create integration test for sign-in flow in frontend/__tests__/integration/auth-signin.test.tsx
- [X] T048 [P] [US2] Create integration test for session persistence on page refresh in frontend/__tests__/integration/auth-session.test.tsx

### Implementation for User Story 2

- [X] T049 [P] [US2] Create sign-up form component (Client Component) in frontend/components/auth/sign-up-form.tsx
- [X] T050 [P] [US2] Create sign-in form component (Client Component) in frontend/components/auth/sign-in-form.tsx
- [X] T051 [US2] Create sign-up page in frontend/app/(auth)/sign-up/page.tsx
- [X] T052 [US2] Create sign-in page in frontend/app/(auth)/sign-in/page.tsx
- [X] T053 [US2] Implement form validation with Zod in sign-up form
- [X] T054 [US2] Implement form validation with Zod in sign-in form
- [X] T055 [US2] Add error handling and display for auth errors in sign-up form
- [X] T056 [US2] Add error handling and display for auth errors in sign-in form
- [X] T057 [US2] Implement redirect logic after successful authentication
- [X] T058 [US2] Add loading states to auth forms

**Checkpoint**: At this point, User Story 2 should be fully functional - users can sign up, sign in, and sessions persist

---

## Phase 5: User Story 6 - Route Protection (Priority: P1) 🎯 MVP Required

**Goal**: Protect dashboard route from unauthenticated access using proxy.ts, automatically redirecting to sign-in

**Independent Test**: While logged out, attempt to access /dashboard and verify redirect to /sign-in. Log in and verify successful access to /dashboard. Log out from dashboard and verify redirect to landing page.

### Integration Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T059 [P] [US6] Create integration test for unauthenticated dashboard access in frontend/__tests__/integration/route-protection.test.tsx
- [X] T060 [P] [US6] Create integration test for session expiration redirect in frontend/__tests__/integration/session-expiry.test.tsx

### Implementation for User Story 6

- [X] T061 [US6] Implement session validation logic in frontend/proxy.ts
- [X] T062 [US6] Add redirect to /sign-in for unauthenticated dashboard access in frontend/proxy.ts
- [X] T063 [US6] Implement callback URL preservation for post-login redirect in frontend/proxy.ts
- [X] T064 [US6] Add automatic session expiry detection and redirect in frontend/proxy.ts

**Checkpoint**: At this point, User Story 6 should be fully functional - dashboard is protected, unauthenticated users redirected to sign-in

---

## Phase 6: User Story 4 - Task Management Dashboard (Priority: P1) 🎯 MVP Core

**Goal**: Enable authenticated users to perform full CRUD operations on tasks with optimistic UI and error rollback

**Independent Test**: Log in, navigate to /dashboard, create new task (verify immediate UI update), edit task title/description, toggle task completion, delete task with confirmation. Verify all operations update immediately with optimistic UI and show errors on API failure.

### E2E Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T065 [P] [US4] Create E2E test for task creation with optimistic UI in frontend/__tests__/e2e/task-create.spec.ts
- [X] T066 [P] [US4] Create E2E test for task update flow in frontend/__tests__/e2e/task-update.spec.ts
- [X] T067 [P] [US4] Create E2E test for task deletion with confirmation in frontend/__tests__/e2e/task-delete.spec.ts
- [X] T068 [P] [US4] Create E2E test for task toggle completion in frontend/__tests__/e2e/task-toggle.spec.ts
- [X] T069 [P] [US4] Create E2E test for error handling and rollback in frontend/__tests__/e2e/task-error-handling.spec.ts

### Implementation for User Story 4

- [X] T070 [P] [US4] Create Server Action for fetching tasks in frontend/actions/tasks.ts
- [X] T071 [P] [US4] Create Server Action for creating tasks in frontend/actions/tasks.ts
- [X] T072 [P] [US4] Create Server Action for updating tasks in frontend/actions/tasks.ts
- [X] T073 [P] [US4] Create Server Action for deleting tasks in frontend/actions/tasks.ts
- [X] T074 [P] [US4] Create Server Action for toggling task completion in frontend/actions/tasks.ts
- [X] T075 [US4] Add JWT token extraction and validation in task Server Actions
- [X] T076 [US4] Add user ID extraction from session for API URLs in task Server Actions
- [X] T077 [US4] Create task list component (Server Component) in frontend/components/tasks/task-list.tsx
- [X] T078 [US4] Create task item component (Client Component with optimistic UI) in frontend/components/tasks/task-item.tsx
- [X] T079 [US4] Create task form component (Client Component) for create/edit in frontend/components/tasks/task-form.tsx
- [X] T080 [US4] Create empty state component in frontend/components/tasks/empty-state.tsx
- [X] T081 [US4] Implement dashboard page with task list in frontend/app/dashboard/page.tsx
- [X] T082 [US4] Create dashboard layout in frontend/app/dashboard/layout.tsx
- [X] T083 [US4] Implement optimistic UI with useOptimistic hook in task-item.tsx
- [X] T084 [US4] Add error rollback logic for failed task operations
- [X] T085 [US4] Implement delete confirmation dialog using shadcn/ui Dialog
- [X] T086 [US4] Add form validation for task title (1-200 chars) and description (0-1000 chars)
- [X] T087 [US4] Add loading states to task operations
- [X] T088 [US4] Display dismissible error banner for API failures using shadcn/ui Toast

**Checkpoint**: At this point, User Story 4 should be fully functional - users can manage tasks with full CRUD, optimistic UI, and error handling

---

## Phase 7: User Story 3 - Dynamic Header with User Menu (Priority: P2)

**Goal**: Show authenticated user's avatar with initials in header, dropdown menu with logout option

**Independent Test**: Log in and verify header shows avatar with user's initials (not "Sign In"/"Get Started" buttons). Click avatar and verify dropdown shows name/email and "Logout" option. Click "Logout" and verify redirect to landing page. Log out and verify header shows auth buttons again.

### Component Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T089 [P] [US3] Create component test for user-menu with avatar initials in frontend/__tests__/components/user-menu.test.tsx
- [X] T090 [P] [US3] Create component test for logout flow in frontend/__tests__/components/user-menu-logout.test.tsx

### Implementation for User Story 3

- [X] T091 [US3] Create user menu component (Client Component) in frontend/components/layout/user-menu.tsx
- [X] T092 [US3] Implement avatar initials generation from user name in user-menu.tsx
- [X] T093 [US3] Add dropdown menu with user info and logout option using shadcn/ui DropdownMenu
- [X] T094 [US3] Implement logout Server Action in frontend/actions/auth.ts
- [X] T095 [US3] Update Header component to conditionally show user menu or auth buttons
- [X] T096 [US3] Add session check in Header to determine authenticated state
- [X] T097 [US3] Implement click-outside to close dropdown menu

**Checkpoint**: At this point, User Story 3 should be fully functional - authenticated users see avatar with dropdown, can logout successfully

---

## Phase 8: User Story 5 - Task Filtering (Priority: P2)

**Goal**: Allow users to filter tasks by status (all, pending, completed) with filter state persistence during task operations

**Independent Test**: Create mix of pending and completed tasks. Click "Pending" filter and verify only incomplete tasks shown. Click "Completed" filter and verify only completed tasks shown. Click "All" and verify all tasks shown. Create new task while filter active and verify filter persists.

### Component Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T098 [P] [US5] Create component test for task filters in frontend/__tests__/components/task-filters.test.tsx
- [X] T099 [P] [US5] Create component test for filter persistence during task operations in frontend/__tests__/components/task-filters-persistence.test.tsx

### Implementation for User Story 5

- [X] T100 [US5] Create task filters component (Client Component) in frontend/components/tasks/task-filters.tsx
- [X] T101 [US5] Implement filter state management with URL search params
- [X] T102 [US5] Add filter buttons for "All", "Pending", "Completed" in task-filters.tsx
- [X] T103 [US5] Update task list to filter tasks based on selected filter
- [X] T104 [US5] Integrate task filters in dashboard page
- [X] T105 [US5] Ensure filter state persists after task creation/update/delete

**Checkpoint**: At this point, User Story 5 should be fully functional - users can filter tasks by status with state persistence

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T106 [P] Add loading skeleton components for task list in frontend/components/tasks/task-list-skeleton.tsx
- [X] T107 [P] Add loading spinner component for forms in frontend/components/ui/spinner.tsx
- [X] T108 [P] Implement error boundary for dashboard in frontend/app/dashboard/error.tsx
- [X] T109 Add responsive mobile menu for header navigation on small screens
- [X] T110 [P] Add accessibility attributes (ARIA labels) to all interactive components
- [ ] T111 [P] Optimize images and add next/image for logo and icons
- [X] T112 Add meta tags for SEO in root layout
- [X] T113 [P] Add Playwright configuration in frontend/playwright.config.ts
- [ ] T114 Run all E2E tests and verify passing
- [ ] T115 Run all integration tests and verify passing
- [ ] T116 Run all component tests and verify passing
- [X] T117 Run TypeScript type checking (tsc --noEmit) and fix any errors
- [X] T118 Run ESLint and fix all warnings
- [ ] T119 Test responsive design on mobile (320px), tablet (768px), desktop (1024px+)
- [ ] T120 Verify Lighthouse score >90 for Performance, Accessibility, Best Practices
- [ ] T121 Test all user stories end-to-end per quickstart.md scenarios
- [X] T122 Create production build and verify no errors (npm run build)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User Story 1 (Landing Page): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Auth Flow): Can start after Foundational - No dependencies on other stories
  - User Story 6 (Route Protection): Depends on User Story 2 (Auth) completion
  - User Story 4 (Task Management): Depends on User Story 2 (Auth) and User Story 6 (Route Protection) completion
  - User Story 3 (User Menu): Depends on User Story 2 (Auth) completion - Can run parallel with US4
  - User Story 5 (Task Filtering): Depends on User Story 4 (Task Management) completion
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### Critical Path (MVP)

For minimal viable product, follow this sequence:

1. Phase 1: Setup → 2. Phase 2: Foundational → 3. User Story 2 (Auth) → 4. User Story 6 (Route Protection) → 5. User Story 4 (Task Management) → 6. Phase 9: Polish (tests + validation)

**MVP Scope**: Landing Page (US1), Authentication (US2), Route Protection (US6), Task CRUD (US4)

**Optional for MVP**: User Menu (US3), Task Filtering (US5)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Server Actions before components that use them
- UI components in dependency order (task-item depends on task-list)
- Core implementation before polish

### Parallel Opportunities

- **Phase 1 (Setup)**: T003-T006 (dependencies), T008-T012 (configs) can all run in parallel
- **Phase 2 (Foundational)**: T030-T036 (shadcn components) can run in parallel after T029
- **After Foundational**: User Story 1 and User Story 2 can run in parallel
- **After US2**: User Story 3 and (User Story 6 → User Story 4) can run in parallel
- **Tests within story**: All tests marked [P] can run in parallel
- **Server Actions (US4)**: T070-T074 can run in parallel

---

## Parallel Example: User Story 4 (Task Management)

```bash
# Launch all E2E tests together (write first, verify they FAIL):
Task: "Create E2E test for task creation with optimistic UI in frontend/__tests__/e2e/task-create.spec.ts"
Task: "Create E2E test for task update flow in frontend/__tests__/e2e/task-update.spec.ts"
Task: "Create E2E test for task deletion with confirmation in frontend/__tests__/e2e/task-delete.spec.ts"
Task: "Create E2E test for task toggle completion in frontend/__tests__/e2e/task-toggle.spec.ts"
Task: "Create E2E test for error handling and rollback in frontend/__tests__/e2e/task-error-handling.spec.ts"

# After tests fail, launch all Server Actions together:
Task: "Create Server Action for fetching tasks in frontend/actions/tasks.ts"
Task: "Create Server Action for creating tasks in frontend/actions/tasks.ts"
Task: "Create Server Action for updating tasks in frontend/actions/tasks.ts"
Task: "Create Server Action for deleting tasks in frontend/actions/tasks.ts"
Task: "Create Server Action for toggling task completion in frontend/actions/tasks.ts"
```

---

## Implementation Strategy

### MVP First (Recommended for Phase 2)

1. Complete Phase 1: Setup (T001-T016)
2. Complete Phase 2: Foundational (T017-T038) - CRITICAL BLOCKER
3. Complete User Story 1: Landing Page (T039-T045) - Can demo
4. Complete User Story 2: Authentication (T046-T058) - Can test auth
5. Complete User Story 6: Route Protection (T059-T064) - Dashboard secured
6. Complete User Story 4: Task Management (T065-T088) - MVP COMPLETE
7. Run Phase 9: Polish (T106-T122) for validation
8. **STOP and VALIDATE**: Test MVP independently
9. Deploy/demo if ready

**MVP Delivers**: Public landing page, user signup/signin, protected dashboard, full task CRUD with optimistic UI

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 → Test independently → Can demo auth flow
3. Add User Story 6 + 4 → Test independently → Can demo task management (MVP!)
4. Add User Story 3 → Test independently → Enhanced UX with user menu
5. Add User Story 5 → Test independently → Enhanced UX with filtering
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T038)
2. Once Foundational is done:
   - Developer A: User Story 1 (Landing Page)
   - Developer B: User Story 2 (Auth Flow)
3. After US2 completes:
   - Developer A: User Story 3 (User Menu) - parallel
   - Developer B: User Story 6 (Route Protection) → User Story 4 (Task Management)
   - Developer C: User Story 5 (Task Filtering) - waits for US4
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests first and verify they FAIL before implementing features (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths relative to `frontend/` directory in monorepo
- Use Next.js 16 patterns: Server Components default, Client Components for interactivity, Server Actions for mutations
- Use proxy.ts (NOT middleware.ts - deprecated in Next.js 16)
- Tasks are NEVER queried directly from frontend - always via Server Actions to FastAPI backend
- JWT shared secret (BETTER_AUTH_SECRET) MUST match between frontend and backend

---

**Total Tasks**: 122
**MVP Tasks**: 73 (T001-T038, T046-T064, T039-T045, T065-T088, T106-T122)
**Parallel Opportunities**: 35+ tasks marked [P]
**User Stories**: 5 (US1, US2, US3, US4, US5, US6)
**Testing Tasks**: 14 (E2E, integration, component tests)
