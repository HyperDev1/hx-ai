---
version: 1
mode: solo
models:
  research: claude-sonnet-4-6
  planning: claude-opus-4-6
  execution: claude-sonnet-4-6
  completion: claude-sonnet-4-6
skill_discovery: suggest
skill_staleness_days: 0
uat_dispatch: false
unique_milestone_ids: true
cmux:
  enabled: false
  notifications: false
  sidebar: false
  splits: false
  browser: false
git:
  auto_push: false
  push_branches: false
  snapshots: true
  pre_merge_check: auto
  merge_strategy: squash
  main_branch: main
  isolation: worktree
phases:
  skip_research: false
  skip_reassess: false
  skip_slice_research: false
  reassess_after_slice: false
language: tr
---

# GSD Skill Preferences

See `~/.gsd/agent/extensions/gsd/docs/preferences-reference.md` for full field documentation and examples.
