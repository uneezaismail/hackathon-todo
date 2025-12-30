# Research: Calendar View, Recurring Tasks & Analytics

**Feature**: 007-calendar-recurring-analytics
**Date**: 2025-12-27
**Status**: Complete

## Research Topics

### 1. Calendar Library Selection

**Question**: Which React calendar library to use?

**Options Evaluated**:

| Library | GitHub Stars | Weekly Downloads | License | Pros | Cons |
|---------|-------------|------------------|---------|------|------|
| react-big-calendar | 8,500+ | ~500k | MIT | React-native, free, good performance | Basic styling, no built-in drag-drop |
| FullCalendar | 19,000+ | ~1M | MIT (Standard) | Feature-rich, premium features | Premium tier expensive, dated UI |
| Schedule-X | ~500 | ~10k | MIT | Material design, drag-drop built-in | Smaller community |

**Decision**: **react-big-calendar**

**Rationale**:
- 100% free and open-source (no premium tier needed)
- React-native design fits existing codebase
- Good performance with large event counts
- Active maintenance (8,500+ GitHub stars)
- Works well with date-fns (already installed)

**Alternatives Rejected**:
- FullCalendar: Premium features locked behind paywall
- Schedule-X: Smaller community, less documentation

---

### 2. Recurring Tasks Database Design

**Question**: How to store recurring task patterns?

**Options Evaluated**:

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| Pattern Storage | Store recurrence rule, generate instances on-demand | Space efficient, infinite recurrence | Requires calculation logic |
| Instance Pre-generation | Create all instances upfront | Simple queries | Space explosion, finite horizon |
| Hybrid | Store pattern + next N instances | Balance of both | Complex sync logic |

**Decision**: **Pattern Storage (Expert Approach)**

**Rationale**:
- Space-efficient: Only store the pattern, not thousands of instances
- Infinite recurrence: No arbitrary end date required
- On-demand generation: Create next instance when current is completed
- Industry standard: Google Calendar, Outlook use this approach

**Implementation**:
```python
# Add to Task model (no new table needed)
is_recurring: bool = False
recurrence_type: str | None  # "daily", "weekly", "monthly", "yearly"
recurrence_interval: int = 1  # every N periods
recurrence_days: str | None  # "mon,wed,fri" for weekly
recurrence_end_date: date | None
max_occurrences: int | None
parent_task_id: UUID | None  # links instances to original
occurrence_count: int = 0
```

**Alternatives Rejected**:
- Instance Pre-generation: Would create storage issues for indefinite recurring tasks
- Separate RecurrencePattern table: Unnecessary complexity for simple patterns

---

### 3. Analytics Visualization Library

**Question**: How to implement completion heatmap?

**Options Evaluated**:

| Library | Integration | License | Features |
|---------|-------------|---------|----------|
| Recharts (extend) | Already installed | MIT | Can build custom heatmap |
| cal-heatmap | Additional dep | MIT | GitHub-style heatmap |
| Custom SVG | No dependency | N/A | Full control |

**Decision**: **Extend Recharts**

**Rationale**:
- Already installed in project
- Consistent styling with existing charts
- No additional dependencies
- Can create custom ScatterChart with custom shapes for heatmap effect

**Implementation Approach**:
```typescript
// Use Recharts ScatterChart with custom cell renderer
// Each day = one data point
// Color intensity based on task completion count
```

**Alternatives Rejected**:
- cal-heatmap: Additional dependency for one component
- Custom SVG: More development effort

---

### 4. Date Range Filter Implementation

**Question**: How to implement analytics date filtering?

**Decision**: **Client-side filtering with predefined ranges**

**Rationale**:
- Analytics already fetch all tasks in one call
- Filtering is fast with ~1000 tasks
- Predefined ranges (week/month/quarter) are most useful
- Custom range uses existing date picker components

**Predefined Ranges**:
- This Week (Mon-Sun)
- Last 7 Days
- This Month
- Last 30 Days
- This Quarter
- Last 90 Days
- This Year
- Custom (date picker)

---

### 5. react-big-calendar Integration

**Question**: How to integrate with existing task data?

**Decision**: **Transform tasks to calendar events in component**

**Event Mapping**:
```typescript
const calendarEvents = tasks
  .filter(task => task.due_date)
  .map(task => ({
    id: task.id,
    title: task.title,
    start: parseISO(task.due_date),
    end: parseISO(task.due_date),
    allDay: true,
    resource: task, // Full task object for details
  }));
```

**Styling by Priority**:
```typescript
const eventStyleGetter = (event) => ({
  style: {
    backgroundColor: priorityColors[event.resource.priority],
  }
});
```

---

### 6. Recurring Task Instance Generation

**Question**: When to generate next occurrence?

**Decision**: **On task completion**

**Flow**:
1. User completes recurring task
2. TaskService.complete_task() is called
3. Check if task is recurring
4. If yes, call RecurringService.generate_next_occurrence()
5. New task created with next due date
6. Original task marked as completed (preserved in history)

**Next Due Date Calculation**:
```python
def calculate_next_due_date(task: Task) -> date:
    current = task.due_date
    interval = task.recurrence_interval

    match task.recurrence_type:
        case "daily":
            return current + timedelta(days=interval)
        case "weekly":
            # Find next matching day
            return find_next_weekday(current, task.recurrence_days, interval)
        case "monthly":
            return current + relativedelta(months=interval)
        case "yearly":
            return current + relativedelta(years=interval)
```

---

### 7. MCP Tool Extensions

**Question**: How to extend existing MCP tools for recurring tasks?

**Decision**: **Extend add_task tool, add new tools**

**Extended Tool**:
```python
@mcp.tool()
def add_task(
    user_id: str,
    title: str,
    description: str = "",
    priority: str = "Medium",
    due_date: str | None = None,
    tags: list[str] = [],
    # NEW recurrence parameters
    is_recurring: bool = False,
    recurrence_type: str | None = None,  # daily/weekly/monthly/yearly
    recurrence_interval: int = 1,
    recurrence_days: str | None = None,  # mon,wed,fri
) -> dict:
    ...
```

**New Tools**:
```python
@mcp.tool()
def list_recurring_tasks(user_id: str) -> dict:
    """List all recurring task patterns for a user."""
    ...

@mcp.tool()
def stop_recurrence(user_id: str, task_id: str) -> dict:
    """Stop a recurring task from generating new instances."""
    ...
```

---

## Summary

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Calendar Library | react-big-calendar | Free, React-native, good community |
| Recurring Storage | Pattern Storage | Space-efficient, infinite recurrence |
| Heatmap | Extend Recharts | No new dependencies |
| Date Filter | Client-side | Fast with expected data size |
| Instance Generation | On completion | Simple, predictable |
| MCP Tools | Extend + new | Consistent with existing patterns |

All research topics resolved. No [NEEDS CLARIFICATION] remaining.
