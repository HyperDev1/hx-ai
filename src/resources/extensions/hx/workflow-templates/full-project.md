# Full Project Workflow

<template_meta>
name: full-project
version: 1
requires_project: true
artifact_dir: .hx/
</template_meta>

<purpose>
The complete HX workflow with full ceremony: roadmap, milestones, slices, tasks,
research, planning, execution, and verification. Use for greenfield projects or
major features that need the full planning apparatus.

This template wraps the existing HX workflow for registry completeness.
When selected, it routes to the standard /hx init → /hx auto pipeline.
</purpose>

<phases>
1. init    — Initialize project, detect stack, create .hx/
2. discuss — Define requirements, decisions, and architecture
3. plan    — Create roadmap with milestones and slices
4. execute — Execute slices: research → plan → implement → verify per slice
5. verify  — Milestone-level verification and completion
</phases>

<process>

## Routing to Standard HX

This template is a convenience entry point. When selected via `/hx start full-project`,
it should route to the standard HX workflow:

1. If `.hx/` doesn't exist: Run `/hx init` to bootstrap the project
2. If `.hx/` exists but no milestones: Start the discuss phase via `/hx discuss`
3. If milestones exist: Resume via `/hx auto` or `/hx next`

The full HX workflow protocol is defined in `HX-WORKFLOW.md` and handles all
phases, state tracking, and agent orchestration.

</process>
