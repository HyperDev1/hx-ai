#!/usr/bin/env node
// HX Startup Loader
// Copyright (c) 2026 Jeremy McSpadden <jeremy@fluxlabs.net>
import { fileURLToPath } from 'url'
import { dirname, resolve, join, relative, delimiter } from 'path'
import { existsSync, readFileSync, mkdirSync, symlinkSync, cpSync } from 'fs'

// Fast-path: handle --version/-v and --help/-h before importing any heavy
// dependencies. This avoids loading the entire pi-coding-agent barrel import
// (~1s) just to print a version string.
const hxRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const firstArg = args[0]

// Read package.json once — reused for version, banner, and GSD_VERSION below
let hxVersion = '0.0.0'
try {
  const pkg = JSON.parse(readFileSync(join(hxRoot, 'package.json'), 'utf-8'))
  hxVersion = pkg.version || '0.0.0'
} catch { /* ignore */ }

if (firstArg === '--version' || firstArg === '-v') {
  const env = process.env.HX_ENV
  const suffix = env && env !== 'production' ? ` (${env})` : ''
  process.stdout.write(hxVersion + suffix + '\n')
  process.exit(0)
}

if (firstArg === '--help' || firstArg === '-h') {
  const { printHelp } = await import('./help-text.js')
  printHelp(hxVersion)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Runtime dependency checks — fail fast with clear diagnostics before any
// heavy imports. Reads minimum Node version from the engines field in
// package.json (already parsed above) and verifies git is available.
// ---------------------------------------------------------------------------
{
  const MIN_NODE_MAJOR = 22
  const red = '\x1b[31m'
  const bold = '\x1b[1m'
  const dim = '\x1b[2m'
  const reset = '\x1b[0m'

  // -- Node version --
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
  if (nodeMajor < MIN_NODE_MAJOR) {
    process.stderr.write(
      `\n${red}${bold}Error:${reset} HX requires Node.js >= ${MIN_NODE_MAJOR}.0.0\n` +
      `       You are running Node.js ${process.versions.node}\n\n` +
      `${dim}Install a supported version:${reset}\n` +
      `  nvm install ${MIN_NODE_MAJOR}   ${dim}# if using nvm${reset}\n` +
      `  fnm install ${MIN_NODE_MAJOR}   ${dim}# if using fnm${reset}\n` +
      `  brew install node@${MIN_NODE_MAJOR} ${dim}# macOS Homebrew${reset}\n\n`
    )
    process.exit(1)
  }

  // -- git --
  try {
    const { execFileSync } = await import('child_process')
    execFileSync('git', ['--version'], { stdio: 'ignore' })
  } catch {
    process.stderr.write(
      `\n${red}${bold}Error:${reset} HX requires git but it was not found on PATH.\n\n` +
      `${dim}Install git:${reset}\n` +
      `  https://git-scm.com/downloads\n\n`
    )
    process.exit(1)
  }
}

import { agentDir, appRoot } from './app-paths.js'
import { applyRtkProcessEnv } from './rtk.js'
import { serializeBundledExtensionPaths } from './bundled-extension-paths.js'
import { discoverExtensionEntryPaths } from './extension-discovery.js'
import { loadRegistry, readManifestFromEntryPath, isExtensionEnabled } from './extension-registry.js'
import { renderLogo } from './logo.js'

// pkg/ is a shim directory: contains hx's piConfig (package.json) and pi's
// theme assets (dist/modes/interactive/theme/) without a src/ directory.
// This allows config.js to:
//   1. Read piConfig.name → "hx" (branding)
//   2. Resolve themes via dist/ (no src/ present → uses dist path)
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'pkg')

// MUST be set before any dynamic import of pi SDK fires — this is what config.js
// reads to determine APP_NAME and CONFIG_DIR_NAME
process.env.PI_PACKAGE_DIR = pkgDir
process.env.PI_SKIP_VERSION_CHECK = '1'  // HX runs its own update check in cli.ts — suppress pi's

// HX_ENV — runtime environment. Set by hx-dev (staging) and hx-local (local)
// launch scripts. When not set (npm global install), defaults to production.
const hxEnv = process.env.HX_ENV ?? 'production'
process.env.HX_ENV = hxEnv
process.title = hxEnv === 'production' ? 'hx' : `hx [${hxEnv}]`

// Print branded banner on first launch (before ~/.hx/ exists).
// Set GSD_FIRST_RUN_BANNER so cli.ts skips the duplicate welcome screen.
if (!existsSync(appRoot)) {
  const cyan  = '\x1b[36m'
  const green = '\x1b[32m'
  const dim   = '\x1b[2m'
  const yellow = '\x1b[33m'
  const reset = '\x1b[0m'
  const colorCyan = (s: string) => `${cyan}${s}${reset}`
  const envTag = hxEnv !== 'production' ? ` ${yellow}[${hxEnv}]${reset}` : ''
  process.stderr.write(
    renderLogo(colorCyan) +
    '\n' +
    `  HX — Hyperlab Coding Agent ${dim}v${hxVersion}${reset}${envTag}\n` +
    `  ${green}Welcome.${reset} Setting up your environment...\n\n`
  )
  process.env.HX_FIRST_RUN_BANNER = '1'
}

// HX_CODING_AGENT_DIR — tells pi's getAgentDir() to return ~/.hx/agent/ instead of ~/.hx/agent/
process.env.HX_CODING_AGENT_DIR = agentDir

// RTK environment — make ~/.hx/agent/bin visible to all child-process paths,
// not just the bash tool, and force-disable RTK telemetry for HX-managed use.
applyRtkProcessEnv(process.env)

// NODE_PATH — make hx's own node_modules available to extensions loaded via jiti.
// Without this, extensions (e.g. browser-tools) can't resolve dependencies like
// `playwright` because jiti resolves modules from pi-coding-agent's location, not hx's.
// Prepending hx's node_modules to NODE_PATH fixes this for all extensions.
const hxNodeModules = join(hxRoot, 'node_modules')
process.env.NODE_PATH = [hxNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(delimiter)
// Force Node to re-evaluate module search paths with the updated NODE_PATH.
// Must happen synchronously before cli.js imports → extension loading.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Module } = await import('module');
(Module as any)._initPaths?.()

// HX_VERSION — expose package version so extensions can display it
process.env.HX_VERSION = hxVersion

// HX_BIN_PATH — absolute path to this loader (dist/loader.js), used by patched subagent
// to spawn hx instead of pi when dispatching workflow tasks
process.env.HX_BIN_PATH = process.argv[1]

// HX_WORKFLOW_PATH — absolute path to bundled HX-WORKFLOW.md, used by patched hx extension
// when dispatching workflow prompts. Prefers dist/resources/ (stable, set at build time)
// over src/resources/ (live working tree) — see resource-loader.ts for rationale.
const distRes = join(hxRoot, 'dist', 'resources')
const srcRes = join(hxRoot, 'src', 'resources')
const resourcesDir = existsSync(distRes) ? distRes : srcRes
process.env.HX_WORKFLOW_PATH = join(resourcesDir, 'HX-WORKFLOW.md')

// HX_BUNDLED_EXTENSION_PATHS — dynamically discovered bundled extension entry points.
// Uses the shared discoverExtensionEntryPaths() to scan the bundled resources
// directory, then remaps discovered paths to agentDir (~/.hx/agent/extensions/)
// where initResources() will sync them.
const bundledExtDir = join(resourcesDir, 'extensions')
const agentExtDir = join(agentDir, 'extensions')
const registry = loadRegistry()
const discoveredExtensionPaths = discoverExtensionEntryPaths(bundledExtDir)
  .map((entryPath) => join(agentExtDir, relative(bundledExtDir, entryPath)))
  .filter((entryPath) => {
    const manifest = readManifestFromEntryPath(entryPath)
    if (!manifest) return true  // no manifest = always load
    return isExtensionEnabled(registry, manifest.id)
  })

process.env.HX_BUNDLED_EXTENSION_PATHS = serializeBundledExtensionPaths(discoveredExtensionPaths)

// Respect HTTP_PROXY / HTTPS_PROXY / NO_PROXY env vars for all outbound requests.
// pi-coding-agent's cli.ts sets this, but HX bypasses that entry point — so we
// must set it here before any SDK clients are created.
// Lazy-load undici (~200ms) only when proxy env vars are actually set.
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy) {
  const { EnvHttpProxyAgent, setGlobalDispatcher } = await import('undici')
  setGlobalDispatcher(new EnvHttpProxyAgent())
}

// Ensure workspace packages are linked (or copied on Windows) before importing
// cli.js (which imports @hyperlab/*).
// npm postinstall handles this normally, but npx --ignore-scripts skips postinstall.
// On Windows without Developer Mode or admin rights, symlinkSync will throw even for
// 'junction' type — so we fall back to cpSync (a full directory copy) which works
// everywhere without elevated permissions.
const hxScopeDir = join(hxNodeModules, '@hyperlab')
const packagesDir = join(hxRoot, 'packages')
const wsPackages: Record<string, string> = {
  'hx-native': 'native',
  'hx-agent-core': 'pi-agent-core',
  'hx-ai': 'pi-ai',
  'hx-coding-agent': 'pi-coding-agent',
  'hx-tui': 'pi-tui',
}
try {
  if (!existsSync(hxScopeDir)) mkdirSync(hxScopeDir, { recursive: true })
  for (const [scopeName, dirName] of Object.entries(wsPackages)) {
    const target = join(hxScopeDir, scopeName)
    const source = join(packagesDir, dirName)
    if (!existsSync(source) || existsSync(target)) continue
    try {
      symlinkSync(source, target, 'junction')
    } catch {
      // Symlink failed (common on Windows without Developer Mode / admin).
      // Fall back to a directory copy — slower on first run but universally works.
      try { cpSync(source, target, { recursive: true }) } catch { /* non-fatal */ }
    }
  }
} catch { /* non-fatal */ }

// Validate critical workspace packages are resolvable. If still missing after the
// symlink+copy attempts, emit a clear diagnostic instead of a cryptic
// ERR_MODULE_NOT_FOUND from deep inside cli.js.
const criticalPackages = ['hx-coding-agent']
const missingPackages = criticalPackages.filter(pkg => !existsSync(join(hxScopeDir, pkg)))
if (missingPackages.length > 0) {
  const missing = missingPackages.map(p => `@hyperlab/${p}`).join(', ')
  process.stderr.write(
    `\nError: HX installation is broken — missing packages: ${missing}\n\n` +
    `This is usually caused by one of:\n` +
    `  • An outdated version installed from npm (run: npm install -g @hyperlab/hx@latest)\n` +
    `  • The packages/ directory was excluded from the installed tarball\n` +
    `  • A filesystem error prevented linking or copying the workspace packages\n\n` +
    `Fix it by reinstalling:\n\n` +
    `  npm install -g @hyperlab/hx@latest\n\n` +
    `If the issue persists, please open an issue at:\n` +
    `  https://github.com/hyperlab/hx/issues\n`
  )
  process.exit(1)
}

// Dynamic import defers ESM evaluation — config.js will see PI_PACKAGE_DIR above
await import('./cli.js')
