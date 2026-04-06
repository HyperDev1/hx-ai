#!/usr/bin/env bash
# recover-hx-1364.sh — Recovery script for issue #1364 (Linux / macOS)
#
# For Windows use the PowerShell equivalent:
#   powershell -ExecutionPolicy Bypass -File scripts\recover-hx-1364.ps1 [-DryRun]
#
# CRITICAL DATA-LOSS BUG: HX versions 2.30.0–2.35.x unconditionally added
# ".hx" to .gitignore via ensureGitignore(), causing git to report all
# tracked .hx/ files as deleted. Fixed in v2.36.0 (PR #1367).
# Three residual vectors remain on v2.36.0–v2.38.0 — see PR #1635 for details.
#
# This script:
#   1. Detects whether the repo was affected
#   2. Finds the last clean commit before the damage
#   3. Restores all deleted .hx/ files from that commit
#   4. Removes the bad ".hx" line from .gitignore (if .hx/ is tracked)
#   5. Prints a ready-to-commit summary
#
# Usage:
#   bash scripts/recover-hx-1364.sh [--dry-run]
#
# Options:
#   --dry-run   Show what would be done without making any changes
#
# Requirements: git >= 2.x, bash >= 4.x

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Args ─────────────────────────────────────────────────────────────────────

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

# ─── Helpers ──────────────────────────────────────────────────────────────────

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
ok()      { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
section() { echo -e "\n${BOLD}$*${RESET}"; }

die() {
  error "$*"
  exit 1
}

# Run or print-only depending on --dry-run
run() {
  if $DRY_RUN; then
    echo -e "  ${YELLOW}(dry-run)${RESET} $*"
  else
    eval "$*"
  fi
}

# ─── Preflight ────────────────────────────────────────────────────────────────

section "── Preflight ───────────────────────────────────────────────────────"

# Must be run from a git repo root
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  die "Not inside a git repository. Run this from your project root."
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
info "Repo root: $REPO_ROOT"

if $DRY_RUN; then
  warn "DRY-RUN mode — no changes will be made."
fi

# ─── Step 1: Check if .hx/ exists ────────────────────────────────────────────

section "── Step 1: Detect .hx/ directory ────────────────────────────────────"

HX_DIR="$REPO_ROOT/.hx"
HX_IS_SYMLINK=false

if [[ ! -e "$HX_DIR" ]]; then
  ok ".hx/ does not exist in this repo — not affected."
  exit 0
fi

if [[ -L "$HX_DIR" ]]; then
  # Scenario C: migration succeeded (symlink in place) but git index was never
  # cleaned — tracked .hx/* files still appear as deleted through the symlink.
  HX_IS_SYMLINK=true
  warn ".hx/ is a symlink — checking for stale git index entries (Scenario C)..."
else
  info ".hx/ is a real directory (Scenario A/B)."
fi

# ─── Step 2: Check if .hx is in .gitignore ───────────────────────────────────

section "── Step 2: Check .gitignore for .hx entry ────────────────────────────"

GITIGNORE="$REPO_ROOT/.gitignore"

if [[ ! -f "$GITIGNORE" ]] && ! $HX_IS_SYMLINK; then
  ok ".gitignore does not exist — not affected."
  exit 0
fi

# Look for a bare ".hx" line (not a comment, not a sub-path like .hx/)
HX_IGNORE_LINE=""
if [[ -f "$GITIGNORE" ]]; then
  while IFS= read -r line; do
    trimmed="${line#"${line%%[![:space:]]*}"}"
    trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
    if [[ "$trimmed" == ".hx" ]] && [[ "${trimmed:0:1}" != "#" ]]; then
      HX_IGNORE_LINE="$trimmed"
      break
    fi
  done < "$GITIGNORE"
fi

if $HX_IS_SYMLINK; then
  # Symlink layout: .hx SHOULD be ignored (it's external state).
  # Missing = needs adding. Present = correct.
  if [[ -z "$HX_IGNORE_LINE" ]]; then
    warn '".hx" missing from .gitignore — will add (migration complete, .hx/ is external).'
  else
    ok '".hx" already in .gitignore — correct for external-state layout.'
  fi
else
  # Real-directory layout: .hx should NOT be ignored.
  if [[ -z "$HX_IGNORE_LINE" ]]; then
    ok '".hx" not found in .gitignore — .gitignore not affected.'
  else
    warn '".hx" found in .gitignore — this is the bad pattern from #1364.'
  fi
fi

# ─── Step 3: Find deleted .hx/ tracked files ─────────────────────────────────

section "── Step 3: Find deleted .hx/ files ───────────────────────────────────"

# Files showing as deleted in the working tree (tracked in index but missing)
DELETED_FILES="$(git ls-files --deleted -- '.hx/*' 2>/dev/null || true)"

# Files tracked in HEAD right now
TRACKED_IN_HEAD="$(git ls-tree -r --name-only HEAD -- '.hx/' 2>/dev/null || true)"

if $HX_IS_SYMLINK; then
  # Scenario C: migration succeeded. Files are safe via symlink.
  # Only index entries can be stale — no need to scan commit history.
  if [[ -z "$TRACKED_IN_HEAD" ]] && [[ -z "$DELETED_FILES" ]]; then
    ok "No stale index entries found — symlink layout is healthy."
    if [[ -z "$HX_IGNORE_LINE" ]]; then
      info "Add .hx to .gitignore manually to complete the migration."
    fi
    exit 0
  fi
  INDEX_COUNT="$(echo "${TRACKED_IN_HEAD:-$DELETED_FILES}" | wc -l | tr -d ' ')"
  warn "Scenario C: ${INDEX_COUNT} .hx/ file(s) tracked in git index but inaccessible through symlink."
  info "Files are safe in external storage — only the git index needs cleaning."
else
  # Files deleted via a committed git rm --cached (Scenario B)
  DELETED_FROM_HISTORY="$(git log --all --diff-filter=D --name-only --format="" -- '.hx/*' 2>/dev/null \
    | grep '^\.hx' | sort -u || true)"

  if [[ -z "$TRACKED_IN_HEAD" ]] && [[ -z "$DELETED_FILES" ]] && [[ -z "$DELETED_FROM_HISTORY" ]]; then
    ok "No .hx/ files tracked in this repo — not affected by #1364."
    if [[ -n "$HX_IGNORE_LINE" ]]; then
      warn '".hx" is still in .gitignore but there is nothing to restore.'
    fi
    exit 0
  fi

  if [[ -n "$TRACKED_IN_HEAD" ]]; then
    TRACKED_COUNT="$(echo "$TRACKED_IN_HEAD" | wc -l | tr -d ' ')"
    info "Scenario A: ${TRACKED_COUNT} .hx/ files still tracked in HEAD."
  elif [[ -n "$DELETED_FROM_HISTORY" ]]; then
    DELETED_HIST_COUNT="$(echo "$DELETED_FROM_HISTORY" | wc -l | tr -d ' ')"
    warn "Scenario B: ${DELETED_HIST_COUNT} .hx/ file(s) deleted in a committed change:"
    echo "$DELETED_FROM_HISTORY" | head -20 | while IFS= read -r f; do echo "    - $f"; done
    if (( DELETED_HIST_COUNT > 20 )); then echo "    ... and $((DELETED_HIST_COUNT - 20)) more"; fi
  fi

  if [[ -n "$DELETED_FILES" ]]; then
    DELETED_COUNT="$(echo "$DELETED_FILES" | wc -l | tr -d ' ')"
    warn "${DELETED_COUNT} .hx/ file(s) missing from working tree:"
    echo "$DELETED_FILES" | head -20 | while IFS= read -r f; do echo "    - $f"; done
    if (( DELETED_COUNT > 20 )); then echo "    ... and $((DELETED_COUNT - 20)) more"; fi
  fi

  if [[ -n "$TRACKED_IN_HEAD" ]] && [[ -z "$DELETED_FILES" ]]; then
    if [[ -z "$HX_IGNORE_LINE" ]]; then
      ok "No action needed — .hx/ is tracked in HEAD and .gitignore is clean."
      exit 0
    fi
    info ".hx/ is tracked in HEAD and working tree is clean — only .gitignore needs fixing."
  fi
fi

# ─── Step 4: Find the last clean commit (Scenario A/B only) ───────────────────

section "── Step 4: Find last clean commit ──────────────────────────────────────"

DAMAGE_COMMIT=""
CLEAN_COMMIT=""
RESTORABLE=""

if $HX_IS_SYMLINK; then
  info "Scenario C: symlink layout — skipping commit history scan (no file restore needed)."
else
  # Find the commit where ".hx" was first added to .gitignore
  # by walking the log and finding the first commit where .gitignore contained ".hx"
  info "Scanning git log to find when .hx was added to .gitignore..."

  # Strategy 1: find the first commit that added ".hx" to .gitignore
  while IFS= read -r sha; do
    content="$(git show "${sha}:.gitignore" 2>/dev/null || true)"
    if echo "$content" | grep -qx '\.hx' 2>/dev/null; then
      DAMAGE_COMMIT="$sha"
      break
    fi
  done < <(git log --format="%H" -- .gitignore)

  # Strategy 2: if .hx files were committed as deleted, find that commit
  if [[ -z "$DAMAGE_COMMIT" ]] && [[ -n "${DELETED_FROM_HISTORY:-}" ]]; then
    info "Searching for the commit that deleted .hx/ files from the index..."
    DAMAGE_COMMIT="$(git log --all --diff-filter=D --format="%H" -- '.hx/*' 2>/dev/null | head -1 || true)"
  fi

  if [[ -z "$DAMAGE_COMMIT" ]]; then
    warn "Could not pinpoint the damage commit — falling back to HEAD."
    CLEAN_COMMIT="HEAD"
  else
    info "Damage commit: $DAMAGE_COMMIT ($(git log --format='%s' -1 "$DAMAGE_COMMIT"))"
    CLEAN_COMMIT="${DAMAGE_COMMIT}^"
    CLEAN_MSG="$(git log --format='%s' -1 "$CLEAN_COMMIT" 2>/dev/null || echo "unknown")"
    info "Restoring from: $CLEAN_COMMIT — $CLEAN_MSG"
  fi

  # Verify the clean commit actually has .hx/ files
  RESTORABLE="$(git ls-tree -r --name-only "$CLEAN_COMMIT" -- '.hx/' 2>/dev/null || true)"
  if [[ -z "$RESTORABLE" ]]; then
    die "No .hx/ files found in restore point $CLEAN_COMMIT — cannot recover. Check git log manually."
  fi

  RESTORABLE_COUNT="$(echo "$RESTORABLE" | wc -l | tr -d ' ')"
  ok "Restore point has ${RESTORABLE_COUNT} .hx/ files available."
fi

# ─── Step 5: Clean index (Scenario C) or restore deleted files (Scenario A/B) ─

if $HX_IS_SYMLINK; then
  section "── Step 5: Clean stale git index entries ───────────────────────────────"

  info "Running: git rm -r --cached --ignore-unmatch .hx/ ..."
  run "git rm -r --cached --ignore-unmatch .hx"
  if ! $DRY_RUN; then
    STILL_STALE="$(git ls-files --deleted -- '.hx/*' 2>/dev/null || true)"
    if [[ -z "$STILL_STALE" ]]; then
      ok "Git index cleaned — no stale .hx/ entries remain."
    else
      warn "$(echo "$STILL_STALE" | wc -l | tr -d ' ') stale entr(ies) still present — may need manual cleanup."
    fi
  fi
else
  section "── Step 5: Restore deleted .hx/ files ────────────────────────────────"

  NEEDS_RESTORE=false
  [[ -n "$DELETED_FILES" ]] && NEEDS_RESTORE=true
  [[ -n "${DELETED_FROM_HISTORY:-}" ]] && [[ -z "$TRACKED_IN_HEAD" ]] && NEEDS_RESTORE=true

  if ! $NEEDS_RESTORE; then
    ok "No deleted files to restore — skipping."
  else
    info "Restoring .hx/ files from $CLEAN_COMMIT..."
    run "git checkout \"$CLEAN_COMMIT\" -- .hx/"
    if ! $DRY_RUN; then
      STILL_MISSING="$(git ls-files --deleted -- '.hx/*' 2>/dev/null || true)"
      if [[ -z "$STILL_MISSING" ]]; then
        ok "All .hx/ files restored successfully."
      else
        MISS_COUNT="$(echo "$STILL_MISSING" | wc -l | tr -d ' ')"
        warn "${MISS_COUNT} file(s) still missing after restore — may need manual recovery:"
        echo "$STILL_MISSING" | head -10 | while IFS= read -r f; do echo "    - $f"; done
      fi
    fi
  fi
fi

# ─── Step 6: Fix .gitignore ───────────────────────────────────────────────────

section "── Step 6: Fix .gitignore ───────────────────────────────────────────────"

if $HX_IS_SYMLINK; then
  # Scenario C: .hx IS external — it should be in .gitignore.  Add if missing.
  if [[ -z "$HX_IGNORE_LINE" ]]; then
    info 'Adding ".hx" to .gitignore (migration complete — .hx/ is external state)...'
    if $DRY_RUN; then
      echo -e "  ${YELLOW}(dry-run)${RESET} Would append: .hx"
    else
      printf '\n# HX external state (symlink — added by recover-hx-1364)\n.hx\n' >> "$GITIGNORE"
      ok '".hx" added to .gitignore.'
    fi
  else
    ok '".hx" already in .gitignore — correct for external-state layout.'
  fi
else
  # Scenario A/B: .hx is a real tracked directory — remove the bad ignore line.
  if [[ -z "$HX_IGNORE_LINE" ]]; then
    ok '".hx" not in .gitignore — nothing to fix.'
  else
    info 'Removing bare ".hx" line from .gitignore...'
    if $DRY_RUN; then
      echo -e "  ${YELLOW}(dry-run)${RESET} Would remove line: .hx"
    else
      # Remove the exact line ".hx" (not comments, not .hx/ subdirs)
      # Use a temp file for portability (no sed -i on all platforms)
      TMP="$(mktemp)"
      grep -v '^\.hx$' "$GITIGNORE" > "$TMP" || true
      mv "$TMP" "$GITIGNORE"
      ok '".hx" line removed from .gitignore.'
    fi
  fi
fi

# ─── Step 7: Stage changes ────────────────────────────────────────────────────

section "── Step 7: Stage recovery changes ──────────────────────────────────────"

if ! $DRY_RUN; then
  CHANGED="$(git status --short -- '.hx/' .gitignore 2>/dev/null || true)"
  if [[ -z "$CHANGED" ]]; then
    ok "No staged changes — working tree was already clean."
  else
    if $HX_IS_SYMLINK; then
      # Scenario C: the git rm --cached already staged the index cleanup.
      # Only stage .gitignore — adding .hx/ would fail (now gitignored).
      git add .gitignore 2>/dev/null || true
    else
      git add .hx/ .gitignore 2>/dev/null || true
    fi
    STAGED_COUNT="$(git diff --cached --name-only -- '.hx/' .gitignore | wc -l | tr -d ' ')"
    ok "${STAGED_COUNT} file(s) staged and ready to commit."
  fi
fi

# ─── Summary ──────────────────────────────────────────────────────────────────

section "── Summary ──────────────────────────────────────────────────────────────"

if $DRY_RUN; then
  echo -e "${YELLOW}Dry-run complete. Re-run without --dry-run to apply changes.${RESET}"
else
  FINAL_STAGED="$(git diff --cached --name-only -- '.hx/' .gitignore 2>/dev/null | wc -l | tr -d ' ')"
  if (( FINAL_STAGED > 0 )); then
    echo -e "${GREEN}Recovery complete. Commit with:${RESET}"
    echo ""
    if $HX_IS_SYMLINK; then
      echo "  git commit -m \"fix: clean stale .hx/ index entries after external-state migration\""
    else
      echo "  git commit -m \"fix: restore .hx/ files deleted by #1364 regression\""
    fi
    echo ""
    echo "Staged files:"
    git diff --cached --name-only -- '.hx/' .gitignore | head -20 | while IFS= read -r f; do
      echo "  + $f"
    done
    TOTAL_STAGED="$(git diff --cached --name-only -- '.hx/' .gitignore | wc -l | tr -d ' ')"
    if (( TOTAL_STAGED > 20 )); then
      echo "  ... and $((TOTAL_STAGED - 20)) more"
    fi
  else
    ok "Repo is healthy — no recovery needed."
  fi
fi
