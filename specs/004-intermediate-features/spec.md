# Feature Specification: Intermediate Level Organization Features

**Feature Branch**: `004-intermediate-features`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "add "Intermediate Level functinalities" to todo website to make it polished and practical.

1. **Priorities & Tags/Categories:**
- Allow assigning levels (High, Medium, Low) to tasks.
- Allow assigning labels/tags (e.g., "work", "home") to tasks.
- Update the UI to select these when creating/editing and display them on the task card.

2. **Search & Filter:**
- Add a search bar to filter tasks by keyword.
- Add filter controls to filter by Status, Priority, or Date.

3. **Sort Tasks:**
- Add sorting controls to reorder tasks by:
- Due Date (Newest/Oldest)
- Priority (High to Low)
- Alphabetically (A-Z)

update Database, Backend and Frontend for these"

## User Scenarios & Testing

### User Story 1 - Task Prioritization and Due Dates (Priority: P1)

As a busy user managing multiple tasks, I need to assign priority levels (High, Medium, Low) and due dates to my tasks so that I can quickly identify which tasks need immediate attention and when they need to be completed.

**Why this priority**: Priority levels and due dates are fundamental to effective task management and provide immediate value by helping users focus on what matters most and when. This is the cornerstone feature that makes the todo app practical for real-world use.

**Independent Test**: Can be fully tested by creating a task with a priority level and due date, viewing the task list to see priority indicators and due dates, and filtering/sorting by these attributes. Delivers immediate value by letting users categorize task urgency and deadlines.

**Acceptance Scenarios**:

1. **Given** I am creating a new task, **When** I select "High" priority from the dropdown and choose a due date from the calendar picker, **Then** the task is saved with High priority and the selected due date, both displaying clearly on the task card
2. **Given** I am creating a new task, **When** I select "High" priority from the dropdown without setting a due date, **Then** the task is saved with High priority and no due date (optional field)
3. **Given** I am editing an existing task, **When** I change the priority from Medium to Low via the dropdown selector, **Then** the task updates and shows the new priority indicator
4. **Given** I am editing an existing task, **When** I add or change the due date, **Then** the task updates and displays the new due date
5. **Given** I have tasks with different priorities, **When** I view my task list, **Then** each task clearly displays its priority level with color-coded indicators (High=red, Medium=yellow, Low=green)
6. **Given** I have no priority selected, **When** I create a task, **Then** the task defaults to Medium priority
7. **Given** I am selecting a due date, **When** I open the date picker, **Then** a calendar sheet appears allowing me to select any date
8. **Given** I am viewing the task form, **When** I see the priority and due date controls, **Then** they are displayed side-by-side on the same line for efficient form layout

---

### User Story 2 - Task Categorization with Tags (Priority: P2)

As a user juggling work and personal responsibilities, I need to assign tags/categories (like "work", "home", "errands") to tasks so that I can organize tasks by context and see related tasks together.

**Why this priority**: Tags enable contextual organization which is essential for users managing tasks across different life domains. This adds significant organizational value but is slightly less critical than priority levels.

**Independent Test**: Can be fully tested by creating tasks with different tags, viewing tasks to see tag labels, and filtering by specific tags to confirm proper grouping. Delivers value by enabling context-based task management.

**Acceptance Scenarios**:

1. **Given** I am creating a new task, **When** I add tags "work" and "urgent", **Then** the task is saved with both tags visible on the task card
2. **Given** I am editing a task, **When** I add or remove tags, **Then** the task updates and reflects the new tag set
3. **Given** I have tasks with various tags, **When** I view my task list, **Then** each task displays its tags as colored badges or labels
4. **Given** I am creating a task, **When** I type a new tag that doesn't exist yet, **Then** the system creates and applies the new tag
5. **Given** I have previously used certain tags, **When** I start typing a tag, **Then** the system suggests matching existing tags for quick selection

---

### User Story 3 - Search and Filter Tasks (Priority: P3)

As a user with many tasks, I need to search by keyword and filter by status, priority, or tags so that I can quickly find specific tasks without scrolling through the entire list.

**Why this priority**: Search and filtering dramatically improve usability as task lists grow, but users need tasks and organization (priorities/tags) first before filtering becomes valuable.

**Independent Test**: Can be fully tested by creating multiple tasks with different attributes, then using search/filter controls to verify correct results appear. Delivers value by enabling quick task discovery.

**Acceptance Scenarios**:

1. **Given** I have multiple tasks in my list, **When** I type "groceries" in the search bar, **Then** only tasks containing "groceries" in title or description are displayed
2. **Given** I am viewing my task list, **When** I filter by "High" priority, **Then** only High priority tasks are shown
3. **Given** I am viewing my task list, **When** I filter by "work" tag, **Then** only tasks tagged with "work" are shown
4. **Given** I am viewing my task list, **When** I filter by "Completed" status, **Then** only completed tasks are shown
5. **Given** I have applied multiple filters (priority + tag), **When** I view results, **Then** only tasks matching ALL selected filters are displayed
6. **Given** I have active filters applied, **When** I click "Clear Filters", **Then** all tasks are shown again
7. **Given** I type in the search box, **When** the results update, **Then** the filtering happens in real-time without requiring a button click

---

### User Story 4 - Sort Tasks (Priority: P4)

As a user who wants to organize my view, I need to sort tasks by due date, creation date, priority level, or alphabetically so that I can view tasks in the order that makes most sense for my current needs.

**Why this priority**: Sorting enhances the viewing experience but is less critical than the core organization features (priorities, tags, and filtering). Users can manually scan lists if needed.

**Independent Test**: Can be fully tested by creating tasks with different attributes, then clicking sort controls to verify the list reorders correctly. Delivers value by providing flexible view customization.

**Acceptance Scenarios**:

1. **Given** I have tasks with different due dates, **When** I select "Due Date (Soonest)", **Then** tasks are reordered with the soonest due dates at the top, and tasks without due dates at the bottom
2. **Given** I have tasks created at different times, **When** I select "Created (Newest)", **Then** tasks are reordered with the most recently created tasks at the top
3. **Given** I have tasks created at different times, **When** I select "Created (Oldest)", **Then** tasks are reordered with the oldest created tasks at the top
4. **Given** I have tasks with different priorities, **When** I select "Priority (High to Low)", **Then** tasks are reordered with High priority first, then Medium, then Low
5. **Given** I have tasks with different titles, **When** I select "Alphabetical (A-Z)", **Then** tasks are reordered alphabetically by title from A to Z
6. **Given** I have applied a sort order, **When** I create a new task, **Then** the new task appears in the correct position according to the active sort
7. **Given** I have sorted tasks, **When** I change the sort option, **Then** the list immediately reorders without page refresh

---

### Edge Cases

- What happens when a user searches and no tasks match the keyword?
- How does the system handle filtering when no tasks match the selected criteria?
- What happens when a task has no priority set (should default to Medium)?
- What happens when a task has no due date set (optional field)?
- How does the system handle tasks with no tags versus tasks with multiple tags?
- What happens when sorting tasks by "Due Date (Soonest)" when some tasks have no due dates? (Place tasks without due dates at the bottom)
- What happens when sorting tasks by "Created" when tasks have the exact same creation timestamp?
- How does the system handle very long tag names or many tags on a single task?
- What happens when a user applies contradictory filters?
- How does search handle partial matches, special characters, or case sensitivity?
- What happens when a user selects a due date in the past?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to assign one of three priority levels (High, Medium, Low) to each task
- **FR-002**: System MUST default new tasks to Medium priority if no priority is explicitly selected
- **FR-003**: System MUST display priority levels with distinct visual indicators (color, icon, or badge) on task cards
- **FR-004**: System MUST allow users to add multiple tags/categories to a single task
- **FR-005**: System MUST allow users to create new tags on-the-fly when creating or editing tasks
- **FR-006**: System MUST suggest existing tags when users start typing to encourage tag reuse
- **FR-007**: System MUST display all assigned tags on each task card as colored badges or labels
- **FR-008**: System MUST allow users to set an optional due date for each task using a calendar date picker
- **FR-009**: System MUST display the due date on the task card when set
- **FR-010**: System MUST allow users to clear or remove a due date from a task
- **FR-011**: System MUST persist all task data (priority, tags, due date) to the database
- **FR-012**: System MUST provide a search input that filters tasks in real-time by keyword matching against task title and description
- **FR-013**: System MUST provide filter controls for Status (All, Pending, Completed)
- **FR-014**: System MUST provide filter controls for Priority (All, High, Medium, Low)
- **FR-015**: System MUST provide filter controls for Tags (allow selecting one or more tags)
- **FR-016**: System MUST apply multiple filters simultaneously using AND logic (task must match all selected filters)
- **FR-017**: System MUST provide a "Clear Filters" action to reset all active filters
- **FR-018**: System MUST provide sort options: "Due Date (Soonest)", "Created (Newest)", "Created (Oldest)", "Priority (High to Low)", "Alphabetical (A-Z)"
- **FR-019**: System MUST immediately reorder the task list when a sort option is selected without page refresh
- **FR-020**: System MUST maintain the active sort order when new tasks are created or existing tasks are updated
- **FR-021**: System MUST handle tasks with missing sort values (e.g., tasks without due dates) by placing them at the end when sorting by that field
- **FR-022**: System MUST display a clear message when search or filter results return zero tasks
- **FR-023**: System MUST persist user's last selected priority and tags when creating multiple tasks in succession
- **FR-024**: System MUST perform case-insensitive search matching

### Key Entities

- **Task**: Core entity representing a todo item
  - Has one priority level (High, Medium, or Low) - defaults to Medium
  - Can have zero or more tags/categories
  - Has a title, description, completion status
  - Has a created date (created_at) - automatically set on task creation
  - Has an updated date (updated_at) - automatically updated on task modification
  - Has an optional due date (due_date) - user-selectable via calendar picker

- **Tag**: Represents a category or label that can be applied to tasks
  - Has a unique name (e.g., "work", "home", "urgent")
  - Can be applied to multiple tasks
  - Has a color or visual identifier for UI display
  - Created dynamically by users

- **Priority**: Enumeration of urgency levels
  - Three levels: High, Medium, Low
  - Each level has an associated visual indicator (color, icon)
  - Used for both organizing tasks and sorting/filtering

## Implementation Notes

### UI Components Implemented
- **Priority Selector**: Dropdown Select component (not button group) with color-coded dots (High=red, Medium=yellow, Low=green)
- **Due Date Picker**: Calendar sheet component using Shadcn UI with "Clear due date" button
- **Task Form Layout**: Priority selector and due date picker displayed side-by-side in 2-column grid
- **Header Simplification**: Dashboard button removed from header (user accesses dashboard via direct navigation)

### Code Quality Standards Applied
- All TypeScript `any` types replaced with proper error types
- All HTML entities properly escaped (`&apos;`, `&quot;`)
- ESLint errors: 0 (down from 17)
- ES module imports used throughout (no require())

### Docker Configuration
- Multi-stage builds for frontend and backend
- Proper .dockerignore files to exclude build artifacts and tests
- Docker networks configured for inter-container communication
- API URL uses service names in docker-compose (`http://backend:8000`)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can assign a priority level to a task in under 5 seconds during task creation
- **SC-002**: Users can identify the priority of any task at a glance without reading the full task details (visual indicators must be distinct and clear)
- **SC-003**: Users can add multiple tags to a task and see all tags displayed on the task card
- **SC-004**: Users can select a due date for a task in under 10 seconds using the calendar picker
- **SC-005**: Users can identify tasks with due dates at a glance on the task list
- **SC-006**: Users can find a specific task by keyword search in under 10 seconds when the list contains 50+ tasks
- **SC-007**: Users can filter to see only high-priority tasks with a single click or selection
- **SC-008**: Users can combine multiple filters (e.g., High priority + work tag + Pending status) and see accurate results
- **SC-009**: Users can change the sort order and see the task list reorder in under 1 second
- **SC-010**: Tasks maintain their current sort order when new tasks are added or existing tasks are edited
- **SC-011**: Zero tasks matching search/filter criteria displays a helpful message, not a blank screen
- **SC-012**: 90% of users successfully use priority levels within their first session of task creation
- **SC-013**: Tag suggestions appear within 1 second of typing to encourage tag reuse and consistency
- **SC-014**: All task data (priority, tags, due_date) persists to the database and survives page refresh and logout/login cycles

### User Experience Goals

- Priority indicators are immediately recognizable through color coding and/or icons
- Due date picker provides an intuitive calendar interface (using Shadcn UI calendar component)
- Due dates are displayed clearly on task cards with appropriate formatting
- Tag entry supports both selecting existing tags and creating new ones seamlessly
- Search provides instant feedback as the user types (no search button required)
- Filter controls are always visible and indicate active filter state
- Sort controls clearly show the current sort order
- The interface remains responsive and fast even with 100+ tasks
- Task form includes clear inputs for Priority, Tags/Categories, and Due Date

## Assumptions

- Users are already familiar with basic task management (creating, editing, deleting tasks)
- The application will support a reasonable number of tags per user (up to 50 unique tags without performance degradation)
- Search is limited to title and description fields (not comments or other metadata)
- Priority colors will follow standard conventions (red/high, yellow/medium, green or blue/low)
- Tag colors can be auto-generated or manually chosen by users
- The system will support up to 1000 tasks per user without performance issues when filtering/sorting
- **All task data (priority, tags, due_date) is persisted to the database** - this is a full-stack application with permanent storage
- Filter and sort selections are session-based UI state (not persisted across logins unless explicitly saved as a user preference in future iterations)
- The calendar picker will use Shadcn UI calendar component for date selection
- Due dates can be set to any date (past, present, or future) - the system will not prevent past dates

## Dependencies

- Basic task CRUD operations must already be implemented (from Phase II)
- User authentication must be functional to associate tasks, priorities, and tags with specific users
- Database schema must support adding priority, tags, and due_date fields to the Task model
- Database schema must support a many-to-many relationship between Tasks and Tags (or JSON array of tags)
- Backend API must support query parameters for filtering (status, priority, tags) and sorting (due_date, created_at, priority, title)
- Frontend must support real-time UI updates for search/filter results
- Shadcn UI calendar component must be available for date picking

## Out of Scope

- Advanced filtering logic (OR conditions, complex queries)
- Saved filter presets or custom views
- Bulk operations (e.g., applying a tag to multiple tasks at once)
- Tag management interface (renaming, deleting, or merging tags)
- Analytics or insights based on priorities and tags
- Recurring tasks or automated reminders based on due dates
- Notifications or alerts when tasks approach their due date
- Collaborative features (sharing tags across users)
- Tag hierarchies or nested categories
- Time-based scheduling (due dates include only dates, not times)
