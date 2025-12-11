# ADR-0001: Repository Pattern for Storage Abstraction

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-08
- **Feature:** 001-todo-console-app
- **Context:** Need to support in-memory storage (Phase I) with future database migration (Phase II) while maintaining business logic separation and ensuring evolutionary architecture as required by Constitution Rule IV and FR-013.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

- **Repository Interface**: Implement `TaskRepository` as a Protocol interface with all CRUD operations
- **Implementation**: Create `InMemoryTaskRepository` using `list[Task]` storage for Phase I
- **Dependency Injection**: Inject repository into `TaskService` via constructor
- **Type Safety**: Use Protocol for type hints, not concrete implementations
- **Forward Compatibility**: Same interface will support `DatabaseTaskRepository` in Phase II

## Consequences

### Positive

- Business logic (TaskService) decoupled from storage implementation
- Easy to swap InMemoryTaskRepository for DatabaseTaskRepository in Phase II without changing business logic
- Improved testability through repository mocking in unit tests
- Supports Constitution Rule IV (Evolutionary Architecture) and FR-013 (Repository Pattern requirement)
- Enables clean separation of concerns (Constitution Rule V)

### Negative

- Adds one abstraction layer vs direct list manipulation, slightly increasing complexity
- Requires more code to implement the interface and concrete class
- May introduce performance overhead compared to direct in-memory operations (minimal for this use case)

## Alternatives Considered

- **ABC (Abstract Base Class)**: Rejected because it requires inheritance, making it less flexible than Protocol. ABC creates tighter coupling between classes and requires explicit inheritance relationships.
- **Duck Typing**: Rejected because it provides no static type checking, which violates mypy --strict requirement (Constitution Rule IX) and FR-012.
- **Direct List Manipulation**: Rejected because it would make Phase II database migration require extensive business logic changes, violating evolutionary architecture principles.

## References

- Feature Spec: /mnt/d/hackathon-todo/specs/001-todo-console-app/spec.md
- Implementation Plan: /mnt/d/hackathon-todo/specs/001-todo-console-app/plan.md
- Related ADRs: None
- Evaluator Evidence: /mnt/d/hackathon-todo/specs/001-todo-console-app/research.md

