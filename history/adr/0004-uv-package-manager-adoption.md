# ADR-0003: uv Package Manager Adoption

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted (Constitutional Requirement)
- **Date:** 2025-12-08
- **Feature:** 001-todo-console-app
- **Context:** Constitution Section 4 mandates uv usage for Python projects. Need fast dependency resolution, lock file management, and Python version management for efficient development workflow.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security?
     2) Alternatives: Multiple viable options considered with tradeoffs?
     3) Scope: Cross-cutting concern (not an isolated detail)?
     If any are false, prefer capturing as a PHR note instead of an ADR. -->

## Decision

- **Package Manager**: Use uv for all dependency management and project initialization
- **Project Initialization**: Use `uv init` to create standard Python project structure with pyproject.toml
- **Dependency Resolution**: Use `uv sync` for reproducible installations with lock file support
- **Python Management**: Pin Python version with `.python-version` file and use `uv python install` for version management
- **Lock Files**: Automatic lock file generation and management by default

## Consequences

### Positive

- 10-100x faster than pip for dependency resolution and installation
- Built-in virtual environment management without need for venv/pipenv
- Lock file management by default ensures reproducible builds
- Python version management with automatic selection and installation
- Standard pyproject.toml configuration aligns with PEP 621
- Better integration with modern Python tooling ecosystem
- Aligns with constitutional requirements (Immutable Tech Stack Rule IV)

### Negative

- Relatively new tool with less ecosystem maturity than pip/poetry
- Potential compatibility issues with older Python packages or tools
- Learning curve for team members familiar with pip/pipenv workflows
- May have fewer plugins or integrations compared to mature tools

## Alternatives Considered

- **pip**: Rejected because it lacks lock file management, slower dependency resolution, and doesn't meet constitutional requirements for uv adoption.
- **poetry**: Rejected because it's slower than uv, not specified in Constitution, and has more complex configuration requirements.
- **pipenv**: Rejected because it's slower than uv, has maintenance issues, and doesn't meet constitutional requirements.

## References

- Feature Spec: /mnt/d/hackathon-todo/specs/001-todo-console-app/spec.md
- Implementation Plan: /mnt/d/hackathon-todo/specs/001-todo-console-app/plan.md
- Related ADRs: None
- Evaluator Evidence: /mnt/d/hackathon-todo/specs/001-todo-console-app/research.md

