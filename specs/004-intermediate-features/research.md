# Technical Research: Intermediate Level Organization Features

**Feature**: 004-intermediate-features
**Date**: 2025-12-14
**Status**: Complete

## Overview

This document captures the technical research and decisions made during Phase 0 of planning for the intermediate level organization features. All research findings are consolidated here to guide implementation.

---

## Research Task 1: Tag Storage Strategy

### Question
How should we store task tags to support:
- Multiple tags per task
- Tag autocomplete/suggestions
- Efficient querying and filtering
- Future tag management (rename, merge, delete)

### Options Evaluated

#### Option A: JSON Array in Task Table
**Approach**: Store tags as a JSON array column in the `tasks` table

```sql
CREATE TABLE tasks (
  ...
  tags JSONB DEFAULT '[]'
);
```

**Pros**:
- Simpler schema (no additional tables)
- Easy to add/remove tags from a single task
- PostgreSQL has good JSONB support

**Cons**:
- No referential integrity
- Harder to query "all tasks with tag X"
- No built-in way to get unique tag list across all tasks
- Difficult to implement tag autocomplete efficiently
- Cannot enforce tag naming consistency

#### Option B: PostgreSQL Array Type
**Approach**: Store tags as a TEXT[] array column

```sql
CREATE TABLE tasks (
  ...
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

**Pros**:
- Native PostgreSQL type
- Better query performance than JSON
- Can use array operators (ANY, ALL, &&)

**Cons**:
- Still no referential integrity
- Cannot enforce unique tag names across users
- No foreign key constraints
- Autocomplete requires scanning all tasks

#### Option C: Many-to-Many Relationship ✅ SELECTED
**Approach**: Use separate `tags` and `task_tags` junction table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```

**Pros**:
- Proper data normalization
- Referential integrity via foreign keys
- Easy to query tags and their usage counts
- Efficient autocomplete (just query `tags` table)
- Supports future features (tag rename, merge, delete)
- Can easily find "all tasks with tag X"
- PostgreSQL join performance is excellent

**Cons**:
- More complex schema (3 tables instead of 1)
- Requires join queries for tasks with tags
- Slightly more complex insert/update logic

### Decision: Option C (Many-to-Many) ✅

**Rationale**:
The additional complexity of many-to-many relationship is justified by:
1. **Data integrity**: Foreign key constraints ensure tags are properly managed
2. **Query efficiency**: Autocomplete is a simple SELECT on tags table
3. **Scalability**: PostgreSQL handles joins efficiently even with 1000s of tasks
4. **Future-proof**: Enables tag management features without schema changes

**Trade-off**:
Slightly more complex queries and insert logic, but significantly better long-term maintainability and feature extensibility.

---

## Research Task 2: Filter/Sort Implementation Strategy

### Question
Where should filtering and sorting logic be implemented?

### Options Evaluated

#### Option A: Client-Side Filtering/Sorting
**Approach**: Fetch all tasks, filter/sort in browser

**Pros**:
- Simple backend (just return all tasks)
- No complex SQL queries
- Instant results (no network latency)

**Cons**:
- Doesn't scale beyond ~200 tasks
- Wastes network bandwidth (send all tasks)
- Doesn't support server-side pagination
- Poor performance on mobile devices

#### Option B: Database-Level Filtering/Sorting ✅ SELECTED
**Approach**: Build dynamic SQL queries with WHERE and ORDER BY clauses

**Pros**:
- Scales to 1000s of tasks
- Leverages PostgreSQL indexes
- Supports efficient pagination
- Offloads processing to database
- Returns only requested data (efficient network usage)

**Cons**:
- More complex SQL queries
- Requires careful index design
- Dynamic query building requires validation

**Query Example**:
```sql
SELECT t.* FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
LEFT JOIN tags tg ON tt.tag_id = tg.id
WHERE t.user_id = $1
  AND ($2 OR t.completed = $3)  -- status filter
  AND ($4 OR t.priority = $5)   -- priority filter
  AND ($6 OR tg.name = ANY($7)) -- tags filter
  AND ($8 OR t.title ILIKE $9 OR t.description ILIKE $9) -- search
ORDER BY
  CASE WHEN $10 = 'due_date_soonest' THEN t.due_date END ASC NULLS LAST,
  CASE WHEN $10 = 'created_newest' THEN t.created_at END DESC,
  ...
LIMIT $11 OFFSET $12;
```

#### Option C: Hybrid (Fetch Recent, Client-Side Filter)
**Approach**: Fetch last 100 tasks, filter client-side

**Pros**:
- Balances simplicity and performance

**Cons**:
- Adds unnecessary complexity
- Doesn't solve scalability problem
- Confusing UX (what if filter excludes recent tasks?)

### Decision: Option B (Database-Level) ✅

**Rationale**:
Database-level filtering is the industry standard for CRUD applications because:
1. **Scalability**: Supports 1000+ tasks without degradation
2. **Performance**: PostgreSQL query planner optimizes queries
3. **Indexes**: Can leverage composite indexes for fast filtering
4. **Pagination**: Essential for mobile and large lists

**Trade-off**:
More complex SQL queries, but this is a solved problem with well-documented patterns (SQLAlchemy, SQLModel query builders).

---

## Research Task 3: Calendar Component Selection

### Question
Which calendar/date picker component should we use for due dates?

### Options Evaluated

#### Option A: Native HTML5 `<input type="date">`
**Pros**:
- Zero dependencies
- Native browser support
- Accessible

**Cons**:
- Inconsistent styling across browsers
- Limited customization
- Poor UX on some browsers (especially Safari)

#### Option B: React-DatePicker
**Pros**:
- Popular, well-maintained
- Highly customizable

**Cons**:
- Another dependency
- Not styled by default (requires custom CSS)
- Not part of existing UI system

#### Option C: Shadcn UI Calendar ✅ SELECTED
**Pros**:
- Already using Shadcn UI in the project
- Consistent styling with existing components
- Built on Radix UI (accessible)
- TypeScript-friendly
- Composable (can customize easily)
- Includes date-fns for date handling

**Cons**:
- Requires adding calendar component via CLI
- Slightly larger bundle size than native input

**Installation**:
```bash
npx shadcn@latest add calendar
```

**Dependencies**:
- `react-day-picker` (peer dependency)
- `date-fns` (already used in project for date formatting)

### Decision: Option C (Shadcn UI Calendar) ✅

**Rationale**:
Shadcn UI is already integrated in the frontend. Using the calendar component ensures:
1. **Consistency**: Matches existing UI design system
2. **Accessibility**: Built on Radix UI primitives
3. **Type Safety**: Full TypeScript support
4. **Maintainability**: Same versioning/update process as other Shadcn components

---

## Research Task 4: Priority Field Type

### Question
How should priority be stored and represented?

### Options Evaluated

#### Option A: Integer (0, 1, 2)
**Pros**:
- Compact storage (4 bytes)
- Easy numerical sorting

**Cons**:
- Not human-readable in database queries
- Harder to debug (what does "1" mean?)
- Requires mapping in code

#### Option B: PostgreSQL ENUM Type
**Pros**:
- Type-safe at database level
- Enforced values
- Human-readable

**Cons**:
- Harder to migrate (ALTER TYPE requires locks)
- Less flexible for adding new priorities
- More complex Alembic migrations

#### Option C: String Enum (TEXT with CHECK constraint) ✅ SELECTED
**Pros**:
- Human-readable in database
- Easy to query and debug
- Simple to add new priorities (just update CHECK)
- Works well with SQLModel enums
- Clear in logs and error messages

**Cons**:
- Slightly larger storage (vs integer)
- Requires CHECK constraint for validation

**Implementation**:
```sql
CREATE TABLE tasks (
  ...
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('High', 'Medium', 'Low'))
);
```

**TypeScript**:
```typescript
enum TaskPriority {
  High = "High",
  Medium = "Medium",
  Low = "Low"
}
```

### Decision: Option C (String Enum) ✅

**Rationale**:
String enums provide the best balance of:
1. **Readability**: Clear in database queries and logs
2. **Flexibility**: Easy to add new priorities via migration
3. **Validation**: CHECK constraint enforces valid values
4. **Debugging**: No need to remember integer mappings

**Trade-off**:
~10 bytes per row vs 4 bytes for integer, but this is negligible for 1000 tasks.

---

## Research Task 5: Due Date Storage and Handling

### Question
How should due dates be stored and formatted?

### Options Evaluated

#### Option A: TIMESTAMP WITH TIME ZONE
**Pros**:
- Full precision (date + time)
- Timezone-aware

**Cons**:
- Spec explicitly excludes time component
- Timezone complexity
- Overkill for task due dates

#### Option B: DATE Type ✅ SELECTED
**Pros**:
- Matches spec (dates only, no times)
- Simpler UX (no timezone issues)
- Adequate precision for task deadlines
- Smaller storage (4 bytes vs 8 bytes)

**Cons**:
- Cannot support time-based scheduling (out of scope)

**API Format**: ISO 8601 date string (YYYY-MM-DD)
```json
{
  "due_date": "2025-12-31"
}
```

**Frontend**: Shadcn calendar returns Date object, format to YYYY-MM-DD before API call

### Decision: Option B (DATE Type) ✅

**Rationale**:
The specification explicitly states "Due dates include only dates, not times" (Out of Scope section). DATE type perfectly matches this requirement and avoids timezone complexity.

---

## Best Practices Identified

### 1. SQLModel Indexing for Performance

**Indexes to Add**:
```python
# Composite index for common filter combinations
Index("ix_tasks_user_priority_due", "user_id", "priority", "due_date")

# Index for tag-based filtering (on junction table)
Index("ix_task_tags_tag_id", "tag_id")

# Index for autocomplete (on tags table)
Index("ix_tags_user_name", "user_id", "name")
```

**Rationale**:
- Composite index supports queries filtering by user + priority + due date
- Tag indexes enable fast JOIN operations
- Separate indexes for different access patterns

### 2. FastAPI Query Parameter Handling

**Use Pydantic Model for Complex Params**:
```python
class TaskQueryParams(BaseModel):
    status: Literal["all", "pending", "completed"] = "all"
    priority: Literal["all", "high", "medium", "low"] = "all"
    tags: list[str] = []
    search: str | None = None
    sort_by: str = "created_newest"
    limit: int = Field(default=50, le=100)
    offset: int = Field(default=0, ge=0)
```

**Rationale**:
- Type-safe validation
- Auto-generated OpenAPI docs
- Clear error messages

### 3. React State Management for Filters

**Use URL Search Params**:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const priority = searchParams.get('priority') || 'all';
const tags = searchParams.getAll('tags');
```

**Rationale**:
- Enables deep linking (share filtered view)
- Browser back/forward works correctly
- No additional state management library needed

### 4. Search Input Debouncing

**Debounce Search to Reduce API Calls**:
```typescript
const debouncedSearch = useDebouncedValue(searchInput, 300);

useEffect(() => {
  // Fetch tasks with debouncedSearch
}, [debouncedSearch]);
```

**Rationale**:
- Reduce API calls while user types
- Better UX (less flickering)
- Standard web pattern (300ms delay)

### 5. Tag Autocomplete Strategy

**Return Top 10 Most-Used Tags**:
```sql
SELECT name, COUNT(*) as usage_count
FROM tags t
JOIN task_tags tt ON t.id = tt.tag_id
WHERE t.user_id = $1
GROUP BY t.id, name
ORDER BY usage_count DESC, name ASC
LIMIT 10;
```

**Rationale**:
- Users typically have 5-20 active tags
- Most-used tags are most relevant
- Alphabetical secondary sort for consistency

---

## Technical Decisions Summary

| Decision Area | Choice | Key Reason |
|---------------|--------|------------|
| Tag Storage | Many-to-many relationship | Referential integrity + future extensibility |
| Filter/Sort | Database-level (SQL queries) | Scalability and performance |
| Calendar UI | Shadcn UI Calendar | Consistency with existing UI system |
| Priority Type | String enum (TEXT + CHECK) | Human-readable + flexible |
| Due Date Type | DATE (no time component) | Matches spec requirements |
| Query Params | Pydantic models | Type safety + validation |
| Search State | URL search params | Deep linking + browser history |
| Search Debounce | 300ms delay | Reduce API calls |
| Tag Autocomplete | Top 10 by usage | Relevance + UX |

---

## Dependencies Added

### Backend
- None (existing dependencies sufficient: SQLModel, FastAPI, Alembic)

### Frontend
- Shadcn UI Calendar: `npx shadcn@latest add calendar`
- Peer dependencies: `react-day-picker`, `date-fns` (auto-installed)

---

## Risks and Mitigation

### Risk 1: Complex SQL Queries
**Mitigation**: Use SQLModel query builder, write comprehensive tests

### Risk 2: Tag Autocomplete Performance
**Mitigation**: Limit to 10 results, add database index on tags

### Risk 3: Frontend Bundle Size (Calendar Component)
**Mitigation**: Shadcn components are tree-shakeable, minimal impact

---

**Research Complete**: 2025-12-14
**Next Phase**: Phase 1 - Data Model Design
**Status**: ✅ All technical decisions made and documented
