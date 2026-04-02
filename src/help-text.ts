const SUBCOMMAND_HELP: Record<string, string> = {
  config: [
    'Usage: hx config',
    '',
    'Re-run the interactive setup wizard to configure:',
    '  - LLM provider (Anthropic, OpenAI, Google, etc.)',
    '  - Web search provider (Brave, Tavily, built-in)',
    '  - Remote questions (Discord, Slack, Telegram)',
    '  - Tool API keys (Context7, Jina, Groq)',
    '',
    'All steps are skippable and can be changed later with /login or /search-provider.',
  ].join('\n'),

  update: [
    'Usage: hx update',
    '',
    'Update HX to the latest version.',
    '',
    'Equivalent to: npm install -g @hyperlab/hx@latest',
  ].join('\n'),

  sessions: [
    'Usage: hx sessions',
    '',
    'List all saved sessions for the current directory and interactively',
    'pick one to resume. Shows date, message count, and a preview of the',
    'first message for each session.',
    '',
    'Sessions are stored per-directory, so you only see sessions that were',
    'started from the current working directory.',
    '',
    'Compare with --continue (-c) which always resumes the most recent session.',
  ].join('\n'),

  install: [
    'Usage: hx install <source> [-l, --local]',
    '',
    'Install a package/extension source and run post-install validation (dependency checks, setup).',
    '',
    'Examples:',
    '  hx install npm:@foo/bar',
    '  hx install git:github.com/user/repo',
    '  hx install https://github.com/user/repo',
    '  hx install ./local/path',
  ].join('\n'),

  remove: [
    'Usage: hx remove <source> [-l, --local]',
    '',
    'Remove an installed package source and its settings entry.',
  ].join('\n'),

  list: [
    'Usage: hx list',
    '',
    'List installed package sources from user and project settings.',
  ].join('\n'),

  worktree: [
    'Usage: hx worktree <command> [args]',
    '',
    'Manage isolated git worktrees for parallel work streams.',
    '',
    'Commands:',
    '  list                 List worktrees with status (files changed, commits, dirty)',
    '  merge [name]         Squash-merge a worktree into main and clean up',
    '  clean                Remove all worktrees that have been merged or are empty',
    '  remove <name>        Remove a worktree (--force to remove with unmerged changes)',
    '',
    'The -w flag creates/resumes worktrees for interactive sessions:',
    '  hx -w               Auto-name a new worktree, or resume the only active one',
    '  hx -w my-feature    Create or resume a named worktree',
    '',
    'Lifecycle:',
    '  1. hx -w             Create worktree, start session inside it',
    '  2. (work normally)    All changes happen on the worktree branch',
    '  3. Ctrl+C             Exit — dirty work is auto-committed',
    '  4. hx -w             Resume where you left off',
    '  5. hx worktree merge Squash-merge into main when done',
    '',
    'Examples:',
    '  hx -w                              Start in a new auto-named worktree',
    '  hx -w auth-refactor                Create/resume "auth-refactor" worktree',
    '  hx worktree list                   See all worktrees and their status',
    '  hx worktree merge auth-refactor    Merge and clean up',
    '  hx worktree clean                  Remove all merged/empty worktrees',
    '  hx worktree remove old-branch      Remove a specific worktree',
    '  hx worktree remove old-branch --force  Remove even with unmerged changes',
  ].join('\n'),

  headless: [
    'Usage: hx headless [flags] [command] [args...]',
    '',
    'Run /hx commands without the TUI. Default command: auto',
    '',
    'Flags:',
    '  --timeout N            Overall timeout in ms (default: 300000)',
    '  --json                 JSONL event stream to stdout (alias for --output-format stream-json)',
    '  --output-format <fmt>  Output format: text (default), json (structured result), stream-json (JSONL events)',
    '  --bare                 Minimal context: skip CLAUDE.md, AGENTS.md, user settings, user skills',
    '  --resume <id>          Resume a prior headless session by ID',
    '  --model ID             Override model',
    '  --supervised           Forward interactive UI requests to orchestrator via stdout/stdin',
    '  --response-timeout N   Timeout (ms) for orchestrator response (default: 30000)',
    '  --answers <path>       Pre-supply answers and secrets (JSON file)',
    '  --events <types>       Filter JSONL output to specific event types (comma-separated)',
    '',
    'Commands:',
    '  auto                 Run all queued units continuously (default)',
    '  next                 Run one unit',
    '  status               Show progress dashboard',
    '  new-milestone        Create a milestone from a specification document',
    '  query                JSON snapshot: state + next dispatch + costs (no LLM)',
    '',
    'new-milestone flags:',
    '  --context <path>     Path to spec/PRD file (use \'-\' for stdin)',
    '  --context-text <txt> Inline specification text',
    '  --auto               Start auto-mode after milestone creation',
    '  --verbose            Show tool calls in progress output',
    '',
    'Output formats:',
    '  text         Human-readable progress on stderr (default)',
    '  json         Collect events silently, emit structured HeadlessJsonResult on stdout at exit',
    '  stream-json  Stream JSONL events to stdout in real time (same as --json)',
    '',
    'Examples:',
    '  hx headless                                    Run /hx auto',
    '  hx headless next                               Run one unit',
    '  hx headless --output-format json auto           Structured JSON result on stdout',
    '  hx headless --json status                      Machine-readable JSONL stream',
    '  hx headless --timeout 60000                    With 1-minute timeout',
    '  hx headless --bare auto                        Minimal context (CI/ecosystem use)',
    '  hx headless --resume abc123 auto               Resume a prior session',
    '  hx headless new-milestone --context spec.md    Create milestone from file',
    '  cat spec.md | hx headless new-milestone --context -   From stdin',
    '  hx headless new-milestone --context spec.md --auto    Create + auto-execute',
    '  hx headless --supervised auto                     Supervised orchestrator mode',
    '  hx headless --answers answers.json auto              With pre-supplied answers',
    '  hx headless --events agent_end,extension_ui_request auto   Filtered event stream',
    '  hx headless query                              Instant JSON state snapshot',
    '',
    'Exit codes: 0 = success, 1 = error/timeout, 10 = blocked, 11 = cancelled',
  ].join('\n'),
}

// Alias: `hx wt --help` → same as `hx worktree --help`
SUBCOMMAND_HELP['wt'] = SUBCOMMAND_HELP['worktree']

export function printHelp(version: string): void {
  process.stdout.write(`HX v${version} — Hyperlab Coding Agent\n\n`)
  process.stdout.write('Usage: hx [options] [message...]\n\n')
  process.stdout.write('Options:\n')
  process.stdout.write('  --mode <text|json|rpc|mcp> Output mode (default: interactive)\n')
  process.stdout.write('  --print, -p              Single-shot print mode\n')
  process.stdout.write('  --continue, -c           Resume the most recent session\n')
  process.stdout.write('  --worktree, -w [name]    Start in an isolated worktree (auto-named if omitted)\n')
  process.stdout.write('  --model <id>             Override model (e.g. claude-opus-4-6)\n')
  process.stdout.write('  --no-session             Disable session persistence\n')
  process.stdout.write('  --extension <path>       Load additional extension\n')
  process.stdout.write('  --tools <a,b,c>          Restrict available tools\n')
  process.stdout.write('  --list-models [search]   List available models and exit\n')
  process.stdout.write('  --version, -v            Print version and exit\n')
  process.stdout.write('  --help, -h               Print this help and exit\n')
  process.stdout.write('\nSubcommands:\n')
  process.stdout.write('  config                   Re-run the setup wizard\n')
  process.stdout.write('  install <source>         Install a package/extension source\n')
  process.stdout.write('  remove <source>          Remove an installed package source\n')
  process.stdout.write('  list                     List installed package sources\n')
  process.stdout.write('  update                   Update HX to the latest version\n')
  process.stdout.write('  sessions                 List and resume a past session\n')
  process.stdout.write('  worktree <cmd>           Manage worktrees (list, merge, clean, remove)\n')
  process.stdout.write('  headless [cmd] [args]    Run /hx commands without TUI (default: auto)\n')
  process.stdout.write('\nRun hx <subcommand> --help for subcommand-specific help.\n')
}

export function printSubcommandHelp(subcommand: string, version: string): boolean {
  const help = SUBCOMMAND_HELP[subcommand]
  if (!help) return false
  process.stdout.write(`HX v${version} — Hyperlab Coding Agent\n\n`)
  process.stdout.write(help + '\n')
  return true
}
